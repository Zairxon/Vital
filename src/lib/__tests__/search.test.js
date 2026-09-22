import { describe, it, expect } from 'vitest';
import { emptyDb, addPerson, addDocument, togglePin } from '../model.js';
import { searchDocuments, sortDocuments, groupByType, peopleSorted } from '../search.js';

function fixture() {
  let db = addPerson(emptyDb(), { name: 'Алишер', relation: 'отец' });
  const father = db.people[0].id;
  db = addPerson(db, { name: 'Дилноза', relation: 'мать' });
  const mother = db.people[1].id;
  db = addDocument(db, { personId: father, type: 'passport', title: 'Паспорт AA1234567', pages: [] });
  db = addDocument(db, { personId: mother, type: 'birth', title: 'Свидетельство', note: 'выдано в Ташкенте', pages: [] });
  return db;
}

describe('поиск', () => {
  it('находит по имени человека', () => {
    const r = searchDocuments(fixture(), 'алишер');
    expect(r).toHaveLength(1);
    expect(r[0].doc.title).toBe('Паспорт AA1234567');
    expect(r[0].person.name).toBe('Алишер');
  });

  it('находит по названию документа без учёта регистра', () => {
    expect(searchDocuments(fixture(), 'паспорт')).toHaveLength(1);
  });

  it('находит по номеру в названии', () => {
    expect(searchDocuments(fixture(), 'AA1234')).toHaveLength(1);
  });

  it('находит по подписи типа документа', () => {
    expect(searchDocuments(fixture(), 'свидетельство о рождении')).toHaveLength(1);
  });

  it('находит по родству', () => {
    expect(searchDocuments(fixture(), 'мать')).toHaveLength(1);
  });

  it('находит по заметке', () => {
    expect(searchDocuments(fixture(), 'ташкент')).toHaveLength(1);
  });

  it('на пустой запрос ничего не возвращает', () => {
    expect(searchDocuments(fixture(), '   ')).toEqual([]);
  });

  it('на бессмысленный запрос возвращает пусто', () => {
    expect(searchDocuments(fixture(), 'ыыыы')).toEqual([]);
  });
});

describe('сортировка', () => {
  it('поднимает закреплённые документы наверх', () => {
    let db = fixture();
    const second = db.documents[1].id;
    db = togglePin(db, second);
    expect(sortDocuments(db.documents)[0].id).toBe(second);
  });

  it('сохраняет порядок внутри одинаковой закреплённости', () => {
    const db = fixture();
    expect(sortDocuments(db.documents).map((d) => d.type)).toEqual(['passport', 'birth']);
  });

  it('группирует документы по типу в порядке справочника', () => {
    const db = fixture();
    const groups = groupByType(db, db.documents);
    expect(groups.map((g) => g.typeId)).toEqual(['passport', 'birth']);
    expect(groups[0].label).toBe('Паспорт');
    expect(groups[0].items).toHaveLength(1);
  });

  it('выносит закреплённые в отдельную группу «Важное»', () => {
    let db = fixture();
    db = togglePin(db, db.documents[1].id);
    const groups = groupByType(db, db.documents);
    expect(groups[0].typeId).toBe('__pinned');
    expect(groups[0].label).toBe('Важное');
    expect(groups[0].items).toHaveLength(1);
    expect(groups.some((g) => g.typeId === 'birth')).toBe(false);
  });

  it('отдаёт людей по полю order', () => {
    const db = fixture();
    expect(peopleSorted(db).map((p) => p.name)).toEqual(['Алишер', 'Дилноза']);
  });
});
