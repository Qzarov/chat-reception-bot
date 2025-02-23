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
    const dbUser = await this._userService.findUserById(ctx.from.id);
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
    if (user.isVerified) {
      await ctx.reply(`Пользователь @${username} уже верифицирован`);  
      return
    }

    // send reply "user verified. Invite link:".
    const inviteLink = await this._generateInviteLink(ctx, this._config.groupId)
    if (typeof inviteLink === 'undefined') {
      await ctx.reply(`Проблема при генерации ссылки. Проверьте, что бот обладает достаточными правами для приглашения пользователей по ссылке`)
      return;
    }

    // verify user
    await this._verifyUser(user);

    // reply in chat
    await ctx.reply(`Пользователь @${username} верифицирован. Одноразовая ссылка для вступления в группу (${inviteLink}) отправлена пользователю в личные сообщения`);
    
    // send invite link to user
    await this.bot.telegram.sendMessage(user.telegramId, `Ваше обучение в ИТМО было подтверждено. Одноразовая ссылка для вступления в группу: ${inviteLink}`);
  }

  @Command('createLink')
  async handleCreateLink(@Ctx() ctx: RegisteringUserContext) {}

  @On('text')
  async handleText(@Ctx() ctx: RegisteringUserContext) {
    this._logger.log('handleText');
    if (
      await this._checkAndHandleIfChatMember(ctx, String(this._config.groupId))
    ) {
      return;
    }

    if ('text' in ctx.message) {
      const text = ctx.message.text;

      switch (ctx.session.step) {
        case 'start-approve':
          await ctx.reply('Твое имя?');
          ctx.session.step = 'name';
          break;

        case 'name':
          ctx.session.name = text;
          await ctx.reply('Какая у тебя фамилия?');
          ctx.session.step = 'surname';
          break;

        case 'surname':
          ctx.session.surname = text;
          await ctx.reply(
            'Представься для участников сообщества, расскажи немного о себе:',
          );
          ctx.session.step = 'about';
          break;

        case 'about':
          ctx.session.about = text;
          await ctx.reply('Расскажи о сфере твоих интересов:');
          ctx.session.step = 'areaOfInterest';
          break;

        case 'areaOfInterest':
          ctx.session.goal = text;
          /** Add user */
          const tgUser = ctx.from;
          const user: UserEntity = {
            telegramId: String(tgUser.id),
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            username: tgUser.username,
            about: ctx.session.about,
            isVerified: false,
          };
          await this._addUser(user);
          /** Reply  */
          await ctx.reply(
            `Спасибо! Ваш запрос на вступление в клуб выпускников ИТМО отправлен администраторам. Как только они подтвердят, что вы учились в ИТМО, я пришлю ссылку на вступления в группу.`,
          );

          // await ctx.reply(
          //   `Спасибо! Вот твоя ссылка для вступления в чат: ${await this._generateInviteLink(ctx, this._config.groupId)}. Воспользоваться ей можно только один раз в течение 30 минут.`,
          // );
          ctx.session.step = 'verification';
          
          // ctx.session.step = 'link-generated';
          break;

        case 'verified':
          await ctx.reply(
            `Твоя ссылка для вступления в чат: ${await this._generateInviteLink(ctx, this._config.groupId)}. Воспользоваться ей можно только один раз`,
          );
          break;

        default:
          await ctx.reply('Человек, я тебя не понимаю 🥲');
      }
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

  private async _verifyUser(user: UserEntity) {
    user.isVerified = true
    await this._userService.updateUser(user)
  }

  private async _addUser(user: UserEntity): Promise<void> {
    try {
      await this._userService.createUser(user);
      console.log(`User @${user.username} added successfully!`);
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
}
