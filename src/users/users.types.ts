export interface UserDB {
    id: string;
    lastParticipation?: Date | null;
    hasParticipatedToday?: boolean;
    hasVotedToday?: boolean;
    idsAttemptedToday?: number[];
    streak?: number;
    isAdmin: boolean;
}