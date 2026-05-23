import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EventEntity,
  SendCampaignEntity,
  SendCampaignParticipantEntity,
  SendCampaignTargetEntity,
  TelegramChatEntity,
} from './entities';

type CreateCampaignInput = {
  createdByTelegramId: string;
  messageType: 'text' | 'photo' | string;
  messageText?: string;
  messageFileId?: string;
  messageCaption?: string;
  includeParticipation: boolean;
};

type JoinEventInput = {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
};

@Injectable()
export class SendService {
  constructor(
    @InjectRepository(TelegramChatEntity)
    private readonly chatRepository: Repository<TelegramChatEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    @InjectRepository(SendCampaignEntity)
    private readonly campaignRepository: Repository<SendCampaignEntity>,
    @InjectRepository(SendCampaignTargetEntity)
    private readonly targetRepository: Repository<SendCampaignTargetEntity>,
    @InjectRepository(SendCampaignParticipantEntity)
    private readonly participantRepository: Repository<SendCampaignParticipantEntity>,
  ) {}

  async upsertKnownChat(input: { chatId: string; title?: string; type: string; isActive?: boolean }): Promise<TelegramChatEntity> {
    const existing = await this.chatRepository.findOneBy({ chatId: input.chatId });
    const chat = existing || this.chatRepository.create({ chatId: input.chatId });
    chat.title = input.title || chat.title || input.chatId;
    chat.type = input.type;
    chat.isActive = input.isActive ?? true;
    return this.chatRepository.save(chat);
  }

  async listActiveChats(): Promise<TelegramChatEntity[]> {
    return this.chatRepository.find({ where: { isActive: true }, order: { title: 'ASC' } });
  }

  async createCampaign(input: CreateCampaignInput): Promise<SendCampaignEntity> {
    let eventId: number | undefined;
    if (input.includeParticipation) {
      const event = await this.eventRepository.save(
        this.eventRepository.create({ title: input.messageText || input.messageCaption || 'Событие' }),
      );
      eventId = event.id;
    }

    return this.campaignRepository.save(
      this.campaignRepository.create({
        ...input,
        eventId,
      }),
    );
  }

  async addTarget(input: {
    campaignId: number;
    eventId?: number;
    targetType: 'private' | 'group';
    chatId: string;
    messageId: number;
  }): Promise<SendCampaignTargetEntity> {
    return this.targetRepository.save(this.targetRepository.create(input));
  }

  async getTargetsByEvent(eventId: number): Promise<SendCampaignTargetEntity[]> {
    return this.targetRepository.find({ where: { eventId } });
  }

  async joinEvent(eventId: number, input: JoinEventInput): Promise<{ created: boolean; count: number }> {
    const existing = await this.participantRepository.findOneBy({
      eventId,
      telegramId: input.telegramId,
    });
    if (existing) {
      return { created: false, count: await this.countParticipants(eventId) };
    }

    await this.participantRepository.save(
      this.participantRepository.create({
        eventId,
        telegramId: input.telegramId,
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
      }),
    );
    return { created: true, count: await this.countParticipants(eventId) };
  }

  async countParticipants(eventId: number): Promise<number> {
    return (await this.participantRepository.find({ where: { eventId } })).length;
  }

  async getParticipantLabels(eventId: number): Promise<string[]> {
    const participants = await this.participantRepository.find({
      where: { eventId },
      order: { joinedAt: 'ASC' },
    });
    return participants.map((participant) => {
      if (participant.username) return `@${participant.username}`;
      const name = [participant.firstName, participant.lastName].filter(Boolean).join(' ').trim();
      return name || `id ${participant.telegramId}`;
    });
  }
}

