import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { WorkspaceContextModule } from '../workspace-context/workspace-context.module';


@Module({
  providers: [ProductsService],
  controllers: [ProductsController],
  imports: [WorkspaceContextModule],
})
export class ProductsModule { }
