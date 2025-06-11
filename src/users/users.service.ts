import { Inject, Injectable } from '@nestjs/common';
// import { User } from './schemas/user.schema';
// import { Model } from 'mongoose';
import { UserDto } from './dto/user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDB } from './users.types';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import ProfileExecution from 'src/decorators/ProfileExecution';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }
  // constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(userDto: UserDto): Promise<UserDB> {
    console.log('Creating user with IP:', userDto.ipAddress);

    const createdUser = await this.prisma.user.create({
      data: {
        ipAddress: userDto.ipAddress,
        isAdmin: userDto.isAdmin || false,
      }
    });

    return createdUser;
  }

  @ProfileExecution
  async findUserByIp(ip: string): Promise<UserDB | null> {
    const cacheKey = `user:${ip}`;
    const cachedUser = await this.cacheManager.get<UserDB>(cacheKey);

    if (cachedUser) {
      console.log('Cache hit for user:', ip);
      return cachedUser;
    }

    const user = await this.prisma.user.findUnique({
      where: { ipAddress: ip }
    })

    if (user) {
      await this.cacheManager.set(cacheKey, user, 60 * 20); // Cache for 20 minutes
    }

    return user;
  }

  async findUserByIpInTransaction(tx: any, ipAddress: string): Promise<UserDB | null> {
    return tx.user.findUnique({
      where: { ipAddress }
    });
  }

  // async updateUserParticipation(ip: string): Promise<User | null> {
  //   return this.userModel.findOneAndUpdate(
  //     { ip },
  //     { lastParticipation: new Date() },
  //     { new: true }
  //   ).exec();
  // }
}