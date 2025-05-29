import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ArtStylesDto, CategoryDto, GameDto, PerspectiveDto, SagaDto } from "./dto/saga.dto";
import { ArtStylesDB, CategoryDB, GameDB, PerspectiveDB, SagaDB } from "./sagas.types";
import { UploadService } from "src/uploads/uploads.service";

@Injectable()
export class SagasService {
    constructor(private readonly prisma: PrismaService, 
        private readonly uploadService: UploadService
    ) {}

    async createSaga(saga: SagaDto): Promise<SagaDB> {
        const createdSaga = await this.prisma.saga.create({
            data: {
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
                artStyle: {
                    connect: saga.artStyles.map(artStyleId => ({ id: Number(artStyleId) }))
                },
            }
        })

        console.log("Created saga:", createdSaga);

        // @ts-expect-error TODO: revisar porque no me reconoce el tipo de retorno
        return createdSaga;
    }

    // TODO: cuando tenga muchas sagas crear un endpoint sin los includes solo para el select, sino dara problemas de performance 
    async getSagas(): Promise<SagaDB[]> {
        const sagas = await this.prisma.saga.findMany({
            include: {
                categories: true,
                perspectives: true,
                artStyle: true
            },
            orderBy: {
                title: 'asc'
            }
        })

        // @ts-expect-error TODO: revisar porque no me reconoce el tipo de retorno
        return sagas;
    }
 
    async createGame(game: GameDto): Promise<GameDB> {
        console.log("Creating game:", game);

        const createdGame = await this.prisma.game.create({
            data: {
                title: game.title,
                birthYear: game.birthYear,
                imageUrl: game.imageUrl,
                votes: 0,
                sagaId: 0,
                steamLink: game.steamLink,
                createdAt: new Date(),
            }
        })

        return createdGame;
    }
    
    async createCategory(category: CategoryDto): Promise<CategoryDB> {
        const createdCategories = await this.prisma.category.create({
            data: {
                name: category.name
            }
        })

        return createdCategories;
    }

    async getCategories(): Promise<CategoryDB[]> {
        const categories = await this.prisma.category.findMany({
            orderBy: {
                name: 'asc'
            }
        })

        return categories;
    }

    async createPerspective(perspective: PerspectiveDto): Promise<PerspectiveDB> {
        const createdPerspective = await this.prisma.perspective.create({
            data: {
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

    async createArtStyle(artStyle: ArtStylesDto): Promise<ArtStylesDB> {
        const createdArtStyle = await this.prisma.artStyles.create({
            data: {
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
}