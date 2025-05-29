import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class IpGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userIp = request.ip;

    if (!userIp) {
      throw new Error('IP address not found');
    }

    return this.authService.authenticateUser(userIp);
    // // Check if the user has already participated today
    // const hasParticipated = await this.authService.canParticipate(userIp);
    // return !hasParticipated;
  }
}