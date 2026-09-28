import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as cookieParser from 'cookie-parser';

function loadEnvFile() {
  const nodeEnv = process.env.NODE_ENV || 'development';

  let envFile = '.env';

  if (nodeEnv === 'production') {
    envFile = '.env.prod';
  } else if (nodeEnv === 'staging') {
    envFile = '.env.stgn';
  }

  const envPath = path.resolve(process.cwd(), envFile);

  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    dotenv.config({ path: envPath });
  } else {
    console.warn(`Environment file ${envFile} not found. Using default environment variables.`);
    dotenv.config();
  }
}

async function bootstrap() {
  loadEnvFile();

  const app = await NestFactory.create(AppModule);
  let corsOrigins: string | string[];
  // TODO: fixed CORS origins in production
  if (process.env.CORS_ORIGIN) {
    corsOrigins = process.env.CORS_ORIGIN.includes(',') 
      ? process.env.CORS_ORIGIN.split(',') 
      : process.env.CORS_ORIGIN;
  } else {
    corsOrigins = ['http://localhost:5173', 'https://thesagle.com', 'https://www.thesagle.com', 'https://staging.thesagle.com'];
  }

  // corsOrigins = ['http://localhost:5173', 'https://thesagle.com', 'https://www.thesagle.com', 'https://staging.thesagle.com'];
  

  app.enableCors({
    origin: corsOrigins,
    credentials: true, // CRÍTICO para que las cookies funcionen
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
  });
  app.use(cookieParser())

  // BUG-05: validate & transform incoming bodies so bad input returns 400
  // instead of crashing the service with a 500. `transform` enables the
  // typed DTOs (AttemptDto/VoteDto) to be coerced and validated. We avoid
  // `whitelist` globally because several admin DTOs have no validation
  // decorators and would otherwise be stripped to empty objects.
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
  }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
