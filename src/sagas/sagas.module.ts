import { Module } from '@nestjs/common';
import { SagasController } from './sagas.controller';
import { SagasService } from './sagas.service';
import { UploadService } from 'src/uploads/uploads.service';

@Module({
  controllers: [SagasController],
  providers: [SagasService, UploadService],
})
export class SagasModule {}