import { describe, it, expect } from 'vitest';
import { noteLines, noteValue } from '../clipboard.js';

describe('noteLines', () => {
  it('делит по строкам и убирает пустые', () => {
    expect(noteLines('a\n\n b \n')).toEqual(['a', 'b']);
    expect(noteLines('')).toEqual([]);
  });
});

describe('noteValue', () => {
  it('«Название: значение» → значение', () => {
    expect(noteValue('ЖШШИР: 12345678901234')).toBe('12345678901234');
    expect(noteValue('Адрес: г. Ташкент, ул. Навои, 12')).toBe('г. Ташкент, ул. Навои, 12');
  });
  it('кадастр с двоеточиями и обычная строка копируются целиком', () => {
    expect(noteValue('10:01:02:03:0045')).toBe('10:01:02:03:0045');
    expect(noteValue('ул. Навои 12')).toBe('ул. Навои 12');
  });
});
