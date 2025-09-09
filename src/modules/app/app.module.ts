import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from '@config/index';
import { TelegramBotModule } from '@modules/bot';
import { UserModule } from '@modules/user';

@Module({
  imports: [AppConfigModule, TelegramBotModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
