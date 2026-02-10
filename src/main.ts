import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  app.enableCors(
    {
      origin: process.env.CLIENT_URL || 'http://localhost:3001', 
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    }
  );

  logger.log(`DB_PASSWORD cargada: ${process.env.DB_PASSWORD ? 'SÍ' : 'NO'}`);
  logger.log(`DB_USERNAME: ${process.env.DB_USERNAME}`);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, 
      transformOptions: {
        enableImplicitConversion: true, 
      }
    })
  );


  const config = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription('Auth endpoints')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`App running on port ${ process.env.PORT }`);
}

bootstrap();
