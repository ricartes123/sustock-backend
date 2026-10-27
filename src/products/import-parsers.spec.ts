import { isBlank, parseMoney, parseNonNegativeInt } from './import-parsers';

describe('parseMoney', () => {
  it.each([
    ['1234.56', '1234.56'],
    ['1234,56', '1234.56'],
    ['1.234,56', '1234.56'],
    ['1,234.56', '1234.56'],
    ['1.234', '1234'],
    ['10.999', '10999'],
    ['12,345', '12345'],
    ['$ 99,90', '99.9'],
    ['0', '0'],
    [19.99, '19.99'],
    [1500, '1500'],
  ])('parses %p as %s', (input, expected) => {
    expect(parseMoney(input)?.toString()).toBe(expected);
  });

  it.each(['', 'abc', '-5', '1.2.3', '10.5555', '1,23,456', 1.005 + 0.0001, -1])('rejects %p', (input) => {
    expect(parseMoney(input)).toBeNull();
  });
});

describe('parseNonNegativeInt', () => {
  it('parses integers from text and numbers', () => {
    expect(parseNonNegativeInt('12')).toBe(12);
    expect(parseNonNegativeInt(7)).toBe(7);
  });

  it.each(['12.5', '-1', '', 'abc', 2.5])('rejects %p instead of truncating', (input) => {
    expect(parseNonNegativeInt(input)).toBeNull();
  });
});

describe('isBlank', () => {
  it('treats empty and whitespace-only cells as blank', () => {
    expect(isBlank('')).toBe(true);
    expect(isBlank('  ')).toBe(true);
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank(0)).toBe(false);
  });
});
