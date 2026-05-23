import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('send_campaigns')
export class SendCampaignEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  eventId?: number;

  @Column({ type: 'text' })
  createdByTelegramId: string;

  @Column({ type: 'text' })
  messageType: string;

  @Column({ type: 'text', nullable: true })
  messageText?: string;

  @Column({ type: 'text', nullable: true })
  messageFileId?: string;

  @Column({ type: 'text', nullable: true })
  messageCaption?: string;

  @Column({ type: 'bool', default: false })
  includeParticipation: boolean;

  @CreateDateColumn()
  createdAt?: Date;
}

