import { Injectable } from "@nestjs/common";
import { HintService } from "./hint.service";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class HintScheduler {
    constructor (private readonly hintService: HintService) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDeleteHints() {
        try {
            console.log('Deleting old hints...');
            await this.hintService.deleteHints();
            console.log('Old hints deleted successfully');
        } catch (error) {
            console.error('Error deleting old hints:', error);
        }
    }
}