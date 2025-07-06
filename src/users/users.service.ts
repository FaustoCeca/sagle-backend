import { Inject, Injectable } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDB } from './users.types';
import ProfileExecution from 'src/decorators/ProfileExecution';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService,
  ) { }

  async getUserById(userId: string): Promise<UserDB | null> {
    if (!userId) {
      console.error('User ID is required to get user by ID');
      return null;
    }
    return this.prisma.user.findUnique({
      where: {
        id: userId
      }
    })
  }

  @ProfileExecution
  async createSession(userDto: UserDto): Promise<UserDB> {
    if (userDto.userId) {
      const existingUser = await this.findById(userDto.userId);

      if (existingUser) {
        return existingUser;
      }
    }

    const newUser = await this.createUser();

    return newUser;
  }

  @ProfileExecution
  private async findById(userId: number): Promise<UserDB | null> {
    const user = await this.prisma.user.findUnique({
      // @ts-ignore
      where: { id: userId }
    });

    return user;
  }

  private createUser(): Promise<UserDB> {
    return this.prisma.user.create({
      data: {
        hasParticipatedToday: false,
        isAdmin: false,
        hasVotedToday: false,
        idsAttemptedToday: [],
        lastParticipation: null,
        streak: 0,
      }
    })
  }

  async findUserByIdInTransaction(tx: any, id: string): Promise<UserDB | null> {
    return tx.user.findUnique({
      where: { id }
    });
  }
}