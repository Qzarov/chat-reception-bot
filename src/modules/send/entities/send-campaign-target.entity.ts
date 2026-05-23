import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('send_campaign_targets')
export class SendCampaignTargetEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  campaignId: number;

  @Column({ type: 'int', nullable: true })
  eventId?: number;

  @Column({ type: 'text' })
  targetType: 'private' | 'group';

  @Column({ type: 'text' })
  chatId: string;

  @Column({ type: 'int' })
  messageId: number;

  @CreateDateColumn()
  createdAt?: Date;
}

