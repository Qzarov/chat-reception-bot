import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from '@config/index';
import { TelegramBotModule } from '@modules/bot';
import { UserModule } from '@modules/user';
import { SendModule } from '@modules/send';

@Module({
  imports: [AppConfigModule, TelegramBotModule, UserModule, SendModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
