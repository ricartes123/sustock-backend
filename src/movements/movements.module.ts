import { Module } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { MovementsController } from './movements.controller';
import { BusinessContextModule } from '../business-context/business-context.module';

@Module({
  providers: [MovementsService],
  controllers: [MovementsController],
  imports: [BusinessContextModule],
})
export class MovementsModule {}
