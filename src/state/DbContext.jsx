import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadDb, saveDb, lastLoadError } from '../lib/db.js';
import { deleteBlobs } from '../lib/files.js';
import * as model from '../lib/model.js';

const DbContext = createContext(null);

/**
 * Единственное место, где живёт база. Любое действие: чистая функция модели
 * → сохранение на диск → удаление осиротевших файлов. Экраны не знают ни
 * про диск, ни про файлы.
 */
export function DbProvider({ children }) {
  const [db, setDb] = useState(null);
  const [warning, setWarning] = useState(null);
  const dbRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadDb().then((loaded) => {
      if (cancelled) return;
      dbRef.current = loaded;
      setDb(loaded);
      setWarning(lastLoadError());
    });
    return () => { cancelled = true; };
  }, []);

  const actions = useMemo(() => {
    // Запись идёт через dbRef, а не через db из замыкания: два действия
    // подряд в одном кадре не должны затирать друг друга.
    const commit = (next, orphanFileIds = []) => {
      dbRef.current = next;
      setDb(next);
      saveDb(next).catch(() => setWarning('Не удалось сохранить изменения на диск.'));
      if (orphanFileIds.length) deleteBlobs(orphanFileIds);
      return next;
    };
    const apply = (fn) => (...args) => commit(fn(dbRef.current, ...args));
    const applyWithFiles = (fn) => (...args) => {
      const { db: next, orphanFileIds } = fn(dbRef.current, ...args);
      return commit(next, orphanFileIds);
    };

    return {
      addPerson: apply(model.addPerson),
      updatePerson: apply(model.updatePerson),
      removePerson: applyWithFiles(model.removePerson),
      movePerson: apply(model.movePerson),
      addDocument: apply(model.addDocument),
      updateDocument: apply(model.updateDocument),
      removeDocument: applyWithFiles(model.removeDocument),
      togglePin: apply(model.togglePin),
      addCustomType: apply(model.addCustomType),
      dismissWarning: () => setWarning(null),
    };
  }, []);

  const value = useMemo(() => ({ db, ready: db !== null, warning, actions }), [db, warning, actions]);

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

export function useDb() {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error('useDb вызван вне DbProvider');
  return ctx;
}
