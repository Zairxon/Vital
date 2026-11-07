import { useI18n } from '../lib/i18n.jsx';
import { useUpdate } from '../lib/useUpdate.js';

/** Плашка «Есть обновление» с кнопкой — видна, только если вышла новая версия. */
export default function UpdateBanner() {
  const { t } = useI18n();
  const { update } = useUpdate();
  if (!update) return null;
  return (
    <div className="banner update-banner">
      <span style={{ flex: 1 }}>
        <strong>{t('updateAvailable')}</strong> · {t('newVersion')} {update.version}
      </span>
      <button className="btn btn-primary btn-sm" onClick={() => window.open(update.url, '_blank')}>
        {t('updateButton')}
      </button>
    </div>
  );
}
