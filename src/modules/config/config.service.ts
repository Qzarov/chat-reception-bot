import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service dealing with app config based operations.
 *
 * @class
 */
@Injectable()
export class AppConfigService {
  constructor(private _configService: ConfigService) {}

  get appEnv(): string {
    return this._configService.get<string>('config.appEnv') ?? '';
  }

  get dbHost(): string {
    return this._configService.get<string>('config.dbHost') ?? '';
  }

  get dbPort(): number {
    const port = this._configService.get<number>('config.dbPort');
    return Number(port);
  }

  get dbUser(): string {
    return this._configService.get<string>('config.dbUser') ?? '';
  }

  get dbPass(): string {
    return this._configService.get<string>('config.dbPass') ?? '';
  }

  get dbName(): string {
    return this._configService.get<string>('config.dbName') ?? '';
  }

  get botToken(): string {
    return this._configService.get<string>('config.botToken') ?? '';
  }

  get port(): number {
    const port = this._configService.get<number>('config.appPort');
    return Number(port);
  }

  get groupId(): number {
    const groupId = this._configService.get<number>('config.groupId') ?? '';
    return Number(groupId);
  }

  get adminsGroupId(): number {
    const adminsGroupId = this._configService.get<number>('config.adminsGroupId') ?? '';
    return Number(adminsGroupId);
  }
}
