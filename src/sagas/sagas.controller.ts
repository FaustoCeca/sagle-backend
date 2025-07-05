import { Body, Controller, Delete, Get, Param, Post, Put, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ArtStylesDto, CategoryDto, GameDto, PerspectiveDto, SagaDto } from "./dto/saga.dto";
import { SagasService } from "./sagas.service";
import { UploadService } from "src/uploads/uploads.service";
import UseUploadFileInterceptor from "src/decorators/UseFileInterceptor";
import { Express } from 'express';


@Controller('sagas')
export class SagasController {
    constructor(private readonly sagasService: SagasService, private readonly uploadService: UploadService) { }

    @Get()
    getSagas() {
        return this.sagasService.getSagas();
    }

    @Post('saga')
    @UseUploadFileInterceptor('file')
    async createSaga(
        // TODO
        @Body() body: any,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new Error('File is required');
        }
        const sagaDto = JSON.parse(body.sagaData) as SagaDto;


        const fileUrl = await this.uploadService.uploadFile(file, "saga");

        const sagaWithFile: SagaDto = {
            ...sagaDto,
            imageUrl: fileUrl,
        };

        return this.sagasService.createSaga(sagaWithFile);
    }

    @Put(':sagaId')
    @UseUploadFileInterceptor('file')
    async updateSaga(
        // TODO
        @Body() body: any,
        @Param('sagaId') sagaId: string,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const sagaDto = JSON.parse(body.sagaData) as SagaDto;

        if (file) {
            const fileUrl = await this.uploadService.uploadFile(file, "saga");

            const sagaWithFile: SagaDto = {
                ...sagaDto,
                imageUrl: fileUrl,
            };

            return this.sagasService.updateSaga(Number(sagaId), sagaWithFile);
        }

        return this.sagasService.updateSaga(Number(sagaId), sagaDto);
    }

    @Delete(':sagaId')
    async deleteSaga(
        @Param('sagaId') sagaId: string
    ) {
        return this.sagasService.deleteSaga(Number(sagaId)
        );
    }

    @Post('game')
    @UseUploadFileInterceptor('file')
    async createGame(
        // TODO
        @Body() body: any,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new Error('File is required');
        }
        const gameDto = JSON.parse(body.gameData) as GameDto;


        const fileUrl = await this.uploadService.uploadFile(file, "game");

        const gameWithFile: GameDto = {
            title: gameDto.title,
            birthYear: gameDto.birthYear,
            imageUrl: fileUrl,
            sagaId: gameDto.sagaId,
            votes: 0,
            steamLink: gameDto.steamLink,
        };


        const createdGame = await this.sagasService.createGame(gameWithFile);

        await this.sagasService.addGameToSaga(Number(gameWithFile.sagaId), Number(createdGame.id));

        return createdGame;
    }

    @Put('games/:gameId')
    @UseUploadFileInterceptor('file')
    async updateGame(
        @Body() body: any,
        @Param('gameId') gameId: string,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const gameDto = JSON.parse(body.gameData) as GameDto;

        if (file) {
            const fileUrl = await this.uploadService.uploadFile(file, "game");

            const gameWithFile: GameDto = {
                ...gameDto,
                imageUrl: fileUrl,
            };

            return this.sagasService.updateGame(Number(gameId), gameWithFile);
        }

        return this.sagasService.updateGame(Number(gameId), gameDto);
    }

    @Delete('games/:gameId')
    async deleteGame(
        @Param('gameId') gameId: string
    ) {
        return this.sagasService.deleteGame(Number(gameId));
    }

    @Post('category')
    async createCategory(
        @Body() categorydto: CategoryDto
    ) {
        return this.sagasService.createCategory(categorydto);
    }

    @Get('categories')
    async getCategories() {
        return this.sagasService.getCategories();
    }

    @Delete('categories/:categoryId')
    async deleteCategory(
        @Param('categoryId') categoryId: string
    ) {
        return this.sagasService.deleteCategory(Number(categoryId));
    }

    @Post('perspective')
    async createPerspective(
        @Body() perspectiveDto: PerspectiveDto
    ) {
        return this.sagasService.createPerspective(perspectiveDto);
    }

    @Get('perspectives')
    async getPerspectives() {
        return this.sagasService.getPerspectives();
    }

    @Delete('perspectives/:perspectiveId')
    async deletePerspective(
        @Param('perspectiveId') perspectiveId: string
    ) {
        return this.sagasService.deletePerspective(Number(perspectiveId));
    }

    @Post('artstyle')
    async createArtStyle(
        @Body() artStylesDto: ArtStylesDto
    ) {
        return this.sagasService.createArtStyle(artStylesDto);
    }

    @Get('artstyles')
    async getArtStyles() {
        return this.sagasService.getArtStyles();
    }

    @Delete('artstyles/:artStyleId')
    async deleteArtStyle(
        @Param('artStyleId') artStyleId: string
    ) {
        return this.sagasService.deleteArtStyle(Number(artStyleId));
    }
}