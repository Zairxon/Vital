import { describe, it, expect } from 'vitest';
import {
  emptyDb, addPerson, updatePerson, removePerson, movePerson,
  addDocument, updateDocument, removeDocument, togglePin, addCustomType,
  documentsOf, typeLabel,
} from '../model.js';

const page = (fileId) => ({
  fileId, kind: 'image', mime: 'image/jpeg', size: 100,
  name: 'p.jpg', thumbId: fileId + '_t',
});

describe('люди', () => {
  it('добавляет человека с id и порядком', () => {
    const db = addPerson(emptyDb(), { name: 'Отец', relation: 'отец' });
    expect(db.people).toHaveLength(1);
    expect(db.people[0].name).toBe('Отец');
    expect(db.people[0].order).toBe(0);
    expect(db.people[0].id).toBeTruthy();
  });

  it('не меняет исходную базу', () => {
    const before = emptyDb();
    addPerson(before, { name: 'Мать' });
    expect(before.people).toHaveLength(0);
  });

  it('редактирует человека', () => {
    let db = addPerson(emptyDb(), { name: 'Мать' });
    db = updatePerson(db, db.people[0].id, { relation: 'мать' });
    expect(db.people[0].relation).toBe('мать');
    expect(db.people[0].name).toBe('Мать');
  });

  it('удаляет человека вместе с его документами и возвращает файлы на удаление', () => {
    let db = addPerson(emptyDb(), { name: 'Сын' });
    const pid = db.people[0].id;
    db = addDocument(db, { personId: pid, type: 'passport', title: 'Паспорт', pages: [page('f1')] });
    const res = removePerson(db, pid);
    expect(res.db.people).toHaveLength(0);
    expect(res.db.documents).toHaveLength(0);
    expect(res.orphanFileIds).toEqual(['f1', 'f1_t']);
  });

  it('меняет порядок людей', () => {
    let db = addPerson(emptyDb(), { name: 'A' });
    db = addPerson(db, { name: 'B' });
    const bId = db.people[1].id;
    db = movePerson(db, bId, -1);
    expect(db.people.map((p) => p.name)).toEqual(['B', 'A']);
    expect(db.people.map((p) => p.order)).toEqual([0, 1]);
  });

  it('не ломает порядок на границах списка', () => {
    let db = addPerson(emptyDb(), { name: 'A' });
    db = movePerson(db, db.people[0].id, -1);
    expect(db.people.map((p) => p.name)).toEqual(['A']);
  });
});

describe('документы', () => {
  it('добавляет документ человеку', () => {
    let db = addPerson(emptyDb(), { name: 'Я' });
    const pid = db.people[0].id;
    db = addDocument(db, { personId: pid, type: 'birth', title: 'Свидетельство', pages: [page('f2')] });
    expect(db.documents[0].personId).toBe(pid);
    expect(db.documents[0].pinned).toBe(false);
    expect(db.documents[0].pages).toHaveLength(1);
  });

  it('отдаёт документы только запрошенного человека', () => {
    let db = addPerson(emptyDb(), { name: 'A' });
    db = addPerson(db, { name: 'B' });
    const [a, b] = db.people.map((p) => p.id);
    db = addDocument(db, { personId: a, type: 'other', title: 'док A', pages: [] });
    db = addDocument(db, { personId: b, type: 'other', title: 'док B', pages: [] });
    expect(documentsOf(db, a).map((d) => d.title)).toEqual(['док A']);
  });

  it('редактирует документ', () => {
    let db = addPerson(emptyDb(), { name: 'Я' });
    db = addDocument(db, { personId: db.people[0].id, type: 'other', title: 'Х', pages: [] });
    db = updateDocument(db, db.documents[0].id, { title: 'Объективка', type: 'objectivka' });
    expect(db.documents[0].title).toBe('Объективка');
    expect(db.documents[0].type).toBe('objectivka');
  });

  it('закрепляет и открепляет документ', () => {
    let db = addPerson(emptyDb(), { name: 'Я' });
    db = addDocument(db, { personId: db.people[0].id, type: 'other', title: 'Х', pages: [] });
    const id = db.documents[0].id;
    db = togglePin(db, id);
    expect(db.documents[0].pinned).toBe(true);
    db = togglePin(db, id);
    expect(db.documents[0].pinned).toBe(false);
  });

  it('при удалении документа возвращает все его файлы и миниатюры', () => {
    let db = addPerson(emptyDb(), { name: 'Я' });
    db = addDocument(db, { personId: db.people[0].id, type: 'other', title: 'Х', pages: [page('a'), page('b')] });
    const res = removeDocument(db, db.documents[0].id);
    expect(res.db.documents).toHaveLength(0);
    expect(res.orphanFileIds).toEqual(['a', 'a_t', 'b', 'b_t']);
  });

  it('не возвращает пустые идентификаторы, если у страницы нет миниатюры', () => {
    let db = addPerson(emptyDb(), { name: 'Я' });
    db = addDocument(db, {
      personId: db.people[0].id, type: 'other', title: 'Х',
      pages: [{ fileId: 'doc1', kind: 'doc', mime: 'application/msword', size: 10, name: 'o.doc' }],
    });
    expect(removeDocument(db, db.documents[0].id).orphanFileIds).toEqual(['doc1']);
  });
});

describe('свои типы документов', () => {
  it('добавляет тип и отдаёт его подпись', () => {
    const db = addCustomType(emptyDb(), 'Загранпаспорт');
    const custom = db.customTypes[0];
    expect(typeLabel(db, custom.id)).toBe('Загранпаспорт');
  });

  it('знает подписи встроенных типов', () => {
    expect(typeLabel(emptyDb(), 'passport')).toBe('Паспорт');
  });

  it('для неизвестного типа отдаёт «Другое»', () => {
    expect(typeLabel(emptyDb(), 'нет_такого')).toBe('Другое');
  });
});
