import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { userRoles } from './user.roles';

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

  @Column({ type: 'text', nullable: true })
  fatherName?: string;

  @Column({ type: 'text', nullable: true })
  faculty?: string;

  @Column({ type: 'text', nullable: true })
  uniFinishedYear?: string;

  @Column({ type: 'bool', default: false })
  stayTuned?: boolean;

  @Column({ type: 'text', nullable: true })
  username?: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  isVerified?: number;

  @Column({ type: 'varchar', length: 50, nullable: false, default: userRoles.user })
  role?: string;
}
