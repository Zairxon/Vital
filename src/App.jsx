import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DbProvider, useDb } from './state/DbContext.jsx';
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
  return (
    <DbProvider>
      <HashRouter>
        <Routed />
      </HashRouter>
    </DbProvider>
  );
}
