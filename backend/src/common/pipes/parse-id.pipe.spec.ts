import { BadRequestException } from '@nestjs/common';
import { ParseIdPipe } from './parse-id.pipe';

describe('ParseIdPipe', () => {
  const pipe = new ParseIdPipe();

  it('принимает корректный id', () => {
    expect(pipe.transform('42')).toBe(42);
  });

  it.each(['0', '-1', '1.5', 'abc', '', '2147483648', '99999999999'])(
    'отклоняет %p',
    (value) => {
      expect(() => pipe.transform(value)).toThrow(BadRequestException);
    },
  );
});
