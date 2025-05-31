import { Controller, Get, Put } from "@nestjs/common";
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
        return this.sagleService.getCurrentSagle();
    }
}