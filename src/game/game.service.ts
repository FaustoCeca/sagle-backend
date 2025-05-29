// import { Injectable } from '@nestjs/common';
// import { Guess } from './schemas/guess.schema';
// import { Game } from './schemas/game.schema';
// import { GuessDto } from './dto/guess.dto';

// @Injectable()
// export class GameService {
//   constructor(
//     @InjectModel(Game.name) private gameModel: Model<Game>,
//     @InjectModel(Guess.name) private guessModel: Model<Guess>,
//   ) {}

//   async createGuess(guessDto: GuessDto, ipAddress: string): Promise<Guess> {
//     const guess = new this.guessModel({
//       ...guessDto,
//       ipAddress,
//       createdAt: new Date(),
//     });
//     return guess.save();
//   }

//   async findGuessesByIp(ipAddress: string): Promise<Guess[]> {
//     return this.guessModel.find({ ipAddress }).exec();
//   }

//   async getGameData(): Promise<Game[]> {
//     return this.gameModel.find().exec();
//   }
// }