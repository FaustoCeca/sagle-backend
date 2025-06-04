export interface UserDB {
    id: number;
    ipAddress: string;
    lastParticipation?: Date | null;
    hasParticipatedToday?: boolean;
    hasVotedToday?: boolean;
    idsAttemptedToday?: number[];
    streak?: number;
    isAdmin: boolean;
}