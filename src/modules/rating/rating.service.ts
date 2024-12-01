import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RatingEntity } from './entities/rating.entity';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(RatingEntity)
    private readonly _ratingRepository: Repository<RatingEntity>,
  ) {}

  async addRating(
    userId: number,
    scores: number,
    comment: string,
  ): Promise<RatingEntity> {
    const newRating = this._ratingRepository.create({
      user: { id: userId },
      scores,
      comment,
    });
    return this._ratingRepository.save(newRating);
  }

  async getRatingsByUserId(userId: number): Promise<RatingEntity[]> {
    return this._ratingRepository.find({ where: { user: { id: userId } } });
  }

  async deleteRating(id: number): Promise<void> {
    await this._ratingRepository.delete(id);
  }
}
