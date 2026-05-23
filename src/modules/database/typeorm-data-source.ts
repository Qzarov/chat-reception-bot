import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { CreateSendEventTables1760000000000 } from '../../migrations/1760000000000-create-send-event-tables';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity.js'],
  migrations: [CreateSendEventTables1760000000000],
  migrationsTableName: 'typeorm_migrations',
});

