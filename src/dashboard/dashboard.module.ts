import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { WorkspaceContextModule } from '../workspace-context/workspace-context.module';

@Module({
  providers: [DashboardService],
  controllers: [DashboardController],
  imports: [WorkspaceContextModule],
})
export class DashboardModule {}
