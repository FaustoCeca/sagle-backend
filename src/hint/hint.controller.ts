import { Controller, Get } from "@nestjs/common";
import { SagleService } from "src/sagle/sagle.service";
import { HintService } from "./hint.service";

@Controller('hint')
export class HintController {
    constructor(
        readonly sagleService: SagleService,
        readonly hintService: HintService
    ) { }
    @Get()
    async getHint() {
        try {
            const currentSagle = await this.sagleService.getCurrentSagle();

            if (!currentSagle) {
                return { message: 'No current Sagle found', success: false };
            }

            const hint = await this.hintService.getHint(currentSagle);

            return hint;
        } catch (error) {
            console.error('Error in getHint:', error);
            return { message: 'Failed to get hint', success: false, error: error.message };
        }
    }
}