import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./users/users.module";
import { SagasModule } from "./sagas/sagas.module";
import { UploadModule } from "./uploads/uploads.module";
import { SagleModule } from "./sagle/sagle.module";
import { HintModule } from "./hint/hint.module";


@Module({
  imports: [UsersModule, SagasModule, UploadModule, SagleModule, HintModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}