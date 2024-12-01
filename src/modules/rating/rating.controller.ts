import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingEntity } from './entities/rating.entity';

@Controller('ratings')
export class RatingController {
  constructor(private readonly userRatingsService: RatingService) {}

  @Post()
  async createRating(
    @Body('userId') userId: number,
    @Body('scores') scores: number,
    @Body('comment') comment: string,
  ): Promise<RatingEntity> {
    return this.userRatingsService.addRating(userId, scores, comment);
  }

  @Get(':userId')
  async getRatingsByUserId(
    @Param('userId') userId: number,
  ): Promise<RatingEntity[]> {
    return this.userRatingsService.getRatingsByUserId(userId);
  }

  @Delete(':id')
  async deleteRating(@Param('id') id: number): Promise<void> {
    return this.userRatingsService.deleteRating(id);
  }
}
