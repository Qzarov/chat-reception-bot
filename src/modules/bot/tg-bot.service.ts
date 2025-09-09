/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ctx, Start, Update, On, Command, InjectBot } from 'nestjs-telegraf';

import { Context, Markup, Telegraf } from 'telegraf';
import {
  ctxNextStep,
  ctxPreviousStep,
  ctxStepReply,
  ctxSteps,
  RegisteringUserContext,
} from './types';
import { AppConfigService } from '@modules/config';
import { UserEntity, UserService } from '@modules/user';
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';

@Update()
@Injectable()
export class TelegramBotUpdateService {
  private readonly _logger = new Logger(TelegramBotUpdateService.name);

  constructor(
    @Inject() private readonly _config: AppConfigService,
    private readonly _userService: UserService,
    @InjectBot() private readonly bot: Telegraf,
  ) {}

  @Start()
  async handleStart(@Ctx() ctx: RegisteringUserContext) {
    this._logger.log('handleStart');

    const userTgId = ctx.from.id;
    const isInDb = (await this._userService.findUserByTgId(userTgId)) !== null;

    // If user not in DB
    if (!isInDb) {
      const tgUser = ctx.from;
      const user: UserEntity = {
        telegramId: String(tgUser.id),
        username: tgUser.username,
        isVerified: 0,
      };
      await this._addUser(user);
      this._logger.log(`User @${user.username} (id ${user.telegramId}) added to DB`);

      const keyboard: InlineKeyboardMarkup = {
        inline_keyboard: [[
          {
            text: 'Даю согласие ✅',
            callback_data: 'subscribeNews',
          },
        ]],
      };

      await ctx.reply(
        'Привет! Перед тем, как вступить в чат сообщества выпускников ИТМО, необходимо дать согласие на получение новостей сообщества выпускников ИТМО и пройти проверку администраторов.',
        {
          reply_markup: keyboard
        }
      );
      // ctx.session = { step: ctxSteps.startApprove };
      return;
    }

    // If user in DB
    const user = await this._userService.findUserByTgId(ctx.from.id)
    
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
    await ctx.reply('Вы еще не были верифицированы администраторами сообщества выпускников ИТМО');
  }

  @Command('id')
  async handleChannelId(@Ctx() ctx: RegisteringUserContext) {
    this._logger.log('handleChannelId');
    await ctx.reply(
      `Id чата: \`${ctx.chat.id}\`\nId пользователя: \`${ctx.from.id}\``,
      { parse_mode: 'MarkdownV2' },
    );
    return;
  }

