import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IpGuard } from './ip.guard';
import { AuthController } from './auth.controller';
import { UsersService } from 'src/users/users.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [CacheModule.register({
    isGlobal: true,
    ttl: 60 * 60, // Cache for 1 hour
    max: 3000, // Maximum number of items in cache
    store: 'memory', // Use memory store for caching
  })],
  providers: [AuthService, IpGuard, UsersService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}