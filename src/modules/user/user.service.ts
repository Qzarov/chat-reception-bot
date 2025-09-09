import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, userRoles } from './entities';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(user: UserEntity): Promise<UserEntity> {
    const oldUser = await this.findUserByTgId(user.telegramId);
    if (oldUser === null) {
      const newUser = this.userRepository.create({ ...user });
      console.log(`User @${user.username} added successfully!`);
      return this.userRepository.save(newUser);
    } else {
      console.log(`User @${user.username} already exists!`);
      return oldUser;
    }
  }

  async findUserByTgId(tgId: string | number): Promise<UserEntity | null> {
    const telegramId = String(tgId);
    return await this.userRepository.findOneBy({ telegramId });
  }

  async findUsers(where: Partial<UserEntity>): Promise<UserEntity[]> {
    return this.userRepository.find({ where });
  }

  async findAllUsers(): Promise<UserEntity[]> {
    return this.userRepository.find();
  }

  async updateUser(userData: Partial<UserEntity>): Promise<UserEntity> {
    return this.userRepository.save(userData);
  }

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  async isAdmin(tgId: string | number): Promise<boolean> {
    const telegramId = String(tgId);
    const user = await this.userRepository.findOneBy({ telegramId });
    return user.role === userRoles.admin || user.role === userRoles.super;
  }
}
