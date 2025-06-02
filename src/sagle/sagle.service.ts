import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { SagaDB } from "src/sagas/sagas.types";
import { UsersService } from "src/users/users.service";

@Injectable()
export class SagleService {
    constructor(private readonly prisma: PrismaService, 
        private readonly usersService: UsersService
    ) {}

    async resetUsersParticipation(): Promise<void> {
        await this.prisma.user.updateMany({
            data: {
                hasParticipatedToday: false,
                hasVotedToday: false,
            },
            where: {
                hasParticipatedToday: true
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

    async chooseSagle(): Promise<SagaDB> {
        await this.resetCurrentSagle();

        const elegibleSagas = await this.prisma.saga.findMany({
            where: {
                OR: [
                    {lastTimeBeingSagle: null},
                    {
                        lastTimeBeingSagle: {
                            lt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) // 5 days ago
                        }
                    }
                ]
            }
        });

        if (elegibleSagas.length === 0) {
            throw new Error("No elegible sagas found");
        }

        const randomeIndex = Math.floor(Math.random() * elegibleSagas.length);
        const selectedSagle = elegibleSagas[randomeIndex];

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

        return updatedSagle;
    }

    async getCurrentSagle(): Promise<SagaDB | null> {
        return this.prisma.saga.findFirst({
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
    }

    async winSagle(ipAddress: string): Promise<void> {
        const foundedUser = await this.usersService.findUserByIp(ipAddress);

        if (!foundedUser) {
            throw new Error("User not found");
        }

        await this.prisma.user.update({
            where: {
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

    async voteGame(ipAddress: string, gameId: number): Promise<void> {
        const [foundedUser, votedGame] = await Promise.all([
            this.usersService.findUserByIp(ipAddress),
            this.prisma.game.findUnique({
                where: {
                    id: gameId
                }
            })
        ]);

        if (!foundedUser) {
            throw new Error("User not found");
        }

        await Promise.all([
            this.prisma.user.update({
                where: {
                    id: foundedUser.id
                },
                data: {
                    hasVotedToday: true,
                }
            }),
            this.prisma.game.update({
                where: {
                    id: votedGame?.id
                },
                data: {
                    votes: {
                        increment: 1
                    }
                }
            })
        ])
    }
}