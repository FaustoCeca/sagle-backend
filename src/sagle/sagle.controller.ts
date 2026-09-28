import { Body, Controller, Get, Put, Req } from "@nestjs/common";
import { SagleService } from "./sagle.service";
import { Request } from "express";
import { UsersService } from "src/users/users.service";
import { AttemptDto } from "./dto/attempt.dto";
import { VoteDto } from "./dto/vote.dto";

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
    async getSagle(@Req() request: Request) {
        // BUG-03: only users who already solved today's Sagle get the full
        // answer. Everyone else receives a masked object with no identity.
        const id = request.cookies['sagle_session'];
        const user = id ? await this.userService.getUserById(id) : null;
        const hasWon = Boolean(user?.hasParticipatedToday);
        return this.sagleService.getCurrentSagle(hasWon);
    }

    @Put('vote')
    async voteGame(@Req() request: Request, @Body() body: VoteDto) {
        const id = request.cookies['sagle_session'];

        const user = await this.userService.getUserById(id);

        if (!user || !id ) {
            return { message: 'No session found', success: false };
        }
        const result = await this.sagleService.voteGame(user.id, body.gameId);
        return { message: 'Vote registered successfully', success: true, user: result.user, saga: result.saga };
    }

    @Put('attempt')
    async attemptSaga(@Req() request: Request, @Body() body: AttemptDto) {
        const id = request.cookies['sagle_session'];

        const user = await this.userService.getUserById(id);

        if (!user || !id) {
            return { message: 'No session found', success: false };
        }


        const result = await this.sagleService.attemptSaga(user.id, body.sagaId);
        return {
            message: result.haveFoundSagle ? 'You found the Sagle!' : 'Attempt registered successfully',
            success: true,
            haveFoundSagle: result.haveFoundSagle,
            result: result.result,
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
