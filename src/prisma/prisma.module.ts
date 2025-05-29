import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// This module provides the PrismaService globally, allowing it to be injected into other modules without needing to import it explicitly.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}