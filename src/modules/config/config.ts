import { registerAs } from '@nestjs/config';

export default registerAs('config', () => ({
  env: process.env.APP_ENV,
  appPort: process.env.APP_PORT,
  msgDbHost: process.env.DB_HOST,
  msgDbPort: process.env.DB_PORT,
  botToken: process.env.BOT_TOKEN,
  groupId: process.env.GROUP_ID,
}));
