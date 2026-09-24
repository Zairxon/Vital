import { describe, it, expect } from 'vitest';
import { daysUntilExpiry, expiryStatus, expiringDocuments, EXPIRY_WARNING_DAYS } from '../expiry.js';
import { emptyDb, addPerson, addDocument } from '../model.js';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-09-24T00:00:00Z').getTime();

describe('daysUntilExpiry', () => {
  it('без даты возвращает null', () => {
    expect(daysUntilExpiry(null, NOW)).toBeNull();
    expect(daysUntilExpiry('', NOW)).toBeNull();
  });

  it('считает дни вперёд', () => {
    expect(daysUntilExpiry('2026-10-04', NOW)).toBe(10);
  });

  it('отрицательное число для просроченной даты', () => {
    expect(daysUntilExpiry('2026-09-01', NOW)).toBeLessThan(0);
  });
});

describe('expiryStatus', () => {
  it('без даты — null', () => {
    expect(expiryStatus(null, NOW)).toBeNull();
  });

  it('далёкий срок — ok', () => {
    expect(expiryStatus(new Date(NOW + 30 * DAY).toISOString(), NOW)).toBe('ok');
  });

  it(`ровно ${EXPIRY_WARNING_DAYS} дней — soon`, () => {
    expect(expiryStatus(new Date(NOW + EXPIRY_WARNING_DAYS * DAY).toISOString(), NOW)).toBe('soon');
  });

  it('на день больше порога — ещё ok', () => {
    expect(expiryStatus(new Date(NOW + (EXPIRY_WARNING_DAYS + 1) * DAY).toISOString(), NOW)).toBe('ok');
  });

  it('прошедшая дата — expired', () => {
    expect(expiryStatus(new Date(NOW - DAY).toISOString(), NOW)).toBe('expired');
  });

  it('сегодня — soon (0 дней, ещё не просрочен)', () => {
    expect(expiryStatus(new Date(NOW).toISOString(), NOW)).toBe('soon');
  });
});

describe('expiringDocuments', () => {
  function fixture() {
    let db = addPerson(emptyDb(), { name: 'Алишер' });
    const pid = db.people[0].id;
    db = addDocument(db, {
      personId: pid, type: 'passport', title: 'Далёкий срок',
      expiryDate: new Date(NOW + 60 * DAY).toISOString(), pages: [],
    });
    db = addDocument(db, {
      personId: pid, type: 'inn', title: 'Просрочен',
      expiryDate: new Date(NOW - 2 * DAY).toISOString(), pages: [],
    });
    db = addDocument(db, {
      personId: pid, type: 'other', title: 'Скоро истекает',
      expiryDate: new Date(NOW + 3 * DAY).toISOString(), pages: [],
    });
    db = addDocument(db, { personId: pid, type: 'other', title: 'Без срока', pages: [] });
    return db;
  }

  it('отбирает только просроченные и скоро истекающие, без срока — пропускает', () => {
    const list = expiringDocuments(fixture(), NOW);
    expect(list.map((x) => x.doc.title)).toEqual(['Просрочен', 'Скоро истекает']);
  });

  it('сортирует от самого просроченного к самому далёкому', () => {
    const list = expiringDocuments(fixture(), NOW);
    expect(list[0].days).toBeLessThan(list[1].days);
  });

  it('находит человека-владельца', () => {
    const list = expiringDocuments(fixture(), NOW);
    expect(list[0].person.name).toBe('Алишер');
  });
});
