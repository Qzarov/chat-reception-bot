import * as Joi from '@hapi/joi';
import { Global, Module } from '@nestjs/common';
import config from './config';
import { AppConfigService } from './config.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * @module
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      validationSchema: Joi.object({
        APP_NAME: Joi.string().default('App'),
        APP_ENV: Joi.string()
          .valid('development', 'production', 'local')
          .disallow('')
          .default('local')
          .error(new Error('Invalid environment')),
        APP_PORT: Joi.number()
          .required()
          .disallow(0)
          .error(new Error('App port is required')),
        DB_HOST: Joi.string()
          .required()
          .disallow('')
          .error(new Error('DB host is required')),
        DB_PORT: Joi.number()
          .required()
          .disallow(0)
          .error(new Error('DB port is required')),
        DB_USER: Joi.string()
          .required()
          .disallow('')
          .error(new Error('DB user is required')),
        DB_PASS: Joi.string()
          .required()
          .disallow('')
          .error(new Error('DB pass is required')),
        DB_NAME: Joi.string()
          .required()
          .disallow('')
          .error(new Error('DB name is required')),
        BOT_TOKEN: Joi.string()
          .required()
          .disallow('')
          .error(new Error('Bot token is required')),
        GROUP_ID: Joi.number()
          .required()
          .disallow(0)
          .error(new Error('GROUP_ID is invalid or undefined')),
        ADMINS_GROUP_ID: Joi.number()
          .required()
          .disallow(0)
          .error(new Error('ADMINS_GROUP_ID is invalid or undefined')),
      }),
    }),
  ],
  providers: [ConfigService, AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
