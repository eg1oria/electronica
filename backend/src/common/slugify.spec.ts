import { slugify } from './slugify';

describe('slugify', () => {
  it('транслитерирует кириллицу', () => {
    expect(slugify('Игровые консоли')).toBe('igrovye-konsoli');
  });

  it('убирает спецсимволы и лишние дефисы', () => {
    expect(slugify('  Apple iPhone 16 — 128 ГБ!  ')).toBe(
      'apple-iphone-16-128-gb',
    );
  });
});
