export interface UserDB {
    id: number;
    ipAddress: string;
    lastParticipation?: Date | null;
    hasParticipatedToday?: boolean;
    hasVotedToday?: boolean;
    streak?: number;
    isAdmin: boolean;
}