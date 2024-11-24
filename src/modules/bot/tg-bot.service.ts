/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Ctx, Start, Update, On } from 'nestjs-telegraf';

import { Markup } from 'telegraf';
import { RegisteringUserContext } from './types';
import { AppConfigService } from '@modules/config';

@Update()
@Injectable()
export class TelegramBotUpdateService {
  private readonly _logger = new Logger(TelegramBotUpdateService.name);

  constructor(@Inject() private readonly _config: AppConfigService) {}

  @Start()
  async _handleStart(@Ctx() ctx: RegisteringUserContext) {
    await ctx.reply(
      'Привет! Перед тем, как вступить в чат сообщества выпускников ИТМО, ответь, пожалуйста, на несколько коротких вопросов.',
      Markup.keyboard([['Приступим!']]) // Создаем клавиатуру с одной кнопкой
        .resize() // Убираем лишние пустые строки
        .oneTime(), // Клавиатура исчезнет после нажатия кнопки
    );
    ctx.session = { step: 'start-approve' };
  }

  @On('text')
  async handleText(@Ctx() ctx: RegisteringUserContext) {
    this._logger.log(`Get ctx`);

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
          await ctx.reply('Расскажи о себе:');
          ctx.session.step = 'bio';
          break;

        case 'bio':
          ctx.session.bio = text;
          await ctx.reply('Какова цель вступления в чат?');
          ctx.session.step = 'goal';
          break;

        case 'goal':
          ctx.session.goal = text;
          await ctx.reply(
            `Спасибо! Вот твоя ссылка для вступления в чат: ${await this._generateInviteLink(ctx, this._config.groupId)}. Воспользоваться ей можно только один раз`,
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
}
