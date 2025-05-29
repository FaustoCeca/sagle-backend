
import { Module } from '@nestjs/common';
import { UploadService } from './uploads.service';
import { UploadController } from './uploads.controller';

@Module({
  providers: [UploadService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}