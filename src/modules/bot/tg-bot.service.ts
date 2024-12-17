/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ctx, Start, Update, On } from 'nestjs-telegraf';

import { Context, Markup } from 'telegraf';
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
  ) {}

  @Start()
  async _handleStart(@Ctx() ctx: RegisteringUserContext) {
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

  @On('text')
  async handleText(@Ctx() ctx: RegisteringUserContext) {
    if (
      await this._isMessageFromTargetChat(ctx, String(this._config.groupId))
    ) {
      console.log(`Message from target chat`);
      return;
    }

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
          };
          await this._addUser(user);
          /** Reply  */
          await ctx.reply(
            `Спасибо! Вот твоя ссылка для вступления в чат: ${await this._generateInviteLink(ctx, this._config.groupId)}. Воспользоваться ей можно только один раз в течение 30 минут.`,
          );
          ctx.session.step = 'link-generated';
          break;

        case 'link-generated':
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
  ): Promise<string> {
    try {
      console.log(`Generating link`);
      const inviteLink = await ctx.telegram.createChatInviteLink(chatId, {
        expire_date: Math.floor(Date.now() / 1000) + 1800, // Срок действия: 30 минут
        member_limit: 1, // Лимит: 1 пользователь
      });
      return inviteLink.invite_link;
    } catch (error) {
      this._logger.error(error.message);
      await ctx.reply('Не удалось создать ссылку. Попробуйте позже.');
    }
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
    const chatMember = await ctx.telegram.getChatMember(chatId, ctx.from.id);
    return (
      chatMember.status === 'member' ||
      chatMember.status === 'administrator' ||
      chatMember.status === 'creator'
    );
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
}
