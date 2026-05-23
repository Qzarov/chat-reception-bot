import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('telegram_chats')
export class TelegramChatEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_telegram_chats_chat_id_unique', { unique: true })
  @Column({ type: 'text' })
  chatId: string;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'bool', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}

