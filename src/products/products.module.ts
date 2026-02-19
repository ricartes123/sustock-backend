import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { BusinessContextModule } from '../business-context/business-context.module';


@Module({
  providers: [ProductsService],
  controllers: [ProductsController],
  imports: [BusinessContextModule],
})
export class ProductsModule { }
