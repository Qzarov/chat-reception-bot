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
  fatherName?: string;

  @Column({ type: 'text', nullable: true })
  username?: string;

  @Column({ type: 'text', nullable: true })
  email?: string;
  
  @Column({ type: 'int', nullable: true })
  uniFinishedYear?: number;

  @Column({ type: 'text', nullable: true })
  faculty?: string;

  @Column({ type: 'text', nullable: true })
  workCompany?: string;

  @Column({ type: 'text', nullable: true })
  professionalСompetencies?: string;

  @Column({ type: 'text', nullable: true })
  workPosition?: string;

  @Column({ type: 'text', nullable: true })
  clubActivities?: string;

  @Column({ type: 'bool', nullable: true, default: false })
  readyToHelpClub?: boolean;

  @Column({ type: 'bool', nullable: true, default: false })
  addCompanyToCatalogue?: boolean;

  @Column({ type: 'bool', nullable: true, default: false })
  openCatalogueData?: boolean;

  @Column({ type: 'text', nullable: true })
  valueFromClub?: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  isVerified?: number;

  @OneToMany(() => RatingEntity, (rating) => rating.user)
  ratings?: RatingEntity[];
}
