import { useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DbProvider, useDb } from './state/DbContext.jsx';
import { shouldLock } from './lib/auth.js';
import Lock from './pages/Lock.jsx';
import People from './pages/People.jsx';
import Person from './pages/Person.jsx';
import Viewer from './pages/Viewer.jsx';
import Settings from './pages/Settings.jsx';

function Routed() {
  const { ready } = useDb();

  if (!ready) {
    return (
      <div className="screen">
        <div className="screen-body">
          <div className="empty"><div className="empty-text">Загрузка…</div></div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<People />} />
      <Route path="/person/:id" element={<Person />} />
      <Route path="/doc/:id" element={<Viewer />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const lastBackgroundAt = useRef(null);

  useEffect(() => {
    let remove;
    // Короткое переключение (уведомление, буфер обмена) не должно требовать
    // PIN заново — блокируем только если приложение пробыло в фоне минуту
    // и дольше (порог — в auth.js, shouldLock).
    import('@capacitor/app').then(({ App: CapApp }) => {
      CapApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          lastBackgroundAt.current = Date.now();
          return;
        }
        if (shouldLock(lastBackgroundAt.current, Date.now())) {
          setUnlocked(false);
        }
        lastBackgroundAt.current = null;
      }).then((handle) => { remove = handle; });
    });
    return () => remove?.remove();
  }, []);

  // Пока не введён PIN, приложение вообще не показывает данные —
  // документы не должны мелькнуть за экраном блокировки.
  if (!unlocked) {
    return <Lock onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <DbProvider>
      <HashRouter>
        <Routed />
      </HashRouter>
    </DbProvider>
  );
}
