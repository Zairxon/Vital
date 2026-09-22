import { useEffect, useRef, useState } from 'react';
import { hasPin, setPin, checkPin, nextDelayMs } from '../lib/auth.js';
import Icon from '../components/Icon.jsx';

const PIN_LENGTH = 4;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

/**
 * Экран блокировки: при первом запуске — установка PIN с подтверждением,
 * иначе — ввод существующего. onUnlock вызывается один раз после успеха.
 */
export default function Lock({ onUnlock }) {
  const [mode, setMode] = useState(null); // 'setup' | 'confirm' | 'enter'
  const [digits, setDigits] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState(null);
  const [shake, setShake] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    hasPin().then((exists) => setMode(exists ? 'enter' : 'setup'));
  }, []);

  useEffect(() => {
    if (waitUntil <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [waitUntil]);

  const waitingMs = Math.max(0, waitUntil - now);
  const locked = waitingMs > 0;

  function press(key) {
    if (locked || !key) return;
    setError(null);
    if (key === 'del') {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    if (digits.length >= PIN_LENGTH) return;
    const next = digits + key;
    setDigits(next);
    if (next.length === PIN_LENGTH) submit(next);
  }

  async function submit(pin) {
    if (mode === 'setup') {
      setFirstPin(pin);
      setMode('confirm');
      setDigits('');
      return;
    }

    if (mode === 'confirm') {
      if (pin !== firstPin) {
        fail('PIN не совпадает. Попробуйте снова.');
        setMode('setup');
        setFirstPin('');
        return;
      }
      await setPin(pin);
      onUnlock();
      return;
    }

    // mode === 'enter'
    const ok = await checkPin(pin);
    if (ok) {
      onUnlock();
      return;
    }
    const nextCount = failCount + 1;
    setFailCount(nextCount);
    const delay = nextDelayMs(nextCount);
    if (delay > 0) setWaitUntil(Date.now() + delay);
    fail(delay > 0 ? 'Слишком много попыток. Подождите.' : 'Неверный PIN.');
  }

  function fail(message) {
    setError(message);
    setDigits('');
    setShake(true);
    setTimeout(() => setShake(false), 400);
  }

  if (!mode) return <div className="screen" />;

  const title = mode === 'setup' ? 'Придумайте PIN' : mode === 'confirm' ? 'Повторите PIN' : 'Введите PIN';

  return (
    <div className="screen lock-screen">
      <div className="lock-body">
        <div className="lock-icon"><Icon name="lock" size={28} /></div>
        <div className="lock-title">{title}</div>

        <div className={`lock-dots ${shake ? 'lock-dots-shake' : ''}`}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span key={i} className={`lock-dot ${i < digits.length ? 'is-filled' : ''}`} />
          ))}
        </div>

        {error && <div className="lock-error">{error}</div>}
        {locked && <div className="lock-error">Повторите через {Math.ceil(waitingMs / 1000)} с</div>}

        <div className="lock-pad">
          {KEYS.map((key, i) => (
            key ? (
              <button
                key={i}
                className="lock-key"
                disabled={locked}
                onClick={() => press(key)}
                aria-label={key === 'del' ? 'Стереть' : key}
              >
                {key === 'del' ? <Icon name="back" size={20} /> : key}
              </button>
            ) : <span key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
