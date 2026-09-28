import { IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class AttemptDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    readonly sagaId: number;
}
