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

    @Get('win-sagle')
    async winSagle(@Ip() ipAddress: string) {
        console.log('You won the Sagle!');
        await this.sagleService.winSagle(ipAddress);
        return { message: 'You won the Sagle!', success: true };
    }

    @Put('vote')
    async voteGame(@Ip() IpAddress: string, @Body() body: { gameId: number }) {
        await this.sagleService.voteGame(IpAddress, body.gameId);
        return { message: 'Vote registered successfully', success: true };
    }

    @Put('attempt')
    async attemptGame(@Ip() IpAddress: string, @Body() body: { sagaId: number }) {
        const result = await this.sagleService.attemptGame(IpAddress, body.sagaId);
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