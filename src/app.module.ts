import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { MovementsModule } from './movements/movements.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WorkspaceContextModule } from './workspace-context/workspace-context.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { TeamModule } from './team/team.module';
import { SalesModule } from './sales/sales.module';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [AuthModule, PrismaModule, ProductsModule, MovementsModule, DashboardModule, WorkspaceContextModule, WorkspaceModule, TeamModule, SalesModule, ClientsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
