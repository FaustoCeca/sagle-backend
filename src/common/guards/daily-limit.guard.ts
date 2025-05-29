import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';

@Injectable()
export class DailyLimitGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip;

    return true;
    // const lastParticipation = await this.usersService.getLastParticipation(ip);
    // if (!lastParticipation) {
    //   return true; // No participation recorded, allow access
    // }

    // const lastDate = new Date(lastParticipation).setHours(0, 0, 0, 0);
    // const today = new Date().setHours(0, 0, 0, 0);

    // return lastDate < today; // Allow access if last participation was not today
  }
}