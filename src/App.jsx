import { useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { DbProvider, useDb } from './state/DbContext.jsx';
import { shouldLock } from './lib/auth.js';
import { runBackHandlers } from './lib/backButton.js';
import { isNative } from './lib/platform.js';
import Lock from './pages/Lock.jsx';
import People from './pages/People.jsx';
import Person from './pages/Person.jsx';
import Viewer from './pages/Viewer.jsx';
import Settings from './pages/Settings.jsx';

/**
 * Единственное место, где приложение слушает аппаратную/жестовую кнопку
 * «назад». Экраны и шторки могут перехватить нажатие через backButton.js
 * (например, поиск сначала очищается). Если никто не перехватил и мы не
 * на главном экране — переход на предыдущий маршрут. На главном экране —
 * выход из приложения, как ведёт себя любое системное Android-приложение.
 */
function BackButtonRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => {
    if (!isNative()) return;
    let remove;
    import('@capacitor/app').then(({ App: CapApp }) => {
      CapApp.addListener('backButton', () => {
        if (runBackHandlers()) return;
        if (locationRef.current.pathname !== '/') {
          navigate(-1);
        } else {
          CapApp.exitApp();
        }
      }).then((handle) => { remove = handle; });
    });
    return () => remove?.remove();
  }, [navigate]);

  return null;
}

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
    <>
      <BackButtonRouter />
      <Routes>
        <Route path="/" element={<People />} />
        <Route path="/person/:id" element={<Person />} />
        <Route path="/doc/:id" element={<Viewer />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
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
