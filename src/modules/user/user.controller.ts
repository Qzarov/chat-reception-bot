import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { UserEntity } from './entities';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(
    @Body()
    user: UserEntity,
  ): Promise<UserEntity> {
    return this.userService.createUser(user);
  }

  @Get(':id')
  async getUserById(@Param('id') id: number): Promise<UserEntity> {
    return this.userService.findUserByTgId(id);
  }

  @Get()
  async getAllUsers(): Promise<UserEntity[]> {
    return this.userService.findAllUsers();
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: number): Promise<void> {
    return this.userService.deleteUser(id);
  }
}
