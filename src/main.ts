import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app';
import { AppConfigService } from '@modules/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig: AppConfigService = app.get(AppConfigService);

  const config = new DocumentBuilder()
    .setTitle('Alumnis chat receptionist ')
    .setDescription('The Alumnis chat receptionist  API description')
    .setVersion('1.0')
    .build();

  app.setGlobalPrefix('api');

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document, {
    jsonDocumentUrl: 'swagger/json',
  });

  await app.listen(appConfig.port);

  Logger.log(`Server is running on port ${appConfig.port}`);
}
bootstrap();
