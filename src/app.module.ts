import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { SagasModule } from "./sagas/sagas.module";
import { UploadModule } from "./uploads/uploads.module";


@Module({
  imports: [AuthModule, UsersModule, SagasModule, UploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}