import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { SagaDB } from "src/sagas/sagas.types";
import { UsersService } from "src/users/users.service";
import { SagleGateway } from "./sagle.gateway";
import ProfileExecution from "src/decorators/ProfileExecution";
import { UserDB } from "src/users/users.types";
import { HintService } from "src/hint/hint.service";


@Injectable()
export class SagleService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly usersService: UsersService,
        private readonly sagleGateway: SagleGateway,
        private readonly hintService: HintService
    ) { }
    async resetUsersParticipation(): Promise<void> {
        await this.prisma.user.updateMany({
            where: {
                hasParticipatedToday: true
            },
            data: {
                hasParticipatedToday: false,
                hasVotedToday: false,
                idsAttemptedToday: [],
            }
        })
    }

    async resetInactiveUsersStreak(): Promise<void> {
        await this.prisma.user.updateMany({
            where: {
                hasParticipatedToday: false,
            },
            data: {
                streak: 0,
                idsAttemptedToday: [],
            }
        })
    }

    private async resetCurrentSagle(): Promise<void> {
        await this.prisma.saga.updateMany({
            where: {
                isTheSagle: true
            },
            data: {
                isTheSagle: false,
                wasSagleYesterday: true,
            }
        })
    }

    async resetGamesVotes(): Promise<void> {
        await this.prisma.game.updateMany({
            data: {
                votes: 0
            },
            where: {
                votes: {
                    gt: 0
                }
            }
        });
    }

    async resetYesterdaySagle(): Promise<void> {
        await this.prisma.saga.updateMany({
            where: {
                wasSagleYesterday: true
            },
            data: {
                wasSagleYesterday: false,
            }
        });
    }

    async chooseSagle(): Promise<SagaDB> {
        await this.resetCurrentSagle();

        const elegibleSagas = await this.prisma.saga.findMany({
            where: {
                OR: [
                    { lastTimeBeingSagle: null },
                    {
                        lastTimeBeingSagle: {
                            lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) // 3 days ago
                        }
                    },
                ],
            },
            include: {
                _count: {
                    select: {
                        games: true,
                        artStyles: true,
                        perspectives: true,
                        categories: true,
                    }
                }
            }
        });

        if (elegibleSagas.length === 0) {
            throw new Error("No elegible sagas found");
        }

        const randomIndex = Math.floor(Math.random() * elegibleSagas.length);
        const selectedSagle = elegibleSagas[randomIndex];

        const updatedSagle = await this.prisma.saga.update({
            where: {
                id: selectedSagle.id
            },
            data: {
                isTheSagle: true,
                lastTimeBeingSagle: new Date(),
            },
            include: {
                categories: true,
                perspectives: true,
                artStyles: true,
                games: true,
            }
        });

        // Generate the hint for the new Sagle
        await this.hintService.generateHint(updatedSagle);

        return updatedSagle;
    }

    @ProfileExecution
    async getCurrentSagle(): Promise<SagaDB | null> {
        const sagle = await this.prisma.saga.findFirst({
            where: {
                isTheSagle: true
            },
            include: {
                categories: true,
                perspectives: true,
                artStyles: true,
                games: true,
            }
        });

        return sagle;
    }

    private async getCurrentSagleInTransaction(tx: any): Promise<SagaDB | null> {
        return tx.saga.findFirst({
            where: {
                isTheSagle: true
            },
            include: {
                categories: true,
                perspectives: true,
                artStyles: true,
                games: true,
            }
        })
    }

    @ProfileExecution
    async voteGame(userId: string, gameId: number) {
        return this.prisma.$transaction(async (tx) => {
            // Find user and game in the same transaction
            const [foundedUser, votedGame] = await Promise.all([
                this.usersService.findUserByIdInTransaction(tx, userId),
                tx.game.findUnique({ where: { id: gameId } })
            ]);

            if (!foundedUser) throw new Error("User not found");
            if (!votedGame) throw new Error("Game not found");

            // Update user and game in the same transaction
            const [updatedUser, updatedGame] = await Promise.all([
                tx.user.update({
                    // @ts-ignore
                    where: { id: foundedUser.id },
                    data: { hasVotedToday: true }
                }),
                tx.game.update({
                    where: { id: votedGame.id },
                    data: { votes: { increment: 1 } }
                })
            ]);

            // Get the updated Sagle with fresh game data
            const currentSagle = await this.getCurrentSagleInTransaction(tx);
            if (!currentSagle) throw new Error("No current Sagle found");

            // Emit socket update asynchronously (don't await)
            this.emitVoteUpdateAsync(gameId, updatedUser.id, currentSagle);

            return { user: updatedUser, saga: currentSagle };
        });
    }

    private emitVoteUpdateAsync(gameId: number, userId: string, sagle: SagaDB) {
        setImmediate(() => {
            this.sagleGateway.emiteVoteUpdate(gameId, userId, sagle);
        });
    }

    @ProfileExecution
    async attemptSaga(userId: string, sagaId: number): Promise<{ haveFoundSagle: boolean }> {
        return this.prisma.$transaction(async (tx) => {
            const foundedUser = await this.usersService.findUserByIdInTransaction(tx, userId);
            if (!foundedUser) {
                throw new Error("User not found");
            }

            const currentSagle = await this.getCurrentSagleInTransaction(tx);

            if (!currentSagle) {
                throw new Error("No current Sagle found");
            }

            await tx.user.update({
                // @ts-ignore
                where: { id: foundedUser.id },
                data: {
                    idsAttemptedToday: {
                        push: sagaId
                    },
                }
            })

            const haveFoundSagle = currentSagle.id === sagaId;

            if (haveFoundSagle) {
                await tx.user.update({
                    where: {
                        // @ts-ignore
                        id: foundedUser.id
                    },
                    data: {
                        hasParticipatedToday: true,
                        lastParticipation: new Date(),
                        streak: {
                            increment: 1
                        }
                    }
                });
            }

            return { haveFoundSagle };
        })
    }

    async getAttempts(user: UserDB): Promise<number[]> {
        if (!user) {
            throw new Error("User not found");
        }

        if (!user.idsAttemptedToday) {
            return [];
        }

        const uniqueIds = user.idsAttemptedToday.filter((value, index, self) =>
            self.indexOf(value) === index
        );

        return uniqueIds.map(id => Number(id));
    }

}