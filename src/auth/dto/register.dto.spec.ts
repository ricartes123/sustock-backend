import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from './register.dto';

const base = { email: 'a@b.com', workspaceName: 'W', firstName: 'A', lastName: 'B' };
const errorsFor = async (password: string) =>
  (await validate(plainToInstance(RegisterDto, { ...base, password }))).map((e) => e.property);

describe('RegisterDto', () => {
  it('requires passwords of at least 8 characters', async () => {
    expect(await errorsFor('1234567')).toEqual(['password']);
    expect(await errorsFor('12345678')).toEqual([]);
  });
});
