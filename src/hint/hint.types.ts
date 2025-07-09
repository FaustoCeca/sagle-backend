import { SagaDB } from "src/sagas/sagas.types";

export interface HintDB {
    id: number;
    text: string;
    sagaId: number;
    saga: SagaDB;
    createdAt: Date;
}