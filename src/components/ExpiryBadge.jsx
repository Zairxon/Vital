import { expiryStatus, expiryLabel } from '../lib/expiry.js';

/**
 * Цветная подпись срока действия — только когда есть что показать
 * (за EXPIRY_WARNING_DAYS дней до истечения или после). Обычный,
 * ещё далёкий срок никак не выделяется — не отвлекает.
 */
export default function ExpiryBadge({ expiryDate, style }) {
  const status = expiryStatus(expiryDate);
  if (!status || status === 'ok') return null;

  const color = status === 'expired' ? 'var(--danger)' : 'var(--warning)';
  return (
    <span className="expiry-badge" style={{ color, ...style }}>
      {expiryLabel(expiryDate)}
    </span>
  );
}
