import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  appEnv: process.env.APP_ENV,
  appPort: process.env.APP_PORT,
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  dbUser: process.env.DB_USER,
  dbPass: process.env.DB_PASS,
  dbName: process.env.DB_NAME,
  botToken: process.env.BOT_TOKEN,
  groupId: process.env.GROUP_ID,
}));
