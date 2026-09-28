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
            // The hint must be looked up/generated against the REAL Sagle, not
            // the masked one returned to clients (BUG-03 made masking the
            // default for getCurrentSagle).
            const currentSagle = await this.sagleService.getUnmaskedSagle();

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