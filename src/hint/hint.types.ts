import { SagaDB } from "src/sagas/sagas.types";

export interface HintDB {
    id: number;
    text: string;
    language: string;
    sagaId: number;
    createdAt: Date;
}

export interface HintsObject {
    en: string;
    es: string;
    fr: string;
}