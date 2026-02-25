import { Module } from '@nestjs/common'
import { WorkspaceContextService } from './workspace-context.service'
import { PrismaService } from '../prisma/prisma.service'

@Module({
  providers: [WorkspaceContextService, PrismaService],
  exports: [WorkspaceContextService],
})
export class WorkspaceContextModule { }