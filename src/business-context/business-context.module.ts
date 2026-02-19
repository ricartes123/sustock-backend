import { Module } from '@nestjs/common'
import { BusinessContextService } from './business-context.service'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  providers: [BusinessContextService, PrismaService],
  exports: [BusinessContextService],
})
export class BusinessContextModule { }