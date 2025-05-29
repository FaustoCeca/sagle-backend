import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IpGuard } from './ip.guard';
import { AuthController } from './auth.controller';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [],
  providers: [AuthService, IpGuard, UsersService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}