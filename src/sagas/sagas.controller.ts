import { Body, Controller, Get, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ArtStylesDto, CategoryDto, GameDto, PerspectiveDto, SagaDto } from "./dto/saga.dto";
import { SagasService } from "./sagas.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadService } from "src/uploads/uploads.service";
import UseUploadFileInterceptor from "src/decorators/UseFileInterceptor";


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

        console.log('Saga data received:', sagaDto);
        console.log('File received:', file);

        const fileUrl = await this.uploadService.uploadFile(file, "saga");

        const sagaWithFile: SagaDto = {
            ...sagaDto,
            imageUrl: fileUrl,
        };

        console.log('Saga with file:', sagaWithFile);

        return this.sagasService.createSaga(sagaWithFile);
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

}