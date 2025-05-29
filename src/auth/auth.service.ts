import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async authenticateUser(ipAddress: string): Promise<boolean> {
    const user = await this.usersService.findUserByIp(ipAddress);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return true;
  }

  // async canParticipate(ipAddress: string): Promise<boolean> {
  //   const user = await this.usersService.findUserByIp(ipAddress);
  //   if (!user) {
  //     return true; // New user can participate
  //   }
  //   const lastParticipation = user.lastParticipation;
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   return new Date(lastParticipation).getTime() < today.getTime(); // Allow participation if last participation was not today
  // }

}