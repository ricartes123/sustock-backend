import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { MovementsQueryDto } from './movements-query.dto';

const errorsFor = async (query: Record<string, string>) =>
  (await validate(plainToInstance(MovementsQueryDto, query))).map((e) => e.property);

describe('MovementsQueryDto', () => {
  it('accepts a valid query', async () => {
    expect(
      await errorsFor({ page: '2', limit: '20', type: 'IN', startDate: '2026-10-01T03:00:00.000Z' }),
    ).toEqual([]);
  });

  it('rejects unparseable dates and unknown types instead of failing in the database', async () => {
    expect(await errorsFor({ startDate: 'abc', endDate: 'ayer', type: 'TRANSFER' })).toEqual([
      'startDate',
      'endDate',
      'type',
    ]);
  });

  it('caps the page size at 100', async () => {
    expect(await errorsFor({ limit: '101' })).toEqual(['limit']);
  });
});
