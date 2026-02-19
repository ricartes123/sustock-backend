import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { MovementsController } from './movements/movements.controller';
import { MovementsService } from './movements/movements.service';
import { MovementsModule } from './movements/movements.module';

@Module({
  imports: [AuthModule, PrismaModule, ProductsModule, MovementsModule],
  controllers: [AppController, MovementsController],
  providers: [AppService, MovementsService],
})
export class AppModule {}
