import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

export class RatingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  scores: number;

  @Column({ type: 'text', nullable: true })
  comment: string;
}
