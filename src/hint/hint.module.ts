import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { HintController } from "./hint.controller";
import { HintService } from "./hint.service";
import { SagleService } from "src/sagle/sagle.service";
import { UsersModule } from "src/users/users.module";
import { SagleModule } from "src/sagle/sagle.module";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
    imports: [PrismaModule, UsersModule, SagleModule, ScheduleModule.forRoot()],
    controllers: [HintController],
    providers: [HintService, SagleService],
    exports: [HintService],
})

export class HintModule {}