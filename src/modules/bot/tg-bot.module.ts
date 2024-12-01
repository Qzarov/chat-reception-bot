import { Module } from '@nestjs/common';
import { TelegramBotUpdateService } from './tg-bot.service';
import { AppConfigModule, AppConfigService } from '@config/index';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { UserModule } from '@modules/user';
import { RatingModule } from '@modules/rating';

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
    UserModule,
    RatingModule,
  ],
  providers: [TelegramBotUpdateService],
  exports: [TelegramBotUpdateService],
})
export class TelegramBotModule {}
