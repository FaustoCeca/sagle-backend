import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { SagasModule } from "./sagas/sagas.module";
import { UploadModule } from "./uploads/uploads.module";
import { SagleModule } from "./sagle/sagle.module";


@Module({
  imports: [AuthModule, UsersModule, SagasModule, UploadModule, SagleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}