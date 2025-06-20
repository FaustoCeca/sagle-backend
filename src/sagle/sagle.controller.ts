import { Body, Controller, Get, Ip, Put, Req } from "@nestjs/common";
import { SagleService } from "./sagle.service";
import { Request } from "express";
import { UsersService } from "src/users/users.service";

@Controller('sagle')
export class SagleController {
    constructor( private readonly sagleService: SagleService,
        private readonly userService: UsersService
    ) {}
    
    @Put('choose-sagle')
    async chooseSagle() {
        return this.sagleService.chooseSagle();
    }

    @Get('get-sagle')
    async getSagle() {
        console.log('Fetching current Sagle');
        return this.sagleService.getCurrentSagle();
    }

    @Put('vote')
    async voteGame(@Req() request: Request, @Body() body: { gameId: number }) {
        const id = request.cookies['sagle_session'];
        
        const user = await this.userService.getUserById(id);

        if (!user || !id ) {
            return { message: 'No session found', success: false };
        }

        const result = await this.sagleService.voteGame(user.id, body.gameId);
        return { message: 'Vote registered successfully', success: true, user: result.user, saga: result.saga };
    }

    @Put('attempt')
    async attemptSaga(@Req() request: Request, @Body() body: { sagaId: number }) {
        const id = request.cookies['sagle_session'];

        const user = await this.userService.getUserById(id);

        if (!user || !id) {
            return { message: 'No session found', success: false };
        }


        const result = await this.sagleService.attemptSaga(user.id, body.sagaId);
        return { 
            message: result.haveFoundSagle ? 'You found the Sagle!' : 'Attempt registered successfully',
            success: true,
            haveFoundSagle: result.haveFoundSagle
         };
    }

    @Get('attempts')
    async getAttempts(@Req() request: Request) {
        const id = request.cookies['sagle_session'];
        const user = await this.userService.getUserById(id);
        
        if (!id || !user) {
            return { message: 'No session found', success: false };
        }

        const attempts = await this.sagleService.getAttempts(user);
        return attempts;
    }
}