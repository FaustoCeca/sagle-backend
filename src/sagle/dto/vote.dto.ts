import { IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class VoteDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    readonly gameId: number;
}
