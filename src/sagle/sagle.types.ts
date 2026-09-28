export type FieldState = "correct" | "partial" | "incorrect";
export type ArrowDirection = "up" | "down" | null;

export interface AttemptField {
    value: string;
    state: FieldState;
    arrow?: ArrowDirection;
}

/**
 * Result of comparing a guessed saga against the current Sagle.
 * Only contains information about the GUESSED saga (which the user already
 * knows because they guessed it) plus the per-field comparison outcome.
 * It never reveals the identity of the Sagle (BUG-03).
 */
export interface AttemptResult {
    sagaId: number;
    title: string;
    imageUrl: string;
    categories: AttemptField;
    games: AttemptField;
    firstGame: AttemptField;
    lastGame: AttemptField;
    perspectives: AttemptField;
    artStyles: AttemptField;
    multiplayer: AttemptField;
}
