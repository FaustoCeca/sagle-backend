import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ArtStylesDto, CategoryDto, GameDto, PerspectiveDto, SagaDto } from "./dto/saga.dto";
import { ArtStylesDB, CategoryDB, GameDB, PerspectiveDB, SagaDB } from "./sagas.types";
import { UploadService } from "src/uploads/uploads.service";

@Injectable()
export class SagasService {
    constructor(private readonly prisma: PrismaService,
        private readonly uploadService: UploadService
    ) { }

    async createSaga(saga: SagaDto): Promise<SagaDB> {
        const createdSaga = await this.prisma.saga.create({
            data: {
                id: Math.floor(Math.random() * 1000000), // Generar un ID aleatorio
                title: saga.title,
                imageUrl: saga.imageUrl,
                hasMultiplayer: saga.hasMultiplayer,
                link: saga.link,
                // TODO: revisar porque tengo que transformar a number, deberian venir como number en teoria?
                categories: {
                    connect: saga.categories.map(categoryId => ({ id: Number(categoryId) }))
                },
                perspectives: {
                    connect: saga.perspectives.map(perspectiveId => ({ id: Number(perspectiveId) }))
                },
                artStyles: {
                    connect: saga.artStyles.map(artStyleId => ({ id: Number(artStyleId) }))
                },
            },
            include: {
                categories: true,
                perspectives: true,
                artStyles: true,
                games: true
            }
        })

        return createdSaga;
    }

    async updateSaga(sagaId: number, saga: SagaDto): Promise<SagaDB> {
        const updatedSaga = await this.prisma.saga.update({
            where: { id: sagaId },
            data: {
                title: saga.title,
                imageUrl: saga.imageUrl,
                hasMultiplayer: saga.hasMultiplayer,
                link: saga.link,
                categories: {
                    set: [],
                    connect: saga.categories.map(categoryId => ({ id: Number(categoryId) }))
                },
                perspectives: {
                    set: [],
                    connect: saga.perspectives.map(perspectiveId => ({ id: Number(perspectiveId) }))
                },
                artStyles: {
                    set: [],
                    connect: saga.artStyles.map(artStyleId => ({ id: Number(artStyleId) }))
                }
            },
            include: {
                categories: true,
                perspectives: true,
                artStyles: true,
                games: true
            }
        })

        return updatedSaga;
    }

    // TODO: cuando tenga muchas sagas crear un endpoint sin los includes solo para el select, sino dara problemas de performance 
    async getSagas(): Promise<SagaDB[]> {
        const sagas = await this.prisma.saga.findMany({
            include: {
                categories: true,
                perspectives: true,
                artStyles: true,
                games: true
            },
            orderBy: {
                title: 'asc'
            }
        })

        return sagas;
    }

    async deleteSaga(sagaId: number): Promise<void> {
        return this.prisma.$transaction(async (prisma) => {
            const sagaWithGames = await prisma.saga.findUnique({
                where: { id: sagaId },
                include: { games: true }
            })

            if (!sagaWithGames) {
                throw new Error(`Saga with ID ${sagaId} not found`);
            }

            for (const game of sagaWithGames.games) {
                if (game.imageUrl) {
                    try {
                        await this.uploadService.deleteFile(game.imageUrl);
                    } catch (error) {
                        console.error(`Error deleting game image: ${game.imageUrl}`, error);
                    }
                }
            }

            await prisma.game.deleteMany({
                where: {
                    sagaId: sagaId
                }
            })

            if (sagaWithGames.imageUrl) {
                try {
                    await this.uploadService.deleteFile(sagaWithGames.imageUrl);
                } catch (error) {
                    console.error(`Error deleting saga image: ${sagaWithGames.imageUrl}`, error);
                }
            }

            await prisma.saga.delete({
                where: {
                    id: sagaId
                }
            })
        })
    }

    async createGame(game: GameDto): Promise<GameDB> {
        const createdGame = await this.prisma.game.create({
            data: {
                id: Math.floor(Math.random() * 1000000), // Generar un ID aleatorio
                title: game.title,
                birthYear: Number(game.birthYear), // Asegurarse de que el año es un número
                imageUrl: game.imageUrl,
                votes: 0,
                sagaId: Number(game.sagaId), // Usar la clave foránea directamente
                steamLink: game.steamLink,
                createdAt: new Date(),
            },
            include: {
                saga: true
            }
        })

        // @ts-ignore
        return createdGame;
    }

