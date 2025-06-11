import { Module } from '@nestjs/common';
import { SagleController } from './sagle.controller';
import { SagleService } from './sagle.service';
import { SagleScheduler } from './sagle.scheduler';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersService } from 'src/users/users.service';
import { SagleGateway } from './sagle.gateway';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
    imports: [
      ScheduleModule.forRoot(), // Import ScheduleModule to enable scheduling capabilities
      CacheModule.register({
        isGlobal: true, // Make the cache globally available
        ttl: 60 * 60, // Set a default TTL of 1 hour for cache entries
        max: 3000, // Set a maximum number of items in the cache
      })
    ],
  controllers: [SagleController],
  providers: [SagleService, SagleScheduler, UsersService, SagleGateway],
})

export class SagleModule {}