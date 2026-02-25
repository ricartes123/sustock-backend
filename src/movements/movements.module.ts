import { Module } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { MovementsController } from './movements.controller';
import { WorkspaceContextModule } from '../workspace-context/workspace-context.module';

@Module({
  providers: [MovementsService],
  controllers: [MovementsController],
  imports: [WorkspaceContextModule],
})
export class MovementsModule {}
