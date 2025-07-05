export interface SagaDB {
    id: number;
    title: string;
    isTheSagle: boolean;
    lastTimeBeingSagle: Date | null;
    wasSagleYesterday: boolean;
    imageUrl: string;
    games: GameDB[] | [];
    categories: CategoryDB[];
    perspectives: PerspectiveDB[];
    artStyles: ArtStylesDB[];
    hasMultiplayer: string;
    link: string;
    createdAt: Date;
}

export interface CategoryDB {
    id: number;
    name: string;
    Sagas?: any[];
}

export interface GameDB {
    id: number;
    title: string;
    birthYear: number;
    imageUrl: string;
    sagaId?: number | null;
    saga?: SagaDB | null;
    steamLink: string | null;
    votes: number;
    createdAt: Date;
}


export interface PerspectiveDB {
    id: number;
    name: string;
    Sagas?: any[] | null;
}

export interface ArtStylesDB {
    id: number;
    name: string;
    Sagas?: any[] | null;
}