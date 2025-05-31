import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { SagaDB } from "src/sagas/sagas.types";

@Injectable()
export class SagleService {
    constructor(private readonly prisma: PrismaService, 
    ) {}

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
}