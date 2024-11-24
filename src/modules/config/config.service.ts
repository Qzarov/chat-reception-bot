import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service dealing with app config based operations.
 *
 * @class
 */
@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get env(): string {
    return this.configService.get<string>('config.env') ?? '';
  }
  get dbHost(): string {
    return this.configService.get<string>('config.dbHost') ?? '';
  }
  get dbPort(): number {
    const port = this.configService.get<number>('config.dbPort');
    return Number(port);
  }
  get botToken(): string {
    return this.configService.get<string>('config.botToken') ?? '';
  }
  get port(): number {
    const port = this.configService.get<number>('config.appPort');
    return Number(port);
  }
  get groupId(): number {
    const groupId = this.configService.get<number>('config.groupId') ?? '';
    return Number(groupId);
  }
}
