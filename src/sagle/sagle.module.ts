import { Module } from '@nestjs/common';
import { SagleController } from './sagle.controller';
import { SagleService } from './sagle.service';
import { SagleScheduler } from './sagle.scheduler';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersService } from 'src/users/users.service';

@Module({
    imports: [
      ScheduleModule.forRoot() // Import ScheduleModule to enable scheduling capabilities
    ],
  controllers: [SagleController],
  providers: [SagleService, SagleScheduler, UsersService],
})

export class SagleModule {}