import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { SagaDB } from "src/sagas/sagas.types";
import { UsersService } from "src/users/users.service";
import { SagleGateway } from "./sagle.gateway";
import ProfileExecution from "src/decorators/ProfileExecution";
import { UserDB } from "src/users/users.types";
import { HintService } from "src/hint/hint.service";
import { compareSagaWithSagle } from "./sagle.comparison";
import { AttemptResult } from "./sagle.types";


const SAGA_INCLUDE = {
    categories: true,
    perspectives: true,
    artStyles: true,
    games: true,
} as const;

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
            include: SAGA_INCLUDE
        });

        // Generate the hint for the new Sagle
        await this.hintService.generateHint(updatedSagle);

        return updatedSagle;
    }

    /**
     * Returns the real (unmasked) Sagle for BACKEND-internal use only
     * (e.g. hint generation). Never return this straight to a client — use
     * `getCurrentSagle(hasWon)` for that so the answer stays hidden (BUG-03).
     */
    async getUnmaskedSagle(): Promise<SagaDB | null> {
        return this.prisma.saga.findFirst({
            where: {
                isTheSagle: true
            },
            include: SAGA_INCLUDE
        });
    }

    /**
     * BUG-03: the answer must never reach a client that hasn't solved it yet.
     * Strip every identifying field so the response carries no information
     * about which saga is today's Sagle.
     */
    private maskSagle(sagle: SagaDB): SagaDB {
        return {
            ...sagle,
            id: -1,
            title: "",
            imageUrl: "",
            link: "",
            hasMultiplayer: "",
            lastTimeBeingSagle: null,
            createdAt: new Date(0),
            games: [],
            categories: [],
            perspectives: [],
            artStyles: [],
        };
    }

    @ProfileExecution
    async getCurrentSagle(hasWon: boolean = false): Promise<SagaDB | null> {
        const sagle = await this.getUnmaskedSagle();
        if (!sagle) {
            return null;
        }
        return hasWon ? sagle : this.maskSagle(sagle);
    }

    private async getCurrentSagleInTransaction(tx: any): Promise<SagaDB | null> {
        return tx.saga.findFirst({
            where: {
                isTheSagle: true
            },
            include: SAGA_INCLUDE
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

            if (!foundedUser) throw new NotFoundException("User not found");
            if (!votedGame) throw new NotFoundException("Game not found");

            // BUG-03: voting happens only after solving the Sagle, and the vote
            // response carries the (now revealed) answer. Block it otherwise so
            // it can't be used to leak today's Sagle.
            if (!foundedUser.hasParticipatedToday) {
                throw new ForbiddenException("Solve today's Sagle before voting");
            }

            // BUG-01: a user can only vote once per day. Reject duplicate votes
            // instead of incrementing again.
            if (foundedUser.hasVotedToday) {
                throw new ConflictException("You have already voted today");
            }

            // Update user and game in the same transaction
            const [updatedUser, updatedGame] = await Promise.all([
                tx.user.update({
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
            if (!currentSagle) throw new NotFoundException("No current Sagle found");

            // Emit socket update asynchronously (don't await)
            this.emitVoteUpdateAsync(gameId, updatedUser.id);

            return { user: updatedUser, saga: currentSagle };
        });
    }

    private emitVoteUpdateAsync(gameId: number, userId: string) {
        setImmediate(() => {
            this.sagleGateway.emiteVoteUpdate(gameId, userId);
        });
    }

    @ProfileExecution
    async attemptSaga(userId: string, sagaId: number): Promise<{ haveFoundSagle: boolean; result: AttemptResult }> {
        return this.prisma.$transaction(async (tx) => {
            const foundedUser = await this.usersService.findUserByIdInTransaction(tx, userId);
            if (!foundedUser) {
                throw new NotFoundException("User not found");
            }

            const currentSagle = await this.getCurrentSagleInTransaction(tx);
            if (!currentSagle) {
                throw new NotFoundException("No current Sagle found");
            }

            // BUG-05: reject guesses for sagas that don't exist (was silently
            // accepted and stored as a 200 "success").
            const guessedSaga: SagaDB | null = await tx.saga.findUnique({
                where: { id: sagaId },
                include: SAGA_INCLUDE,
            });
            if (!guessedSaga) {
                throw new NotFoundException(`Saga with id ${sagaId} not found`);
            }

            const haveFoundSagle = currentSagle.id === sagaId;
            // BUG-03: the comparison runs here, on the server. The client only
            // receives the per-field result, never the Sagle itself.
            const result = compareSagaWithSagle(currentSagle, guessedSaga);

            // BUG-02: once the user has solved today's Sagle, further attempts
            // are no-ops — no streak farming, no duplicate ids, no re-marking.
            if (foundedUser.hasParticipatedToday) {
                return { haveFoundSagle, result };
            }

            const alreadyAttempted = (foundedUser.idsAttemptedToday ?? []).includes(sagaId);
            if (!alreadyAttempted) {
                await tx.user.update({
                    where: { id: foundedUser.id },
                    data: {
                        idsAttemptedToday: {
                            push: sagaId
                        },
                    }
                });
            }

            if (haveFoundSagle) {
                await tx.user.update({
                    where: { id: foundedUser.id },
                    data: {
                        hasParticipatedToday: true,
                        lastParticipation: new Date(),
                        streak: {
                            increment: 1
                        }
                    }
                });
            }

            return { haveFoundSagle, result };
        })
    }

    async getAttempts(user: UserDB): Promise<AttemptResult[]> {
        if (!user) {
            throw new NotFoundException("User not found");
        }

        const ids = (user.idsAttemptedToday ?? []).map((id) => Number(id));
        // De-duplicate, keeping first-seen (oldest) order.
        const uniqueIds = [...new Set(ids)];
        if (uniqueIds.length === 0) {
            return [];
        }

        const sagle = await this.getUnmaskedSagle();
        if (!sagle) {
            return [];
        }

        const sagas: SagaDB[] = await this.prisma.saga.findMany({
            where: { id: { in: uniqueIds } },
            include: SAGA_INCLUDE,
        });
        const byId = new Map(sagas.map((s) => [s.id, s]));

        // Newest attempt first, matching the previous frontend ordering.
        return uniqueIds
            .slice()
            .reverse()
            .map((id) => byId.get(id))
            .filter((saga): saga is SagaDB => Boolean(saga))
            .map((saga) => compareSagaWithSagle(sagle, saga));
    }

}
