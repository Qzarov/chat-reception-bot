import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSendEventTables1760000000000 implements MigrationInterface {
  name = 'CreateSendEventTables1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "telegram_chats" (
        "id" SERIAL NOT NULL,
        "chatId" text NOT NULL,
        "title" text,
        "type" text NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_telegram_chats_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_telegram_chats_chat_id_unique"
      ON "telegram_chats" ("chatId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "events" (
        "id" SERIAL NOT NULL,
        "title" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "send_campaigns" (
        "id" SERIAL NOT NULL,
        "eventId" integer,
        "createdByTelegramId" text NOT NULL,
        "messageType" text NOT NULL,
        "messageText" text,
        "messageFileId" text,
        "messageCaption" text,
        "includeParticipation" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_send_campaigns_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "send_campaign_targets" (
        "id" SERIAL NOT NULL,
        "campaignId" integer NOT NULL,
        "eventId" integer,
        "targetType" text NOT NULL,
        "chatId" text NOT NULL,
        "messageId" integer NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_send_campaign_targets_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "send_campaign_participants" (
        "id" SERIAL NOT NULL,
        "eventId" integer NOT NULL,
        "telegramId" text NOT NULL,
        "username" text,
        "firstName" text,
        "lastName" text,
        "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_send_campaign_participants_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_send_participant_event_user_unique"
      ON "send_campaign_participants" ("eventId", "telegramId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_send_participant_event_user_unique"');
    await queryRunner.query('DROP TABLE IF EXISTS "send_campaign_participants"');
    await queryRunner.query('DROP TABLE IF EXISTS "send_campaign_targets"');
    await queryRunner.query('DROP TABLE IF EXISTS "send_campaigns"');
    await queryRunner.query('DROP TABLE IF EXISTS "events"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_telegram_chats_chat_id_unique"');
    await queryRunner.query('DROP TABLE IF EXISTS "telegram_chats"');
  }
}

