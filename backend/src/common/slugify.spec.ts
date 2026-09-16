import { slugify, uniqueSlug } from './slugify';

describe('slugify', () => {
  it('транслитерирует кириллицу', () => {
    expect(slugify('Игровые консоли')).toBe('igrovye-konsoli');
  });

  it('убирает спецсимволы и лишние дефисы', () => {
    expect(slugify('  Apple iPhone 16 — 128 ГБ!  ')).toBe(
      'apple-iphone-16-128-gb',
    );
  });

  it('ограничивает длину и не оставляет дефис в конце', () => {
    const slug = slugify(`${'a'.repeat(99)} b`);
    expect(slug.length).toBeLessThanOrEqual(100);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('uniqueSlug', () => {
  it('добавляет номер, если slug занят', async () => {
    const taken = new Set(['iphone', 'iphone-2']);
    await expect(
      uniqueSlug('iPhone', (s) => Promise.resolve(taken.has(s))),
    ).resolves.toBe('iphone-3');
  });

  it('генерирует slug, если из названия ничего не получилось', async () => {
    await expect(
      uniqueSlug('🔥', () => Promise.resolve(false)),
    ).resolves.toMatch(/^item-[0-9a-f]{8}$/);
  });
});
