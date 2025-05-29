export class SagaDto {
    title: string;
    imageUrl: any;
    categories: number[];
    perspectives: number[];
    artStyles: number[];
    hasMultiplayer: string;
    link: string;
}

export class CategoryDto {
    name: string;
}

export class GameDto {
    title: string;
    birthYear: number;
    imageUrl: string;
    votes: number;
    steamLink?: string;
}

export class PerspectiveDto {
    name: string;
}

export class ArtStylesDto {
    name: string;
}