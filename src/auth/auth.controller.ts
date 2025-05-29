import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Post('login')
  async login(@Req() request: Request) {
    const ipAddress = request.ip;

    console.log('IP Address:', ipAddress); // Log the IP address for debugging

    if (!ipAddress) {
      throw new Error('IP address not found');
    }

    return this.authService.authenticateUser(ipAddress);
  }
}