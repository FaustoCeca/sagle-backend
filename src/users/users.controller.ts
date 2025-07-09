import { Controller, Get, Post, Body, Req, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { Request, Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }
  @Post('session')
  async createSession(@Res() response: Response, @Body() userDto: UserDto) {
    const newUser = await this.usersService.createSession(userDto);

    const twentyYearsInMilliseconds = 20 * 365 * 24 * 60 * 60 * 1000;

  response.cookie('sagle_session', newUser.id, {
    httpOnly: true,
    maxAge: twentyYearsInMilliseconds, // 20 años
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none',
    path: '/', // Asegura que la cookie esté disponible en toda la aplicación
    secure: true, 
  });

    console.log('New session created for user:', newUser.id);

    return response.json(newUser);
  }

  @Get('session')
  async getCurrentSession(@Req() request: Request) {
    const id = request.cookies['sagle_session'];

    if (!id) {
      return null; // or throw an error, depending on your design
    }

    const user = await this.usersService.getUserById(id);

    if (!user) {
      return null; // or throw an error, depending on your design
    }

    return user;
  }
}