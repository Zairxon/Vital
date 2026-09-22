import { useRef, useState } from 'react';
import Sheet from './Sheet.jsx';
import Icon from './Icon.jsx';
import { checkPin, setPin } from '../lib/auth.js';

const PIN_LENGTH = 4;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

/** Смена PIN: текущий → новый → подтверждение нового. */
export default function ChangePinSheet({ onClose }) {
  const [step, setStep] = useState('current'); // 'current' | 'new' | 'confirm'
  const [digits, setDigits] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState(null);
  const digitsRef = useRef('');

  function press(key) {
    setError(null);
    if (key === 'del') {
      digitsRef.current = digitsRef.current.slice(0, -1);
      setDigits(digitsRef.current);
      return;
    }
    if (digitsRef.current.length >= PIN_LENGTH) return;
    digitsRef.current += key;
    setDigits(digitsRef.current);
    if (digitsRef.current.length === PIN_LENGTH) submit(digitsRef.current);
  }

  function reset() {
    digitsRef.current = '';
    setDigits('');
  }

  async function submit(pin) {
    if (step === 'current') {
      const ok = await checkPin(pin);
      reset();
      if (!ok) { setError('Неверный PIN.'); return; }
      setStep('new');
      return;
    }
    if (step === 'new') {
      setNewPin(pin);
      reset();
      setStep('confirm');
      return;
    }
    // confirm
    reset();
    if (pin !== newPin) {
      setError('PIN не совпадает. Начните заново.');
      setNewPin('');
      setStep('new');
      return;
    }
    await setPin(pin);
    onClose(true);
  }

  const title = step === 'current' ? 'Текущий PIN' : step === 'new' ? 'Новый PIN' : 'Повторите новый PIN';

  return (
    <Sheet title={title} onClose={() => onClose(false)}>
      <div className="lock-dots" style={{ justifyContent: 'center', margin: 'var(--space-4) 0' }}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span key={i} className={`lock-dot ${i < digits.length ? 'is-filled' : ''}`} />
        ))}
      </div>

      {error && <div className="lock-error">{error}</div>}

      <div className="lock-pad" style={{ margin: 'var(--space-2) auto 0' }}>
        {KEYS.map((key, i) => (
          key ? (
            <button
              key={i}
              className="lock-key"
              onClick={() => press(key)}
              aria-label={key === 'del' ? 'Стереть' : key}
            >
              {key === 'del' ? <Icon name="back" size={20} /> : key}
            </button>
          ) : <span key={i} />
        ))}
      </div>
    </Sheet>
  );
}
