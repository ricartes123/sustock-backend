import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { MovementsController } from './movements/movements.controller';
import { MovementsService } from './movements/movements.service';
import { MovementsModule } from './movements/movements.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WorkspaceContextModule } from './workspace-context/workspace-context.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { TeamModule } from './team/team.module';

@Module({
  imports: [AuthModule, PrismaModule, ProductsModule, MovementsModule, DashboardModule, WorkspaceContextModule, WorkspaceModule, TeamModule],
  controllers: [AppController, MovementsController],
  providers: [AppService, MovementsService],
})
export class AppModule {}
