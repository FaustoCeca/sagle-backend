import { SagaDB } from "src/sagas/sagas.types";
import { AttemptField, AttemptResult, ArrowDirection, FieldState } from "./sagle.types";

/**
 * Server-side comparison logic (BUG-03).
 *
 * This mirrors the behaviour that used to live in the frontend
 * (`src/logic/gameLogic.ts` + `SelectedSagas.tsx`) so the colours/arrows are
 * identical, but it runs on the backend so the answer (the Sagle) is never
 * sent to the client.
 */

const getSortedGameYears = (saga: SagaDB): number[] =>
    saga.games.map((g) => g.birthYear).sort((a, b) => a - b);

const getGameYear = (saga: SagaDB, position: "first" | "last"): number => {
    const sorted = getSortedGameYears(saga);
    return position === "first" ? sorted[0] : sorted[sorted.length - 1];
};

/** Set-style comparison by an identity key (name for categories, id for the rest). */
const setState = (sagleKeys: (string | number)[], triedKeys: (string | number)[]): FieldState => {
    const hasAll = sagleKeys.every((k) => triedKeys.includes(k));
    const hasAtLeastOne = sagleKeys.some((k) => triedKeys.includes(k));

    if (hasAll && sagleKeys.length === triedKeys.length) {
        return "correct";
    }
    if (hasAtLeastOne) {
        return "partial";
    }
    return "incorrect";
};

const numberField = (
    sagleValue: number,
    triedValue: number,
    displayValue: string,
): AttemptField => {
    let arrow: ArrowDirection = null;
    if (triedValue < sagleValue) arrow = "up"; // answer is higher
    else if (triedValue > sagleValue) arrow = "down"; // answer is lower

    return {
        value: displayValue,
        state: sagleValue === triedValue ? "correct" : "incorrect",
        arrow,
    };
};

export const compareSagaWithSagle = (sagle: SagaDB, saga: SagaDB): AttemptResult => {
    const sagleGamesCount = sagle.games.length;
    const triedGamesCount = saga.games.length;

    const sagleFirst = getGameYear(sagle, "first");
    const triedFirst = getGameYear(saga, "first");

    const sagleLast = getGameYear(sagle, "last");
    const triedLast = getGameYear(saga, "last");

    return {
        sagaId: saga.id,
        title: saga.title,
        imageUrl: saga.imageUrl,
        categories: {
            value: saga.categories.map((c) => c.name).join(", "),
            state: setState(
                sagle.categories.map((c) => c.name),
                saga.categories.map((c) => c.name),
            ),
        },
        games: numberField(sagleGamesCount, triedGamesCount, triedGamesCount.toString()),
        firstGame: numberField(sagleFirst, triedFirst, triedFirst.toString()),
        lastGame: numberField(sagleLast, triedLast, triedLast.toString()),
        perspectives: {
            value: saga.perspectives.map((p) => p.name).join(", "),
            state: setState(
                sagle.perspectives.map((p) => p.id),
                saga.perspectives.map((p) => p.id),
            ),
        },
        artStyles: {
            value: saga.artStyles.map((a) => a.name).join(", "),
            state: setState(
                sagle.artStyles.map((a) => a.id),
                saga.artStyles.map((a) => a.id),
            ),
        },
        multiplayer: {
            value: saga.hasMultiplayer,
            state: sagle.hasMultiplayer === saga.hasMultiplayer ? "correct" : "incorrect",
        },
    };
};
