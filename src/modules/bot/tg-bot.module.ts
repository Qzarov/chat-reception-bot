import { Module } from '@nestjs/common';
import { TelegramBotUpdateService } from './tg-bot.service';
import { AppConfigModule, AppConfigService } from '@config/index';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';

@Module({
  imports: [
    AppConfigModule,
    TelegrafModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: async (configService: AppConfigService) => ({
        token: configService.botToken,
        middlewares: [session()], // Подключаем middleware для использования сессий
      }),
    }),
  ],
  providers: [TelegramBotUpdateService],
  exports: [TelegramBotUpdateService],
})
export class TelegramBotModule {}
