import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

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
      console.log(`Loaded environment variables from ${envFile}`);
      console.log(`Environment: ${nodeEnv}`);
      console.log(`Db: ${process.env.DATABASE_URL}`);
      dotenv.config({ path: envPath });
    } else {
      console.warn(`Environment file ${envFile} not found. Using default environment variables.`);
      dotenv.config();
    }
  }

  loadEnvFile();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
