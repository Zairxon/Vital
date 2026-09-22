import { describe, it, expect } from 'vitest';
import { parseDb } from '../db.js';
import { emptyDb, addPerson } from '../model.js';

describe('чтение базы', () => {
  it('читает нормальный JSON', () => {
    const db = addPerson(emptyDb(), { name: 'Я' });
    expect(parseDb(JSON.stringify(db)).people).toHaveLength(1);
  });

  it('на битом JSON возвращает null, а не падает', () => {
    expect(parseDb('{ поломанный')).toBeNull();
  });

  it('на JSON без нужных полей возвращает null', () => {
    expect(parseDb('{"foo":1}')).toBeNull();
  });

  it('на пустой строке возвращает null', () => {
    expect(parseDb('')).toBeNull();
  });

  it('дополняет недостающие необязательные поля', () => {
    const db = parseDb('{"version":1,"people":[],"documents":[]}');
    expect(db.customTypes).toEqual([]);
  });
});
