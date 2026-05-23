import { CreateSendEventTables1760000000000 } from './1760000000000-create-send-event-tables';

describe('CreateSendEventTables1760000000000', () => {
  const createQueryRunner = () => {
    const queries: string[] = [];
    return {
      queries,
      query: jest.fn(async (sql: string) => {
        queries.push(sql.replace(/\s+/g, ' ').trim());
      }),
    };
  };

  it('creates send/event tables and unique indexes', async () => {
    const migration = new CreateSendEventTables1760000000000();
    const queryRunner = createQueryRunner();

    await migration.up(queryRunner as any);

    expect(queryRunner.queries.join('\n')).toContain('CREATE TABLE IF NOT EXISTS "telegram_chats"');
    expect(queryRunner.queries.join('\n')).toContain('CREATE TABLE IF NOT EXISTS "events"');
    expect(queryRunner.queries.join('\n')).toContain('CREATE TABLE IF NOT EXISTS "send_campaigns"');
    expect(queryRunner.queries.join('\n')).toContain('CREATE TABLE IF NOT EXISTS "send_campaign_targets"');
    expect(queryRunner.queries.join('\n')).toContain('CREATE TABLE IF NOT EXISTS "send_campaign_participants"');
    expect(queryRunner.queries.join('\n')).toContain('idx_telegram_chats_chat_id_unique');
    expect(queryRunner.queries.join('\n')).toContain('idx_send_participant_event_user_unique');
  });

  it('drops created tables and indexes', async () => {
    const migration = new CreateSendEventTables1760000000000();
    const queryRunner = createQueryRunner();

    await migration.down(queryRunner as any);

    expect(queryRunner.queries).toEqual([
      'DROP INDEX IF EXISTS "idx_send_participant_event_user_unique"',
      'DROP TABLE IF EXISTS "send_campaign_participants"',
      'DROP TABLE IF EXISTS "send_campaign_targets"',
      'DROP TABLE IF EXISTS "send_campaigns"',
      'DROP TABLE IF EXISTS "events"',
      'DROP INDEX IF EXISTS "idx_telegram_chats_chat_id_unique"',
      'DROP TABLE IF EXISTS "telegram_chats"',
    ]);
  });
});

