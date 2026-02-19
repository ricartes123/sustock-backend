import { Test, TestingModule } from '@nestjs/testing';
import { BusinessContextService } from './business-context.service';

describe('BusinessContextService', () => {
  let service: BusinessContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessContextService],
    }).compile();

    service = module.get<BusinessContextService>(BusinessContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
