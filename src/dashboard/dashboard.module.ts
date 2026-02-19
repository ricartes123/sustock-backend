import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { BusinessContextModule } from '../business-context/business-context.module';

@Module({
  providers: [DashboardService],
  controllers: [DashboardController],
  imports: [BusinessContextModule],
})
export class DashboardModule {}
