import { Controller, Get, Post, Body, Req, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { Request, Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }
  // TODO: Validar en el frontend que cuando haya un token existente sagle_session, no llame al post sino al get
  @Post('session')
  async createSession(@Res() response: Response, @Body() userDto: UserDto) {
    const newUser = await this.usersService.createSession(userDto);

    const twentyYearsInMilliseconds = 20 * 365 * 24 * 60 * 60 * 1000;

    response.cookie('sagle_session', newUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: twentyYearsInMilliseconds // 20 years
    });

    return newUser;
  }

  @Get('session')
  async getCurrentSession(@Req() request: Request) {
    const id = request.cookies['sagle_session'];

    if (!id) {
      return null; // or throw an error, depending on your design
    }

    const user = this.usersService.getUserById(id);

    if (!user) {
      return null; // or throw an error, depending on your design
    }

    return user;
  }
}