import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DbProvider, useDb } from './state/DbContext.jsx';
import Lock from './pages/Lock.jsx';
import People from './pages/People.jsx';
import Person from './pages/Person.jsx';
import Viewer from './pages/Viewer.jsx';

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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);

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
