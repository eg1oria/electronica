import { randomBytes } from 'node:crypto';

const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const MAX_SLUG_LENGTH = 100;

/** "Смартфон Apple iPhone 15" → "smartfon-apple-iphone-15" */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .split('')
    .map((ch) => CYRILLIC[ch] ?? ch)
    .join('')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-+|-+$/g, '');
}

/**
 * Slug из названия, свободный в таблице: "iphone", "iphone-2", "iphone-3"…
 * Если из названия ничего не получилось (одни эмодзи), берётся случайный.
 */
export async function uniqueSlug(
  name: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name) || `item-${randomBytes(4).toString('hex')}`;
  if (!(await isTaken(base))) return base;
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  return `${base}-${randomBytes(4).toString('hex')}`;
}
