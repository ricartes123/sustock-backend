import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceContextService } from './workspace-context.service';

describe('WorkspaceContextService', () => {
  let service: WorkspaceContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkspaceContextService],
    }).compile();

    service = module.get<WorkspaceContextService>(WorkspaceContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
