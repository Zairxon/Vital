import { useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { copyText, noteLines, noteValue } from '../lib/clipboard.js';

/**
 * Заметки документа: каждая отдельной строкой, нажатие копирует её целиком
 * (или только значение после «Название: »).
 */
export default function CopyNotes({ note, className = '' }) {
  const { t } = useI18n();
  const [done, setDone] = useState(null);
  const lines = noteLines(note);
  if (!lines.length) return null;

  async function copy(e, i, line) {
    e.stopPropagation();
    if (await copyText(noteValue(line))) {
      setDone(i);
      setTimeout(() => setDone((v) => (v === i ? null : v)), 1800);
    }
  }

  return (
    <div className={`note-list ${className}`}>
      {lines.map((line, i) => (
        <div key={i} className="note-line" role="button" tabIndex={0}
          onClick={(e) => copy(e, i, line)}
          onKeyDown={(e) => { if (e.key === 'Enter') copy(e, i, line); }}>
          <span className="note-text">{line}</span>
          {done === i && <span className="note-done">{t('copied')}</span>}
        </div>
      ))}
    </div>
  );
}
