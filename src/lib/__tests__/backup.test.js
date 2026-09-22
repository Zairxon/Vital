import { describe, it, expect } from 'vitest';
import { validateBackup } from '../backup.js';

describe('проверка архива', () => {
  it('отклоняет пустое значение', () => {
    expect(validateBackup(null)).toBe(false);
    expect(validateBackup(undefined)).toBe(false);
  });

  it('отклоняет объект без people/documents', () => {
    expect(validateBackup({ foo: 1 })).toBe(false);
  });

  it('отклоняет объект, где people или documents не массив', () => {
    expect(validateBackup({ people: {}, documents: [] })).toBe(false);
    expect(validateBackup({ people: [], documents: null })).toBe(false);
  });

  it('принимает архив с людьми и документами', () => {
    expect(validateBackup({ version: 1, people: [], documents: [] })).toBe(true);
  });

  it('принимает архив с непустыми списками', () => {
    expect(validateBackup({ people: [{ id: 'p1' }], documents: [{ id: 'd1' }] })).toBe(true);
  });
});
