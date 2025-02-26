/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ctx, Start, Update, On, Command, InjectBot } from 'nestjs-telegraf';

import { Context, Markup, Telegraf } from 'telegraf';
import { RegisteringUserContext } from './types';
import { AppConfigService } from '@modules/config';
import { UserEntity, UserService } from '@modules/user';

@Update()
@Injectable()
export class TelegramBotUpdateService {
  private readonly _logger = new Logger(TelegramBotUpdateService.name);

  constructor(
    @Inject() private readonly _config: AppConfigService,
    private readonly _userService: UserService,
    @InjectBot() private readonly bot: Telegraf
  ) {}

  @Start()
  async handleStart(@Ctx() ctx: RegisteringUserContext) {
    this._logger.log('handleStart');
    if (
      await this._checkAndHandleIfChatMember(ctx, String(this._config.groupId))
    ) {
      return;
    }

    await ctx.reply(
      'Привет! Перед тем, как вступить в чат сообщества выпускников ИТМО, ответь, пожалуйста, на несколько коротких вопросов.',
      Markup.keyboard([['Приступим!']])
        .resize()
        .oneTime(),
    );
    ctx.session = { step: 'start-approve' };
  }

  @Command('id')
  async handleChannelId(@Ctx() ctx: RegisteringUserContext) {
    this._logger.log('handleChannelId');
    await ctx.reply(
      `Id чата: \`${ctx.chat.id}\`\nId пользователя: \`${ctx.from.id}\``, 
      { parse_mode: 'MarkdownV2' }
    );
    return;  
  }

