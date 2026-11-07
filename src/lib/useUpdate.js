import { useEffect, useState } from 'react';
import { checkForUpdate } from './update.js';

// Один запрос на запуск приложения: все экраны делят результат.
let cached = null;
const listeners = new Set();

function run() {
  cached = checkForUpdate().then((u) => { listeners.forEach((l) => l(u)); return u; });
  return cached;
}

export function useUpdate() {
  const [update, setUpdate] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    listeners.add(setUpdate);
    (cached || run()).then(setUpdate);
    return () => listeners.delete(setUpdate);
  }, []);

  async function recheck() {
    setChecking(true);
    setUpdate(await run());
    setChecking(false);
  }

  return { update, checking, recheck };
}
