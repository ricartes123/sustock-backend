import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SalesQueryDto } from './sales-query.dto';

const errorsFor = (query: Record<string, string>) =>
  validate(plainToInstance(SalesQueryDto, query));

describe('SalesQueryDto', () => {
  it.each(['ALL', 'ACTIVE', 'CANCELLED'])('accepts status %s', async (status) => {
    expect(await errorsFor({ status })).toHaveLength(0);
  });

  it('rejects an unknown status instead of passing it to Prisma', async () => {
    const errors = await errorsFor({ status: 'FOO' });

    expect(errors.map((e) => e.property)).toEqual(['status']);
  });

  it('converts numeric query params', async () => {
    const dto = plainToInstance(SalesQueryDto, { page: '2', minAmount: '10.5' });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.minAmount).toBe(10.5);
  });
});
