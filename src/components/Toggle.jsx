/** Переключатель вкл/выкл для строк настроек. */
export default function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      className={`toggle ${checked ? 'is-on' : ''}`}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" />
    </button>
  );
}
