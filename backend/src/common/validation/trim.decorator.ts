import { Transform } from 'class-transformer';

/** Обрезает пробелы по краям, чтобы "   " не проходило как непустая строка. */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
