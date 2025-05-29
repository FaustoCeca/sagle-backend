import { Controller, Get, Post, Body, UseGuards, Req, Ip } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { DailyLimitGuard } from '../common/guards/daily-limit.guard';
import { IpGuard } from 'src/auth/ip.guard';
import { Request } from 'express';
import { adminsIps } from 'src/constants/adminsIps';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('register')
  async register(@Body() request: Request, @Ip() ipAddress: string) {
    if (!ipAddress) {
      throw new Error('IP address not found');
    }

    const existentUser = await this.usersService.findUserByIp(ipAddress);

    if (existentUser) {
      return existentUser;
    }

    const createUserParams: UserDto = {
      ipAddress,
      isAdmin: adminsIps.includes(ipAddress),
    }

    return this.usersService.createUser(createUserParams);
  }

  // @UseGuards(IpGuard, DailyLimitGuard)
  // @Get('participate')
  // async participate(@Req() request) {
  //   const ip = request.ip;
  //   return this.usersService.updateUserParticipation(ip);
  // }
}