  @Command('verify')
  async handleVerifyUser(@Ctx() ctx) {
    // check chat from
    if (ctx.chat.id !== this._config.adminsGroupId) {
      // not allowed
      await ctx.reply(
        `Команда должна быть отправлена из чата администраторов`, 
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }
    
    // parse username
    const msgText: string = ctx.update.message.text
    const splittedMsgText = msgText.split(' ')
    
    // if no username -> send reply "need username"
    if (splittedMsgText.length !== 2) {
      await ctx.reply(`Необходимо указать username пользователя (без символа "@"). Например /verify user_name`); 
      return;
    }

    // check if user not in db -> send reply user should apply for participance
    const username = splittedMsgText[1];

    await this._verifyUser(ctx, username, true);
  }

  @Command('createLink')
  async handleCreateLink(@Ctx() ctx: RegisteringUserContext) {}

  @On('text')
  async handleText(@Ctx() ctx: RegisteringUserContext) {
    this._logger.log('handleText');
    if (
      await this._isMessageFromTargetChat(ctx, String(this._config.groupId)) ||
      await this._isMessageFromTargetChat(ctx, String(this._config.adminsGroupId))
    ) {
      console.log(`Message from target chat`);
      return;
    }

    if (await this._checkAndHandleIfChatMember(ctx, String(this._config.groupId))) { 
      return; 
    }

    if ('text' in ctx.message) {
      const text = ctx.message.text;

      switch (ctx.session.step) {
        case 'start-approve':
          await ctx.reply('Твое имя:');
          ctx.session.step = 'name';
          break;

        case 'name':
          ctx.session.name = text;
          await ctx.reply('Твоя фамилия:');
          ctx.session.step = 'surname';
          break;

        case 'surname':
          ctx.session.surname = text;
          await ctx.reply(
            'Твое отчество:',
          );
          ctx.session.step = 'fatherName';
          break;

        case 'fatherName':
          ctx.session.fatherName = text;
          await ctx.reply(
            'Твоя электронная почта:',
          );
          ctx.session.step = 'email';
          break;

        case 'email':
          ctx.session.email = text;
          await ctx.reply('Год окончания университета (только число):');
          ctx.session.step = 'uniFinishedYear';
          break;

        case 'uniFinishedYear':
          ctx.session.uniFinishedYear = Number(text);
          await ctx.reply('Твой факультет (аббревиатура):');
          ctx.session.step = 'faculty';
          break;

        case 'faculty':
          ctx.session.faculty = text;
          await ctx.reply('Компания, в которой ты работаешь:');
          ctx.session.step = 'workCompany';
          break;

        case 'workCompany':
          ctx.session.workCompany = text;
          await ctx.reply('Позиция, которую ты занимаешь:');
          ctx.session.step = 'workPosition';
          break;

        case 'workPosition':
          ctx.session.workPosition = text;
          await ctx.reply('Твои профессиональные компетенции:');
          ctx.session.step = 'professionalСompetencies';
          break;

        case 'professionalСompetencies':
          ctx.session.professionalСompetencies = text;
          await ctx.reply('Компетенции и роли, которые готов(-а) исполнять в клубе:');
          ctx.session.step = 'clubActivities';
          break;

        case 'clubActivities':
          ctx.session.clubActivities = text;
          await ctx.reply('Готов(-а) уделять часть времени деятельности клуба? (да / нет)');
          ctx.session.step = 'readyToHelpClub';
          break;

        case 'readyToHelpClub':
          ctx.session.readyToHelpClub = text.toLowerCase() === 'да' ? true : false;
          await ctx.reply('Внести компанию/свои компетенции в реестр? (да / нет)\n\nРеестр - список услуг/компетенций выпускников, которыми они готовы поделиться с университетом или другими выпускниками (в качестве подрядчика/сотрудника/партнера)');
          ctx.session.step = 'addCompanyToCatalogue';
          break;

        case 'addCompanyToCatalogue':
          ctx.session.addCompanyToCatalogue = text.toLowerCase() === 'да' ? true : false;
          await ctx.reply('Открыть данные, внесенные в реестр, для участников клуба? (да / нет)');
          ctx.session.step = 'openCatalogueData';
          break;

        case 'openCatalogueData':
          ctx.session.openCatalogueData = text.toLowerCase() === 'да' ? true : false;
          await ctx.reply('Опиши ценность, которую ожидаешь от клуба:');
          ctx.session.step = 'valueFromClub';
          break;

        case 'valueFromClub':
          ctx.session.valueFromClub = text;
          /** Add user */
          const tgUser = ctx.from;
          const user: UserEntity = {
            telegramId: String(tgUser.id),
            firstName: ctx.session.name,
            lastName: ctx.session.surname,
            username: tgUser.username,
            fatherName: ctx.session.fatherName,
            email: ctx.session.email,
            uniFinishedYear: ctx.session.uniFinishedYear,
            faculty: ctx.session.faculty,
            workCompany: ctx.session.workCompany,
            workPosition: ctx.session.workPosition,
            professionalСompetencies: ctx.session.professionalСompetencies,
            clubActivities: ctx.session.clubActivities,
            readyToHelpClub: ctx.session.readyToHelpClub,
            addCompanyToCatalogue: ctx.session.addCompanyToCatalogue,
            openCatalogueData: ctx.session.openCatalogueData,
            valueFromClub: ctx.session.valueFromClub,
            isVerified: 0,
          };
          await this._addUser(user);

          // send message to admins group
          const keyboard = Markup.inlineKeyboard([
            Markup.button.callback('✅ да', `userIsAlumni:${tgUser.username}`),
            Markup.button.callback('❌ нет', `userNotAlumni:${tgUser.username}`)
          ])

          await this.bot.telegram.sendMessage(
            this._config.adminsGroupId, 
            `Пользователь @${tgUser.username} прислал анкету:\n ${this._generateUserInfoMsg(user)}. \n\nВерифицировать участника?`,
            { reply_markup: keyboard.reply_markup }
          );

          /** Reply  */
          await ctx.reply(
            `Спасибо! Ваш запрос на вступление в клуб выпускников ИТМО отправлен администраторам. Как только они подтвердят, что вы учились в ИТМО, я пришлю ссылку на вступления в группу.`,
          );



          ctx.session.step = 'verification';
          break;

        default:
          await ctx.reply('Человек, я тебя не понимаю 🥲');
      }
    }
  }

  @On('callback_query')
  async handleCallbackQuery(@Ctx() ctx) {
    this._logger.log('handleCallbackQuery');
    

    const data = ctx.callbackQuery?.data;
    this._logger.log(`callback data: ${data}`);
    if (!data) return;

    const splittedData = data.split(':');

    /**
     * User verified
     */
    if (data.startsWith('userIsAlumni')) {
      if (splittedData.length !== 2) {
        this._logger.error(
          `Invalid callback data: ${data}`,
        );
        return;
      }
      const username = splittedData[1];
      await this._verifyUser(ctx, username, true);
      return;
    }

    /**
     * User not verified
     */
    if (data.startsWith('userNotAlumni')) {
      if (splittedData.length !== 2) {
        this._logger.error(
          `Invalid callback data: ${data}`,
        );
        return;
      }
      const username = splittedData[1];
      
      console.log(`Not verify user ${username}`)
      await this._verifyUser(ctx, username, false);
      return;
    }
  }

  private async _generateInviteLink(
    @Ctx() ctx: RegisteringUserContext,
    chatId: number,
    expireDate?: number,
  ): Promise<string> {
    try {
      console.log(`Generating link`);
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
    user.isVerified = isVerified ? 1 : -1
    await this._userService.updateUser(user)
  }

  private async _addUser(user: UserEntity): Promise<void> {
    try {
      await this._userService.createUser(user);
    } catch (error) {
      console.error(`Failed to add user @${user.username}:`, error.message);
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
      console.log(`Seems like bot not in chat ${chatId}`)
      return
    }
  }

  private async _checkAndHandleIfChatMember(
    ctx: Context,
    chatId: string,
  ): Promise<boolean> {
    const isChatMember = await this._isUserChatMember(ctx, chatId);
    if (isChatMember) {
      await ctx.reply(
        'Привет! Я нашел тебя, ты уже состоишь в чате выпускников ИТМО!',
        Markup.keyboard([[]]),
      );
    }
    return isChatMember;
  }

  private async _isMessageFromTargetChat(ctx: Context, chatId: string) {
    return String(ctx.chat.id) === chatId;
  }

  private _generateUserInfoMsg(user: UserEntity): string {
    return `` + 
      `ФИО: ${user.lastName} ${user.firstName} ${user.fatherName}\n` +
      `email: ${user.email}\nОкончил факультет ${user.faculty} в ${user.uniFinishedYear} году\n` +
      `Готов принимать участие в деят-ти клуба: ${user.readyToHelpClub}${user.readyToHelpClub ? `Роль и компетенции: ` + user.clubActivities : ''}\n` +
      `Ценность от клуба: ${user.valueFromClub}`
  }

  private async _verifyUser(@Ctx() ctx, username: string, isVerified: boolean) {
    const users = await this._userService.findUsers({ username });

    if (users.length === 0) {
      await ctx.reply(`Пользователь не найден. Возможно он не заполнил анкету через бота либо необходимо проверить правильность написания его юзернейма`); 
      return;
    }

    if (users.length > 1) {
      await ctx.reply(`Найдено несколько пользователей. Такого не должно быть, обратитесь к администратору БД`); 
      return;
    }

    const user = users[0]
    if (user.isVerified === 1 || user.isVerified === -1) {
      await ctx.reply(`Верификация пользователя @${username} уже была проведена. Результат: ${user.isVerified === 1 ? 'одобрено' : 'отклонено'}`);  
      return
    }

    if (isVerified) {
      // send reply "user verified. Invite link:".
      const inviteLink = await this._generateInviteLink(ctx, this._config.groupId)
      if (typeof inviteLink === 'undefined') {
        await ctx.reply(`Проблема при генерации ссылки. Проверьте, что бот обладает достаточными правами для приглашения пользователей по ссылке`)
        return;
      }

      // reply in chat
      await ctx.reply(`Пользователь @${username} верифицирован. Одноразовая ссылка для вступления в группу (${inviteLink}) отправлена пользователю в личные сообщения`);
      
      // send invite link to user
      await this.bot.telegram.sendMessage(user.telegramId, `Ваше обучение в ИТМО было подтверждено. Одноразовая ссылка для вступления в группу: ${inviteLink}`);
    } else {
      // reply in chat
      await ctx.reply(`Запрос пользователя @${username} отклонен, пользователь получил уведомление в личные сообщения`);

      // send invite link to user
      await this.bot.telegram.sendMessage(user.telegramId, `Ваше обучение в ИТМО не подтверждено`);
    }

    // verify user
    await this._setUserVerified(user, isVerified);
  }
}
