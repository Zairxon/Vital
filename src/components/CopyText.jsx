import { useState } from 'react';
import { copyText, splitCopyable } from '../lib/clipboard.js';

/** Текст, в котором номера (паспорт, ЖШШИР и т.п.) копируются по нажатию. */
export default function CopyText({ text, className = '' }) {
  const [done, setDone] = useState(null);

  async function copy(e, value) {
    e.stopPropagation();
    if (await copyText(value)) {
      setDone(value);
      setTimeout(() => setDone((v) => (v === value ? null : v)), 1800);
    }
  }

  return (
    <>
      {splitCopyable(text || '').map((p, i) =>
        p.copy ? (
          <span key={i} className={`copy-token ${className}`} role="button" tabIndex={0}
            onClick={(e) => copy(e, p.text)}
            onKeyDown={(e) => { if (e.key === 'Enter') copy(e, p.text); }}>
            {done === p.text ? 'Скопировано ✓' : p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}