    async updateGame(gameId: number, game: GameDto): Promise<GameDB> {
        const updatedGame = await this.prisma.game.update({
            where: { id: gameId },
            data: {
                title: game.title,
                birthYear: Number(game.birthYear), // Asegurarse de que el año es un número
                imageUrl: game.imageUrl,
                sagaId: Number(game.sagaId), // Usar la clave foránea directamente
                steamLink: game.steamLink,
            },
        })

        return updatedGame;
    }

    async deleteGame(gameId: number): Promise<void> {
        return this.prisma.$transaction(async (prisma) => {
            const game = await prisma.game.findUnique({
                where: { id: gameId }
            })

            if (!game) {
                throw new Error(`Game with ID ${gameId} not found`);
            }

            if (game.imageUrl) {
                try {
                    await this.uploadService.deleteFile(game.imageUrl);
                } catch (error) {
                    console.error(`Error deleting game image: ${game.imageUrl}`, error);
                }
            }

            await prisma.game.delete({
                where: { id: gameId }
            })
        })
    }

    async createCategory(category: CategoryDto): Promise<CategoryDB> {
        const createdCategory = await this.prisma.category.create({
            data: {
                id: Math.floor(Math.random() * 1000000),
                name: category.name
            }
        })

        return createdCategory;
    }

    async getCategories(): Promise<CategoryDB[]> {
        const categories = await this.prisma.category.findMany({
            orderBy: {
                name: 'asc'
            }
        })

        return categories;
    }

    async deleteCategory(categoryId: number): Promise<void> {
        return this.prisma.$transaction(async (prisma) => {
            const sagasWithCategory = await prisma.category.findUnique({
                where: { id: categoryId },
                include: { sagas: true }
            })

            if (!sagasWithCategory) {
                throw new Error(`Category with ID ${categoryId} not found`);
            }

            for (const saga of sagasWithCategory.sagas) {
                await prisma.saga.update({
                    where: {
                        id: saga.id
                    },
                    data: {
                        categories: {
                            disconnect: { id: categoryId }
                        }
                    }
                })
            }

            await prisma.category.delete({
                where: { id: categoryId }
            })
        })
    }

    async createPerspective(perspective: PerspectiveDto): Promise<PerspectiveDB> {
        const createdPerspective = await this.prisma.perspective.create({
            data: {
                id: Math.floor(Math.random() * 1000000),
                name: perspective.name
            }
        })

        return createdPerspective;
    }

    async getPerspectives(): Promise<PerspectiveDB[]> {
        const perspectives = await this.prisma.perspective.findMany({
            orderBy: {
                name: 'asc'
            }
        })

        return perspectives;
    }

    async deletePerspective(perspectiveId: number): Promise<void> {
        return this.prisma.$transaction(async (prisma) => {
            const sagasWithPerspective = await prisma.perspective.findUnique({
                where: { id: perspectiveId },
                include: { sagas: true }
            })

            if (!sagasWithPerspective) {
                throw new Error(`Perspective with ID ${perspectiveId} not found`);
            }

            for (const saga of sagasWithPerspective?.sagas) {
                await prisma.saga.update({
                    where: {
                        id: saga.id
                    },
                    data: {
                        perspectives: {
                            disconnect: { id: perspectiveId }
                        }
                    }
                })
            }

            await prisma.perspective.delete({
                where: { id: perspectiveId }
            })
        })
    }

    async createArtStyle(artStyle: ArtStylesDto): Promise<ArtStylesDB> {
        const createdArtStyle = await this.prisma.artStyles.create({
            data: {
                id: Math.floor(Math.random() * 1000000),
                name: artStyle.name
            }
        })

        return createdArtStyle;
    }

    async getArtStyles(): Promise<ArtStylesDB[]> {
        const artStyles = await this.prisma.artStyles.findMany({
            orderBy: {
                name: 'asc'
            }
        })

        return artStyles;
    }

    async deleteArtStyle(artStyleId: number): Promise<void> {
        return this.prisma.$transaction(async (prisma) => {
            const sagasWithArtStyle = await prisma.artStyles.findUnique({
                where: { id: artStyleId },
                include: { sagas: true }
            })

            if (!sagasWithArtStyle) {
                throw new Error(`Art style with ID ${artStyleId} not found`);
            }

            for (const saga of sagasWithArtStyle.sagas) {
                await prisma.saga.update({
                    where: {
                        id: saga.id
                    },
                    data: {
                        artStyles: {
                            disconnect: { id: artStyleId }
                        }
                    }
                })
            }

            await prisma.artStyles.delete({
                where: { id: artStyleId }
            })
        })
    }

    async addGameToSaga(sagaId: number, gameId: number): Promise<void> {
        await this.prisma.saga.update({
            where: { id: sagaId },
            data: {
                games: {
                    connect: { id: gameId }
                }
            }
        })
    }
}