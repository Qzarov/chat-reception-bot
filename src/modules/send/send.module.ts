import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EventEntity,
  SendCampaignEntity,
  SendCampaignParticipantEntity,
  SendCampaignTargetEntity,
  TelegramChatEntity,
} from './entities';
import { SendService } from './send.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      SendCampaignEntity,
      SendCampaignParticipantEntity,
      SendCampaignTargetEntity,
      TelegramChatEntity,
    ]),
  ],
  providers: [SendService],
  exports: [SendService],
})
export class SendModule {}

