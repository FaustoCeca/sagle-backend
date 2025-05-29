import { Injectable } from '@nestjs/common';
// import { User } from './schemas/user.schema';
// import { Model } from 'mongoose';
import { UserDto } from './dto/user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDB } from './users.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
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

  async findUserByIp(ip: string): Promise<UserDB | null> {
    return this.prisma.user.findUnique({
      where: { ipAddress: ip }
    })
    // return this.userModel.findOne({ ip }).exec();
  }

  // async updateUserParticipation(ip: string): Promise<User | null> {
  //   return this.userModel.findOneAndUpdate(
  //     { ip },
  //     { lastParticipation: new Date() },
  //     { new: true }
  //   ).exec();
  // }
}