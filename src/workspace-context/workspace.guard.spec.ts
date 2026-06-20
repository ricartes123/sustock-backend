import { WorkspaceGuard } from './workspace.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('WorkspaceGuard', () => {
  it('should be defined', () => {
    expect(new WorkspaceGuard({} as PrismaService)).toBeDefined();
  });
});
