import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(user: UserEntity): Promise<UserEntity> {
    const newUser = this.userRepository.create({ ...user });
    return this.userRepository.save(newUser);
  }

  async findUserById(tgId: string | number): Promise<UserEntity> {
    const telegramId = String(tgId);
    return this.userRepository.findOneBy({ telegramId });
  }

  async findAllUsers(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
