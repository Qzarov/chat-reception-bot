/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ctx, Start, Update, On, Command, InjectBot } from 'nestjs-telegraf';

import { Context, Markup, Telegraf } from 'telegraf';
import {
  ctxNextStep,
  ctxPreviousStep,
  ctxStepReply,
  ctxSteps,
  UserContext,
} from './types';
import { AppConfigService } from '@modules/config';
import { UserEntity, userRoles, UserService } from '@modules/user';
import { SendCampaignEntity, SendService, TelegramChatEntity } from '@modules/send';
import { buildSendSettingsKeyboard, buildSendSettingsText, toggleSelectedGroup } from './send-menu';
import { SendSettings, TelegramMessage } from './types';
import { buildHelpMessage } from './help-message';
import { buildParticipationReplyMarkup } from './participation-keyboard';

@Update()
@Injectable()
export class TelegramBotUpdateService {
  private readonly _logger = new Logger(TelegramBotUpdateService.name);

  constructor(
    @Inject() private readonly _config: AppConfigService,
    private readonly _userService: UserService,
    private readonly _sendService: SendService,
    @InjectBot() private readonly bot: Telegraf,
  ) {}

  @Start()
  async handleStart(@Ctx() ctx: UserContext) {
    this._logger.log('handleStart');

    const startPayload = this._getStartPayload(ctx);
    if (startPayload?.startsWith('event_')) {
      const eventId = Number(startPayload.replace('event_', ''));
      await this._replyEventParticipants(ctx, eventId);
      return;
    }

    const userTgId = ctx.from.id;
    const isInDb = (await this._userService.findUserByTgId(userTgId)) !== null;
    this._logger.log(`User ${userTgId} ${isInDb ? 'is' : 'not'} in db`);

    // If user not in DB
    if (!isInDb) {
      const tgUser = ctx.from;
      const user: UserEntity = {
        telegramId: String(tgUser.id),
        username: tgUser.username,
        isVerified: 0,
        role: userRoles.user,
      };
      await this._addUser(user);
      this._logger.log(
        `User ${this._formatUserLabel(user)} added to DB`,
      );

      const replyText =
        'Привет! \n\nБлагодарим за интерес к клубу выпускников ИТМО.' +
        ' Перед тем как присоединиться к нашему чату, пожалуйста, заполните форму и подпишитесь на новости сообщества в канале @itmoalumni.' +
        '\n\nБудем рады видеть вас в нашей дружной команде!';

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('Приступим', 'start_form_filling')],
      ]);
      await ctx.reply(replyText, keyboard);
      // ctx.session = { step: ctxSteps.startApprove };
      return;
    }

    // If user in DB
    const user = await this._userService.findUserByTgId(ctx.from.id);

    // Check if verificated
    if (user.isVerified) {
      // Check if chat member
      const isChatMember = await this._checkIfChatMember(
        ctx,
        String(this._config.groupId),
      );
      if (isChatMember) {
        // Answer user verified and subscribed
        await ctx.reply(
          'Привет! Вы уже верифицированы как член сообщества и состоите в чате выпускников ИТМО',
        );
        return;
      } else {
        // Answer join group
        await ctx.reply(
          `Привет! Вы уже верифицированы как член сообщества, но не состоите в чате. Приглашаем присоединиться по ссылке: ${await this._generateInviteLink(ctx, this._config.groupId)}`,
        );
        return;
      }
    }

    // User still not verificated
    await ctx.reply(
      'Вы еще не были верифицированы администраторами сообщества выпускников ИТМО',
    );
  }

  @Command('id')
  async handleChannelId(@Ctx() ctx: UserContext) {
    this._logger.log('handleChannelId');
    await ctx.reply(
      `Id чата: \`${ctx.chat.id}\`\nId пользователя: \`${ctx.from.id}\``,
      { parse_mode: 'MarkdownV2' },
    );
    return;
  }

  @Command('help')
  async handleHelp(@Ctx() ctx: UserContext) {
    this._logger.log('handleHelp');
    await ctx.reply(buildHelpMessage(), { parse_mode: 'HTML' });
    return;
  }

  @Command('checkUser')
  async handleCheckUser(@Ctx() ctx: UserContext) {
    this._logger.log('handleCheckUser');

    const data = ctx.text;
    this._logger.log(`callback data: ${data}`);

    const splittedData = data.split(' ');
    if (splittedData.length !== 2) {
      await ctx.reply(
        `Некорректный формат команды. Отправьте команду в формате /checkUser 'userTgId'`,
      );
      return;
    }

    const userIdentifier: string = splittedData[1];
    const user = await this._userService.findUserByTgId(userIdentifier);
    if (user !== null) {
      const msg = `${this._formatUserLabel(user)} найден:\n\n${this._generateUserInfoMsg(user)}`;
      await ctx.reply(this._preprocessMessage(msg), {
        parse_mode: 'MarkdownV2',
      });
    } else {
      await ctx.reply(`Пользователь с id ${userIdentifier} не найден`);
    }

    // await ctx.reply(
    //   `Пользователь: с \`${ctx.from.id}\``,
    //   { parse_mode: 'MarkdownV2' },
    // );
    return;
  }

  @Command('verify')
  async handleVerifyUser(@Ctx() ctx) {
    // check chat from
    if (ctx.chat.id !== this._config.adminsGroupId) {
      // not allowed
      await ctx.reply(
        `Команда должна быть отправлена из чата администраторов`,
        { parse_mode: 'MarkdownV2' },
      );
      return;
    }

    // parse telegram id
    const msgText: string = ctx.update.message.text;
    const splittedMsgText = msgText.split(' ');

    // if no id -> send reply "need telegram id"
    if (splittedMsgText.length !== 2) {
      await ctx.reply(
        `Необходимо указать telegram id пользователя. Например /verify 123456789`,
      );
      return;
    }

    const telegramId = splittedMsgText[1];
    if (isNaN(Number(telegramId))) {
      await ctx.reply(`Telegram id должен быть числом. Например /verify 123456789`);
      return;
    }

    await this._verifyUser(ctx, telegramId, true);
  }

  @Command('createLink')
  async handleCreateLink(@Ctx() ctx: UserContext) {
    await ctx.reply(`Данная команда недоступна`, { parse_mode: 'MarkdownV2' });
    return;
  }

  @Command('send')
  async handleSendCommand(@Ctx() ctx: UserContext) {
    this._logger.log('handleSendCommand');
    if (!(await this._userService.isAdmin(ctx.from.id))) {
      await ctx.reply(
        `You are not an administrator and don't have access to the bot's functionality. Just request it 😉`,
      );
      return;
    }

    ctx.session.state = 'awaiting_message';
    await ctx.reply(`Отправьте сообщение для рассылки:`);
    return;
  }

  @On('text')
  async handleText(@Ctx() ctx) {
    this._logger.log('handleText');

    // Check if msg not from DM
    const isFromGroupChat = await this._isMessageFromTargetChat(
      ctx,
      String(this._config.groupId),
    );
    const isFromAdminsChat = await this._isMessageFromTargetChat(
      ctx,
      String(this._config.adminsGroupId),
    );
    if (isFromGroupChat || isFromAdminsChat) {
      return;
    }

    const userTgId = ctx.from.id;

    console.log('session data:', ctx.session);
    if (ctx.session.state === 'awaiting_message') {
      ctx.session.messageToSend = {
        type: 'text',
        text: ctx.message.text,
        entities: ctx.message.entities,
      };
      ctx.session.sendSettings = this._getDefaultSendSettings();

      ctx.session.state = 'confirming_message';

      await this._replySendSettings(ctx);
      return;
    }

    if ('text' in ctx.message) {
      const text = ctx.message.text;

      switch (ctx.session.step) {
        case ctxSteps.startApprove:
          ctx.session.step = ctxNextStep.startApprove;
          break;

        case ctxSteps.name:
          ctx.session.name = text;
          ctx.session.step = ctxNextStep[ctxSteps.name];
          break;

        case ctxSteps.surname:
          ctx.session.surname = text;
          ctx.session.step = ctxNextStep.surname;
          break;

        case ctxSteps.fatherName:
          ctx.session.fatherName = text;
          ctx.session.step = ctxNextStep.fatherName;
          break;

        case ctxSteps.uniFinishedYear:
          if (
            isNaN(Number(text)) ||
            Number(text) < 1950 ||
            Number(text) > 2035
          ) {
            await ctx.reply('Необходимо ввести число от 1950 до 2035');
            return;
          }

          ctx.session.uniFinishedYear = Number(text);
          ctx.session.step = ctxNextStep.uniFinishedYear;
          break;

        case ctxSteps.faculty:
          ctx.session.faculty = text;

          /** Add user info */
          const tgUser = ctx.from;
          const user: UserEntity = {
            telegramId: String(tgUser.id),
            firstName: ctx.session.name,
            lastName: ctx.session.surname,
            username: tgUser.username,
            fatherName: ctx.session.fatherName,
            uniFinishedYear: ctx.session.uniFinishedYear,
            faculty: ctx.session.faculty,
            isVerified: 0,
          };

          await this._addUser(user);

          // Send message to admins group
          const keyboard = Markup.inlineKeyboard([
            Markup.button.callback('✅ да', `userIsAlumni:${tgUser.id}`),
            Markup.button.callback(
              '❌ нет',
              `userNotAlumni:${tgUser.id}`,
            ),
          ]);

          await this.bot.telegram.sendMessage(
            this._config.adminsGroupId,
            `Пользователь ${this._formatTelegramUserLabel(tgUser)} прислал анкету.\n` +
              `${this._generateUserInfoMsg(user)}` +
              `\n\nВерифицировать участника?`,
            { reply_markup: keyboard.reply_markup },
          );

          // Reply to user
          await ctx.reply(ctxStepReply.verification);
          ctx.session.step = ctxSteps.verification;

          await ctx.replyWithVideo(
            'BAACAgIAAxkBAAFCKnFpi4xEKDT5LJcfIZKgyHW0wY0CwQACiZEAAmAxYUgZnmgIIFHjDDoE',
            {
              caption: ctxStepReply.verification1,
              parse_mode: 'Markdown',
            },
          );

          return;

        case ctxSteps.verification:
          const isVerified = await this._isUserVerified(userTgId);
          ctx.session.step =
            isVerified === 1 || isVerified === -1
              ? ctxSteps.verified
              : ctxSteps.verification;
          break;
      }
      await this._handleFormStep(ctx);
    }
  }

  @On('photo')
  async handlePhoto(@Ctx() ctx) {
    if (ctx.session.state === 'awaiting_message') {
      const photos = ctx.message.photo;

      ctx.session.messageToSend = {
        type: 'photo',
        fileId: photos[photos.length - 1].file_id, // Берем самое большое изображение
        caption: ctx.message.caption || '',
        caption_entities: ctx.message.caption_entities,
      };
      ctx.session.sendSettings = this._getDefaultSendSettings();
      ctx.session.state = 'confirming_message';

      await this._replySendSettings(ctx);
    }
  }

  @On('my_chat_member')
  async handleMyChatMember(@Ctx() ctx) {
    const update = ctx.update?.my_chat_member;
    if (!update?.chat || update.chat.type === 'private') return;

    const status = update.new_chat_member?.status;
    const isActive = !['left', 'kicked'].includes(status);
    await this._sendService.upsertKnownChat({
      chatId: String(update.chat.id),
      title: update.chat.title || update.chat.username || String(update.chat.id),
      type: update.chat.type,
      isActive,
    });
  }

  @On('callback_query')
  async handleCallbackQuery(@Ctx() ctx) {
    this._logger.log('handleCallbackQuery:', ctx);

    const data = ctx.callbackQuery?.data;
    this._logger.log(`callback data: ${data}`);
    if (!data) return;

    const splittedData = data.split(':');
    this._logger.log(`splitted callback data: ${splittedData}`);

    if (data === 'send_toggle_private') {
      ctx.session.sendSettings = {
        ...this._getSessionSendSettings(ctx),
        includePrivate: !this._getSessionSendSettings(ctx).includePrivate,
      };
      await this._editSendSettings(ctx);
      return;
    }

    if (data === 'send_toggle_groups') {
      const settings = this._getSessionSendSettings(ctx);
      ctx.session.sendSettings = {
        ...settings,
        includeGroups: !settings.includeGroups,
      };
      await this._editSendSettings(ctx);
      return;
    }

    if (data === 'send_toggle_participation') {
      const settings = this._getSessionSendSettings(ctx);
      ctx.session.sendSettings = {
        ...settings,
        includeParticipation: !settings.includeParticipation,
      };
      await this._editSendSettings(ctx);
      return;
    }

    if (data === 'send_select_groups') {
      await this._editSendSettings(ctx, true);
      return;
    }

    if (data.startsWith('send_group:')) {
      const chatId = data.slice('send_group:'.length);
      const settings = this._getSessionSendSettings(ctx);
      ctx.session.sendSettings = {
        ...settings,
        includeGroups: true,
        selectedGroupIds: toggleSelectedGroup(settings.selectedGroupIds, chatId),
      };
      await this._editSendSettings(ctx, true);
      return;
    }

    if (data === 'send_groups_done') {
      await this._editSendSettings(ctx);
      return;
    }

    if (data.startsWith('event_join:')) {
      const eventId = Number(data.slice('event_join:'.length));
      const result = await this._sendService.joinEvent(eventId, {
        telegramId: String(ctx.from.id),
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
      });
      await this._refreshEventKeyboards(ctx, eventId, result.count);
      await ctx.answerCbQuery(result.created ? 'Вы в списке' : 'Ты уже идешь');
      return;
    }

    /**
     * Previous step
     */
    if (data.startsWith('toStep')) {
      if (splittedData !== 2) {
        this._logger.error(`Invalid callback data`);
      }
      const toStep = splittedData[1];
      ctx.session.step = toStep;
      this._handleFormStep(ctx);
    }

    /**
     * Verify user command
     */
    if (data.startsWith('userIsAlumni')) {
      this._logger.log(`User verified as Alumni`);
      if (splittedData.length !== 2) {
        this._logger.error(`Invalid callback data: ${data}`);
        return;
      }
      const telegramId = splittedData[1];
      ctx.session.step = ctxSteps.verified;
      await this._verifyUser(ctx, telegramId, true);
      return;
    }

    /**
     * Start form filling
     */
    if (data === 'start_form_filling') {
      this._logger.log(`User start filling form`);

      ctx.session.step = ctxSteps.name;
      await ctx.reply(ctxStepReply.name);
      return;
    }

    /**
     * Command to set user not verified
     */
    if (data.startsWith('userNotAlumni')) {
      this._logger.log(`User not verified`);
      if (splittedData.length !== 2) {
        this._logger.error(`Invalid callback data: ${data}`);
        return;
      }
      const telegramId = splittedData[1];

      console.log(`Not verify user ${telegramId}`);
      ctx.session.step = ctxSteps.verified;
      await this._verifyUser(ctx, telegramId, false);
      return;
    }

    /**
     * User want to receive news
     */
    if (data.startsWith('subscribeNews')) {
      this._logger.log(`User agree to subscribe news`);
      if (splittedData.length !== 1) {
        this._logger.error(`Invalid callback data: ${data}`);
        return;
      }
      const tgUser = ctx.from;

      // send message to admins group
      const keyboard = Markup.inlineKeyboard([
        Markup.button.callback('✅ да', `userIsAlumni:${tgUser.id}`),
        Markup.button.callback('❌ нет', `userNotAlumni:${tgUser.id}`),
      ]);

      await this.bot.telegram.sendMessage(
        this._config.adminsGroupId,
        `Пользователь ${this._formatTelegramUserLabel(tgUser)} отправил запрос на верификацию.\n\nВерифицировать участника?`,
        { reply_markup: keyboard.reply_markup },
      );

      /** Reply  */
      await ctx.reply(
        `Спасибо! Ваш запрос на вступление в клуб выпускников ИТМО отправлен администраторам. Как только они подтвердят, что вы учились в ИТМО, я пришлю ссылку на вступления в группу.`,
      );
      return;
    }

    /**
     * Подтверждение старта рассылки (от админа)
     */
    if (data === 'confirm_send') {
      const sent = await this._confirmSend(ctx);
      if (sent) {
        ctx.session.state = null;
        ctx.session.messageToSend = null;
        ctx.session.sendSettings = null;
      }
      return;
    }

    /**
     * Ожидание нового сообщения для рассылки
     */
    if (data === 'new_message') {
      ctx.session.state = 'awaiting_message';
      ctx.session.sendSettings = null;
      await ctx.reply('Отправьте новое сообщение:');
      return;
    }

    /**
     * Отмена команд
     */
    if (data === 'cancel') {
      await ctx.editMessageText(
        `Команда отменена. Для дальнейшей работы отправьте новую команду`,
        { reply_markup: undefined },
      );
      ctx.session.state = null;
      ctx.session.messageToSend = null;
      ctx.session.sendSettings = null;
      return;
    }
  }

  private async _confirmSend(@Ctx() ctx: UserContext): Promise<boolean> {
    const message = ctx.session.messageToSend;
    const settings = this._getSessionSendSettings(ctx);
    if (!message) {
      await ctx.reply('Нет сообщения для отправки. Запустите /send заново.');
      return false;
    }

    const selectedUsers = settings.includePrivate
      ? await this._userService.findUsers({ stayTuned: true })
      : [];
    const selectedGroupIds = settings.includeGroups ? settings.selectedGroupIds : [];
    if (!selectedUsers.length && !selectedGroupIds.length) {
      await ctx.reply('Выберите хотя бы одну цель отправки.');
      return false;
    }

    const campaign = await this._sendService.createCampaign({
      createdByTelegramId: String(ctx.from.id),
      messageType: message.type,
      messageText: message.text,
      messageFileId: message.fileId,
      messageCaption: message.caption,
      includeParticipation: settings.includeParticipation,
    });
    const participationMarkup = campaign.eventId
      ? await this._buildParticipationReplyMarkup(campaign.eventId, 0)
      : undefined;

    let sent = 0;
    const total = selectedUsers.length + selectedGroupIds.length;

    for (const user of selectedUsers) {
      try {
        const sentMessage = await this._sendPreparedMessage(ctx, user.telegramId, message, participationMarkup);
        await this._storeSentTarget(campaign, 'private', user.telegramId, sentMessage.message_id);
        sent += 1;
        await ctx.editMessageText(`Sending message: ${sent} / ${total}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error at user ${user.username} (id ${user.telegramId}):`, error);
      }
    }

    for (const chatId of selectedGroupIds) {
      try {
        const sentMessage = await this._sendPreparedMessage(ctx, chatId, message, participationMarkup);
        await this._storeSentTarget(campaign, 'group', chatId, sentMessage.message_id);
        sent += 1;
        await ctx.editMessageText(`Sending message: ${sent} / ${total}`);
      } catch (error) {
        console.error(`Error at chat ${chatId}:`, error);
      }
    }

    await ctx.reply(`Done ✅`);
    return true;
  }

  private async _storeSentTarget(
    campaign: SendCampaignEntity,
    targetType: 'private' | 'group',
    chatId: string,
    messageId: number,
  ) {
    await this._sendService.addTarget({
      campaignId: campaign.id,
      eventId: campaign.eventId,
      targetType,
      chatId: String(chatId),
      messageId,
    });
  }

  private async _sendPreparedMessage(
    @Ctx() ctx: UserContext,
    chatId: string,
    message: TelegramMessage,
    replyMarkup?: any,
  ): Promise<any> {
    if (message.type === 'text') {
      return ctx.telegram.sendMessage(chatId, message.text, {
        entities: message.entities as any,
        reply_markup: replyMarkup,
      });
    }

    if (message.type === 'photo') {
      return ctx.telegram.sendPhoto(chatId, message.fileId, {
        caption: message.caption,
        caption_entities: message.caption_entities as any,
        reply_markup: replyMarkup,
      });
    }

    throw new Error(`Unsupported message type: ${message.type}`);
  }

  private _getDefaultSendSettings(): SendSettings {
    return {
      includePrivate: false,
      includeGroups: false,
      includeParticipation: false,
      selectedGroupIds: [],
    };
  }

  private _getSessionSendSettings(ctx: UserContext): SendSettings {
    return ctx.session.sendSettings || this._getDefaultSendSettings();
  }

  private async _replySendSettings(ctx: UserContext) {
    const recipients = await this._userService.findUsers({ stayTuned: true });
    const groups = await this._sendService.listActiveChats();
    const settings = this._getSessionSendSettings(ctx);
    await ctx.reply(
      buildSendSettingsText(settings, recipients.length, groups.length),
      { reply_markup: buildSendSettingsKeyboard(settings, groups.length) },
    );
  }

  private async _editSendSettings(ctx: UserContext, showGroups = false) {
    const recipients = await this._userService.findUsers({ stayTuned: true });
    const groups = await this._sendService.listActiveChats();
    const settings = this._getSessionSendSettings(ctx);
    await ctx.editMessageText(
      buildSendSettingsText(settings, recipients.length, groups.length),
      {
        reply_markup: buildSendSettingsKeyboard(
          settings,
          groups.length,
          showGroups ? groups : undefined,
        ),
      },
    );
    await ctx.answerCbQuery();
  }

  private async _buildParticipationReplyMarkup(eventId: number, count: number) {
    const botUsername = await this._getBotUsername();
    return buildParticipationReplyMarkup(eventId, count, botUsername);
  }

  private async _refreshEventKeyboards(ctx: UserContext, eventId: number, count: number) {
    const targets = await this._sendService.getTargetsByEvent(eventId);
    const replyMarkup = await this._buildParticipationReplyMarkup(eventId, count);
    for (const target of targets) {
      try {
        await ctx.telegram.editMessageReplyMarkup(target.chatId, target.messageId, undefined, replyMarkup);
      } catch (error) {
        console.error(`Failed to refresh event ${eventId} keyboard in chat ${target.chatId}:`, error);
      }
    }
  }

  private async _replyEventParticipants(ctx: UserContext, eventId: number) {
    const labels = await this._sendService.getParticipantLabels(eventId);
    if (!labels.length) {
      await ctx.reply('Пока никто не отметил, что идет.');
      return;
    }
    await ctx.reply(`Идут:\n${labels.map((label) => `• ${label}`).join('\n')}`);
  }

  private async _getBotUsername(): Promise<string> {
    const botInfo = (this.bot as any).botInfo || await this.bot.telegram.getMe();
    return botInfo.username;
  }

  private _getStartPayload(ctx: UserContext): string | undefined {
    const directPayload = (ctx as any).startPayload;
    if (directPayload) return directPayload;
    const text = (ctx.message as any)?.text;
    return typeof text === 'string' ? text.split(' ')[1] : undefined;
  }

  private async _generateInviteLink(
    @Ctx() ctx: UserContext,
    chatId: number,
    expireDate?: number,
  ): Promise<string> {
    try {
      this._logger.log(`Generating link`);
      const inviteLink = await ctx.telegram.createChatInviteLink(chatId, {
        expire_date: expireDate,
        // expire_date: Math.floor(Date.now() / 1000) + 1800, // Срок действия: 30 минут
        member_limit: 1, // Лимит: 1 пользователь
      });
      return inviteLink.invite_link;
    } catch (error) {
      this._logger.error(error.message);
      await ctx.reply('Не удалось создать ссылку. Попробуйте позже.');
    }
  }

  private async _setUserVerified(user: UserEntity, isVerified: boolean) {
    user.isVerified = isVerified ? 1 : -1;
    await this._userService.updateUser(user);
  }

  private async _setUserStayTuned(user: UserEntity, stayTuned: boolean) {
    user.stayTuned = stayTuned;
    await this._userService.updateUser(user);
  }

  private async _addUser(user: UserEntity): Promise<void> {
    try {
      await this._userService.createUser(user);
    } catch (error) {
      console.error(`Failed to add user ${this._formatUserLabel(user)}:`, error.message);
    }
  }

  private async _isUserVerified(telegramId: number): Promise<number> {
    try {
      const user = await this._userService.findUserByTgId(telegramId);
      return user.isVerified;
    } catch (error) {
      console.error(
        `Failed to check if user ${telegramId} verificated:`,
        error.message,
      );
    }
  }

  private async _isUserChatMember(
    ctx: Context,
    chatId: string,
  ): Promise<boolean> {
    try {
      const chatMember = await ctx.telegram.getChatMember(chatId, ctx.from.id);

      return (
        chatMember.status === 'member' ||
        chatMember.status === 'administrator' ||
        chatMember.status === 'creator'
      );
    } catch (err) {
      console.log(`Seems like bot not in chat ${chatId}`);
      return;
    }
  }

  private async _checkIfChatMember(
    ctx: Context,
    chatId: string,
  ): Promise<boolean> {
    return await this._isUserChatMember(ctx, chatId);
  }

  private async _isMessageFromTargetChat(ctx: Context, chatId: string) {
    return String(ctx.chat.id) === chatId;
  }

  private _generateUserInfoMsg(user: UserEntity): string {
    const msg =
      `ФИО: ${user.lastName} ${user.firstName} ${user.fatherName}\n` +
      `Факультет: ${user.faculty} (выпуск ${user.uniFinishedYear} года)`;
    return msg;
  }

  private async _verifyUser(
    @Ctx() ctx,
    telegramId: string,
    isVerified: boolean,
  ) {
    const user = await this._userService.findUserByTgId(telegramId);

    if (user === null) {
      await ctx.reply(
        `Пользователь с id ${telegramId} не найден. Возможно он еще не заполнил анкету через бота.`,
      );
      return;
    }

    if (user.isVerified === 1 || user.isVerified === -1) {
      await ctx.reply(
        `Верификация пользователя ${this._formatUserLabel(user)} уже была проведена. Результат: ${user.isVerified === 1 ? 'одобрено' : 'отклонено'}`,
      );
      return;
    }

    if (isVerified) {
      // send reply "user verified. Invite link:".
      const inviteLink = await this._generateInviteLink(
        ctx,
        this._config.groupId,
      );
      if (typeof inviteLink === 'undefined') {
        await ctx.reply(
          `Проблема при генерации ссылки. Проверьте, что бот обладает достаточными правами для приглашения пользователей по ссылке`,
        );
        return;
      }

      // reply in chat
      try {
        await ctx.reply(
          `Пользователь ${this._formatUserLabel(user)} верифицирован. Одноразовая ссылка для вступления в группу (${inviteLink}) отправлена пользователю в личные сообщения`,
        );
      } catch (err: any) {
        console.error('SendMessage error:', err);

        const params = err?.on?.payload?.parameters || err?.parameters;
        if (params?.migrate_to_chat_id) {
          console.log('NEW CHAT ID:', params.migrate_to_chat_id);
          // здесь можно сразу сохранить новый chat_id в БД
        }

        throw err;
      }

      // send invite link to user
      await this.bot.telegram.sendMessage(
        user.telegramId,
        `Отличные новости! Ваш статус выпускника подтвержден — добро пожаловать в клуб! \nОдноразовая ссылка для вступления в группу: ${inviteLink}`,
      );
    } else {
      // reply in chat
      await ctx.reply(
        `Запрос пользователя ${this._formatUserLabel(user)} отклонен, пользователь получил уведомление в личные сообщения`,
      );

      // send invite link to user
      await this.bot.telegram.sendMessage(
        user.telegramId,
        `Спасибо за терпение. К сожалению, не удалось подтвердить ваш статус выпускника. Возможно, в данных есть ошибка.\n\nПопробуйте подать заявку заново или напишите нам на почту: alumni@itmo.ru.`,
      );
    }

    // verify user
    await this._setUserVerified(user, isVerified);
    await this._setUserStayTuned(user, true);
  }

  private _preprocessMessage(text: string): string {
    const processed = text.replace(/[_*[\]()~>#+\-=|{}.!]/g, '\\$&');
    return processed;
  }

  private _formatUserLabel(user: UserEntity): string {
    return user.username
      ? `@${user.username} (id ${user.telegramId})`
      : `id ${user.telegramId}`;
  }

  private _formatTelegramUserLabel(tgUser: UserContext['from']): string {
    return tgUser.username
      ? `@${tgUser.username} (id ${tgUser.id})`
      : `id ${tgUser.id}`;
  }

  private async _handleFormStep(@Ctx() ctx, step?: string) {
    const s = step ?? ctx.session.step;
    const prevStep = ctxPreviousStep[s];
    const answer = ctxStepReply[s];

    const stepsWithoutBack = [
      ctxSteps.name,
      ctxSteps.verification,
      ctxSteps.verified,
    ];

    if (typeof answer !== 'undefined' && answer.length > 0) {
      const reply_markup = !stepsWithoutBack.includes(s)
        ? Markup.inlineKeyboard([
            Markup.button.callback('⬅️ назад', `toStep:${prevStep}`),
          ]).reply_markup
        : undefined;

      await ctx.reply(answer, { reply_markup });
    }
  }
}
