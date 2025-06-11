import { Body, Controller, Get, Ip, Put } from "@nestjs/common";
import { SagleService } from "./sagle.service";

@Controller('sagle')
export class SagleController {
    constructor( private readonly sagleService: SagleService) {}
    
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
    async voteGame(@Ip() IpAddress: string, @Body() body: { gameId: number }) {
        const result = await this.sagleService.voteGame(IpAddress, body.gameId);
        return { message: 'Vote registered successfully', success: true, user: result.user, saga: result.saga };
    }

    @Put('attempt')
    async attemptSaga(@Ip() IpAddress: string, @Body() body: { sagaId: number }) {
        const result = await this.sagleService.attemptSaga(IpAddress, body.sagaId);
        return { 
            message: result.haveFoundSagle ? 'You found the Sagle!' : 'Attempt registered successfully',
            success: true,
            haveFoundSagle: result.haveFoundSagle
         };
    }

    @Get('attempts')
    async getAttempts(@Ip() IpAddress: string) {
        const attempts = await this.sagleService.getAttempts(IpAddress);
        return attempts;
    }
}