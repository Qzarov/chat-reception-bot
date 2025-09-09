import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn({})
  id?: number;

  @Column({ type: 'text', nullable: true })
  telegramId?: string;

  @Column({ type: 'text', nullable: true })
  firstName?: string;

  @Column({ type: 'text', nullable: true })
  lastName?: string;

  @Column({ type: 'bool', default: false })
  stayTuned?: boolean;

  @Column({ type: 'text', nullable: true })
  username?: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  isVerified?: number;
}
