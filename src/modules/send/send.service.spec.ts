import { SendService } from './send.service';
import {
  SendCampaignEntity,
  SendCampaignParticipantEntity,
  SendCampaignTargetEntity,
  TelegramChatEntity,
} from './entities';

class MemoryRepository<T extends { id?: number }> {
  private rows: T[] = [];
  private nextId = 1;

  create(data: Partial<T>): T {
    return { ...(data as T) };
  }

  async save(data: T): Promise<T> {
    if (!data.id) data.id = this.nextId++;
    const index = this.rows.findIndex((row) => row.id === data.id);
    if (index >= 0) this.rows[index] = data;
    else this.rows.push(data);
    return data;
  }

  async findOneBy(where: Partial<T>): Promise<T | null> {
    return this.rows.find((row) => this.matches(row, where)) || null;
  }

  async find(where?: { where?: Partial<T>; order?: Record<string, 'ASC' | 'DESC'> }): Promise<T[]> {
    let rows = where?.where
      ? this.rows.filter((row) => this.matches(row, where.where))
      : [...this.rows];
    if (where?.order) {
      const [key, dir] = Object.entries(where.order)[0];
      rows = rows.sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * (dir === 'ASC' ? 1 : -1);
      });
    }
    return rows;
  }

  all(): T[] {
    return this.rows;
  }

  private matches(row: T, where: Partial<T>): boolean {
    return Object.entries(where).every(([key, value]) => row[key] === value);
  }
}

const createService = () => {
  const chatRepo = new MemoryRepository<TelegramChatEntity>();
  const eventRepo = new MemoryRepository<any>();
  const campaignRepo = new MemoryRepository<SendCampaignEntity>();
  const targetRepo = new MemoryRepository<SendCampaignTargetEntity>();
  const participantRepo = new MemoryRepository<SendCampaignParticipantEntity>();

  const service = new SendService(
    chatRepo as any,
    eventRepo as any,
    campaignRepo as any,
    targetRepo as any,
    participantRepo as any,
  );

  return { service, chatRepo, campaignRepo, targetRepo, participantRepo };
};

describe('SendService', () => {
  it('upserts known Telegram chats by chat id', async () => {
    const { service, chatRepo } = createService();

    await service.upsertKnownChat({ chatId: '-1001', title: 'Old title', type: 'supergroup' });
    await service.upsertKnownChat({ chatId: '-1001', title: 'New title', type: 'supergroup' });

    expect(chatRepo.all()).toHaveLength(1);
    expect(chatRepo.all()[0].title).toBe('New title');
  });

  it('creates a campaign with an event when participation is enabled', async () => {
    const { service, campaignRepo } = createService();

    const campaign = await service.createCampaign({
      createdByTelegramId: '42',
      messageType: 'text',
      messageText: 'Встреча выпускников',
      includeParticipation: true,
    });

    expect(campaign.eventId).toEqual(expect.any(Number));
    expect(campaignRepo.all()[0].messageText).toBe('Встреча выпускников');
  });

  it('adds one participant per event and reports existing joins', async () => {
    const { service } = createService();
    const campaign = await service.createCampaign({
      createdByTelegramId: '42',
      messageType: 'text',
      messageText: 'Встреча выпускников',
      includeParticipation: true,
    });

    const first = await service.joinEvent(campaign.eventId, {
      telegramId: '99',
      username: 'alice',
      firstName: 'Alice',
    });
    const second = await service.joinEvent(campaign.eventId, {
      telegramId: '99',
      username: 'alice2',
      firstName: 'Alice',
    });

    expect(first.created).toBe(true);
    expect(first.count).toBe(1);
    expect(second.created).toBe(false);
    expect(second.count).toBe(1);
  });

  it('formats participant labels with username fallback to name and id', async () => {
    const { service } = createService();
    const campaign = await service.createCampaign({
      createdByTelegramId: '42',
      messageType: 'text',
      messageText: 'Встреча выпускников',
      includeParticipation: true,
    });

    await service.joinEvent(campaign.eventId, { telegramId: '1', username: 'alice' });
    await service.joinEvent(campaign.eventId, { telegramId: '2', firstName: 'Bob', lastName: 'Smith' });
    await service.joinEvent(campaign.eventId, { telegramId: '3' });

    await expect(service.getParticipantLabels(campaign.eventId)).resolves.toEqual([
      '@alice',
      'Bob Smith',
      'id 3',
    ]);
  });
});
