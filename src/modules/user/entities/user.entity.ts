import { RatingEntity } from '@modules/rating';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

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
  username?: string;

  @Column({ type: 'text', nullable: true })
  workCompany?: string;

  @Column({ type: 'text', nullable: true })
  workPosition?: string;

  @Column({ type: 'text', nullable: true })
  areaOfInterest?: string;

  @Column({ type: 'text', nullable: true })
  about?: string;

  @Column({ type: 'text', nullable: true })
  couldHelpWith?: string;

  @Column({ type: 'text', nullable: true })
  request?: string;

  @Column({ type: 'text', nullable: true })
  communityRole?: string;

  @OneToMany(() => RatingEntity, (rating) => rating.user)
  ratings?: RatingEntity[];
}
