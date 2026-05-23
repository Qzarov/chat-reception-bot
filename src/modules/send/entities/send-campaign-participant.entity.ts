import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('send_campaign_participants')
@Index('idx_send_participant_event_user_unique', ['eventId', 'telegramId'], { unique: true })
export class SendCampaignParticipantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  eventId: number;

  @Column({ type: 'text' })
  telegramId: string;

  @Column({ type: 'text', nullable: true })
  username?: string;

  @Column({ type: 'text', nullable: true })
  firstName?: string;

  @Column({ type: 'text', nullable: true })
  lastName?: string;

  @CreateDateColumn()
  joinedAt?: Date;
}

