import { Module } from '@nestjs/common'
import { WorkspaceContextService } from './workspace-context.service'

@Module({
  providers: [WorkspaceContextService],
  exports: [WorkspaceContextService],
})
export class WorkspaceContextModule { }