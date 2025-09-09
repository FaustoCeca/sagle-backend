import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SagleService } from './sagle.service';

@Injectable()
export class SagleScheduler {
    constructor(private readonly sagleService: SagleService) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDailySagleSelection() {
        try {
            console.log('Starting daily Sagle selection...');
            await this.sagleService.chooseSagle();
            console.log('Daily Sagle selected successfully');
        } catch (error) {
            console.error('Error selecting daily Sagle:', error);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleDailyResetParticipation() {
        try {
            console.log('Resetting participation for all users...');
            await this.sagleService.resetUsersParticipation();
            console.log('Participation reset successfully');
        } catch (error) {
            console.error('Error resetting participation:', error);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleResetGamesVotes() {
        try {
            console.log('Resetting votes for all games...');
            await this.sagleService.resetGamesVotes();
            console.log('Votes reset successfully');
        } catch (error) {
            console.error('Error resetting game votes:', error);
        }
    }

    // Quiero que se dispare cada dos dias a la medianoche
    @Cron('0 0 */2 * *')
    async handleYesterdaySagleReset() {
        try {
            console.log('Resetting yesterday\'s Sagle...');
            await this.sagleService.resetYesterdaySagle();
            console.log('Yesterday\'s Sagle reset successfully');
        } catch (error) {
            console.error('Error resetting yesterday\'s Sagle:', error);
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async resetInactiveUsersStreak() {
        try {
            console.log('Resetting streak for inactive users...');
            await this.sagleService.resetInactiveUsersStreak();
            console.log('Inactive users streak reset successfully');
        } catch (error) {
            console.error('Error resetting inactive users streak:', error);
        }
    }
}