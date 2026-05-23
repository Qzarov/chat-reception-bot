import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Database } from './database';
import { AppConfigModule, AppConfigService } from '@modules/config';
import { CreateSendEventTables1760000000000 } from '../../migrations/1760000000000-create-send-event-tables';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule], // Доступ к AppConfigService
      useFactory: (config: AppConfigService) => ({
        type: 'postgres',
        host: config.dbHost,
        port: config.dbPort,
        username: config.dbUser,
        password: config.dbPass,
        database: config.dbName,
        autoLoadEntities: true,
        migrations: [CreateSendEventTables1760000000000],
        migrationsRun: config.appEnv === 'production',
        migrationsTableName: 'typeorm_migrations',
        synchronize: config.appEnv !== 'production', // Только для разработки!
      }),
      inject: [AppConfigService], // Указываем зависимости
    }),
  ],
  providers: [Database],
})
export class DatabaseModule {}
