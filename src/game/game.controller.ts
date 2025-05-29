// import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
// import { GameService } from './game.service';
// import { GuessDto } from './dto/guess.dto';
// import { DailyLimitGuard } from '../common/guards/daily-limit.guard';
// import { IpGuard } from '../../../sagle-backend/src/auth/ip.guard';

import { Controller, Get } from "@nestjs/common";

// @Controller('game')
// export class GameController {
//   constructor(private readonly gameService: GameService) {}

//   // @Post('guess')
//   // @UseGuards(IpGuard, DailyLimitGuard)
//   // async makeGuess(@Body() guessDto: GuessDto, @Request() req) {
//   //   const ipAddress = req.ip;
//   //   return this.gameService.processGuess(guessDto, ipAddress);
//   // }
// }

@Controller('game')
export class GameController {
    
}