  @Command('checkUser')
  async handleCheckUser(@Ctx() ctx: RegisteringUserContext) {
    this._logger.log('handleCheckUser');

    const data = ctx.text;
    this._logger.log(`callback data: ${data}`);

    const splittedData = data.split(' ');
    if (splittedData.length !== 2) {
      await ctx.reply(
        `Некорректный формат команды. Отправьте команду в формате /checkUser 'userTgId' или /checkUser 'username'`,
      );
      return;
    }

    const userIdentifier: string = splittedData[1];
    if (isNaN(Number(userIdentifier))) {
      const users = await this._userService.findUsers({
        username: userIdentifier,
      });
      if (users.length !== 1) {
        await ctx.reply(
          `По юзернейму @${userIdentifier} найдено ${users.length} пользователей`,
        );
      } else {
        const user = users[0];
        const msg = `Пользователь @${user.username} (id \`${user.telegramId}\`) найден:\n\n${this._generateUserInfoMsg(user)}`;
        await ctx.reply(this._preprocessMessage(msg), {
          parse_mode: 'MarkdownV2',
        });
      }
    } else {
      const user = await this._userService.findUserByTgId(userIdentifier);
      if (user !== null) {
        const msg = this._generateUserInfoMsg(user);
        await ctx.reply(
          `Пользователь @${user.username} \(id \`${user.telegramId}\`) найден:\n\n${'ee'}`,
          { parse_mode: 'MarkdownV2' },
        );
      } else {
        await ctx.reply(`Пользователь id ${userIdentifier} не найден`);
      }
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

    // parse username
    const msgText: string = ctx.update.message.text;
    const splittedMsgText = msgText.split(' ');

    // if no username -> send reply "need username"
    if (splittedMsgText.length !== 2) {
      await ctx.reply(
        `Необходимо указать username пользователя (без символа "@"). Например /verify user_name`,
      );
      return;
    }

    // check if user not in db -> send reply user should apply for participance
    const username = splittedMsgText[1];

    await this._verifyUser(ctx, username, true);
  }

  @Command('createLink')
  async handleCreateLink(@Ctx() ctx: RegisteringUserContext) {
    await ctx.reply(
      `Данная команда недоступна`,
      { parse_mode: 'MarkdownV2' },
    );
    return;
  }

  @On('callback_query')
  async handleCallbackQuery(@Ctx() ctx) {
    this._logger.log('handleCallbackQuery');

    const data = ctx.callbackQuery?.data;
    this._logger.log(`callback data: ${data}`);
    if (!data) return;

    const splittedData = data.split(':');
    this._logger.log(`splitted callback data: ${splittedData}`);

    /**
     * User verified
     */
    if (data.startsWith('userIsAlumni')) {
      this._logger.log(`User verified as Alumni`);
      if (splittedData.length !== 2) {
        this._logger.error(`Invalid callback data: ${data}`);
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
      this._logger.log(`User not verified`);
      if (splittedData.length !== 2) {
        this._logger.error(`Invalid callback data: ${data}`);
        return;
      }
      const username = splittedData[1];

      console.log(`Not verify user ${username}`);
      await this._verifyUser(ctx, username, false);
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
        Markup.button.callback('✅ да', `userIsAlumni:${tgUser.username}`),
        Markup.button.callback(
          '❌ нет',
          `userNotAlumni:${tgUser.username}`,
        ),
      ]);

      await this.bot.telegram.sendMessage(
        this._config.adminsGroupId,
        `Пользователь @${tgUser.username} отправил запрос на верификацию.\n\nВерифицировать участника?`,
        { reply_markup: keyboard.reply_markup },
      );

      /** Reply  */
      await ctx.reply(
        `Спасибо! Ваш запрос на вступление в клуб выпускников ИТМО отправлен администраторам. Как только они подтвердят, что вы учились в ИТМО, я пришлю ссылку на вступления в группу.`,
      );
      return;
    }
  }

  private async _generateInviteLink(
    @Ctx() ctx: RegisteringUserContext,
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
      `Фамиля, имя: ${user.lastName} ${user.firstName}`;
    return msg;
  }

  private async _verifyUser(@Ctx() ctx, username: string, isVerified: boolean) {
    const users = await this._userService.findUsers({ username });

    if (users.length === 0) {
      await ctx.reply(
        `Пользователь не найден. Возможно он не заполнил анкету через бота либо необходимо проверить правильность написания его юзернейма`,
      );
      return;
    }

    if (users.length > 1) {
      await ctx.reply(
        `Найдено несколько пользователей. Такого не должно быть, обратитесь к администратору БД`,
      );
      return;
    }

    const user = users[0];
    if (user.isVerified === 1 || user.isVerified === -1) {
      await ctx.reply(
        `Верификация пользователя @${username} уже была проведена. Результат: ${user.isVerified === 1 ? 'одобрено' : 'отклонено'}`,
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
      await ctx.reply(
        `Пользователь @${username} верифицирован. Одноразовая ссылка для вступления в группу (${inviteLink}) отправлена пользователю в личные сообщения`,
      );

      // send invite link to user
      await this.bot.telegram.sendMessage(
        user.telegramId,
        `Ваше обучение в ИТМО было подтверждено. Одноразовая ссылка для вступления в группу: ${inviteLink}`,
      );
    } else {
      // reply in chat
      await ctx.reply(
        `Запрос пользователя @${username} отклонен, пользователь получил уведомление в личные сообщения`,
      );

      // send invite link to user
      await this.bot.telegram.sendMessage(
        user.telegramId,
        `Ваше обучение в ИТМО не подтверждено`,
      );
    }

    // verify user
    await this._setUserVerified(user, isVerified);
  }

  private _preprocessMessage(text: string): string {
    const processed = text.replace(/[_*[\]()~>#+\-=|{}.!]/g, '\\$&');
    return processed;
  }
}
