import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDb } from '../state/DbContext.jsx';
import {
  canUseBiometric, isBiometricEnabled, setBiometricEnabled,
  isScreenshotBlockEnabled, setScreenshotBlockEnabled,
} from '../lib/auth.js';
import { storageStats, formatBytes, shareBlob } from '../lib/files.js';
import { exportZip, importZip } from '../lib/backup.js';
import { pickZipFile } from '../lib/pick.js';
import { fileWord } from '../lib/format.js';
import Icon from '../components/Icon.jsx';
import Toggle from '../components/Toggle.jsx';
import ChangePinSheet from '../components/ChangePinSheet.jsx';
import { Confirm } from '../components/Sheet.jsx';

export default function Settings() {
  const navigate = useNavigate();
  const { reload } = useDb();

  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricOn, setBiometricOn] = useState(true);
  const [screenshotBlockOn, setScreenshotBlockOn] = useState(true);
  const [stats, setStats] = useState({ count: 0, bytes: 0 });
  const [changingPin, setChangingPin] = useState(false);
  const [pinChanged, setPinChanged] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmImport, setConfirmImport] = useState(null); // выбранный файл, ждёт подтверждения

  useEffect(() => {
    canUseBiometric().then(setBiometricSupported);
    isBiometricEnabled().then(setBiometricOn);
    isScreenshotBlockEnabled().then(setScreenshotBlockOn);
    storageStats().then(setStats);
  }, []);

  async function toggleBiometric(next) {
    setBiometricOn(next);
    await setBiometricEnabled(next);
  }

  async function toggleScreenshotBlock(next) {
    setScreenshotBlockOn(next);
    await setScreenshotBlockEnabled(next);
    // Сам флаг FLAG_SECURE применяется нативным кодом при следующем
    // запуске (появится вместе с android/ — задача 14); здесь только
    // сохраняется, чего хочет пользователь.
  }

  async function doExport() {
    setError(null);
    setExporting(true);
    try {
      const zip = await exportZip();
      const date = new Date().toISOString().slice(0, 10);
      await shareBlob(zip, `vital-${date}.zip`, 'Резервная копия Vital');
    } catch {
      setError('Не удалось создать резервную копию.');
    } finally {
      setExporting(false);
    }
  }

  async function pickForImport() {
    setError(null);
    try {
      const file = await pickZipFile();
      if (file) setConfirmImport(file);
    } catch {
      setError('Не удалось прочитать файл.');
    }
  }

  async function doImport() {
    const file = confirmImport;
    setConfirmImport(null);
    setImporting(true);
    setError(null);
    try {
      await importZip(file.blob);
      await reload();
      storageStats().then(setStats);
    } catch (e) {
      setError(e?.message || 'Не удалось восстановить резервную копию.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Назад">
          <Icon name="back" />
        </button>
        <div className="topbar-title">Настройки</div>
      </div>

      <div className="screen-body">
        {error && (
          <div className="banner">
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError(null)} aria-label="Скрыть"><Icon name="close" size={16} /></button>
          </div>
        )}
        {pinChanged && (
          <div className="banner" style={{ background: 'rgba(107,111,60,.2)', borderColor: 'var(--success)' }}>
            <span style={{ flex: 1 }}>PIN изменён.</span>
            <button onClick={() => setPinChanged(false)} aria-label="Скрыть"><Icon name="close" size={16} /></button>
          </div>
        )}

        <div className="group-title" style={{ marginTop: 0 }}>Защита</div>
        <div className="settings-section">
          <button className="settings-row" onClick={() => setChangingPin(true)}>
            <Icon name="lock" size={18} style={{ color: 'var(--text-muted)' }} />
            <span className="settings-row-label">Сменить PIN</span>
            <Icon name="chevron" size={18} style={{ color: 'var(--text-hint)' }} />
          </button>

          {biometricSupported && (
            <div className="settings-row">
              <Icon name="fingerprint" size={18} style={{ color: 'var(--text-muted)' }} />
              <span className="settings-row-label">Вход по отпечатку</span>
              <Toggle checked={biometricOn} onChange={toggleBiometric} />
            </div>
          )}

          <div className="settings-row">
            <Icon name="image" size={18} style={{ color: 'var(--text-muted)' }} />
            <span className="settings-row-text">
              <span className="settings-row-label" style={{ display: 'block' }}>Запрет скриншотов</span>
              <span className="settings-row-hint">Документы не попадут в снимки экрана</span>
            </span>
            <Toggle checked={screenshotBlockOn} onChange={toggleScreenshotBlock} />
          </div>
        </div>

        <div className="group-title">Резервная копия</div>
        <div className="settings-section">
          <button className="settings-row" onClick={doExport} disabled={exporting}>
            <Icon name="share" size={18} style={{ color: 'var(--text-muted)' }} />
            <span className="settings-row-label">
              {exporting ? 'Готовлю архив…' : 'Экспорт всего в ZIP'}
            </span>
          </button>
          <button className="settings-row" onClick={pickForImport} disabled={importing}>
            <Icon name="file" size={18} style={{ color: 'var(--text-muted)' }} />
            <span className="settings-row-label">
              {importing ? 'Восстанавливаю…' : 'Импорт из ZIP'}
            </span>
          </button>
        </div>

        <div className="settings-footer">
          Занято на диске: {formatBytes(stats.bytes)} ({stats.count} {fileWord(stats.count)})
        </div>
      </div>

      {changingPin && (
        <ChangePinSheet onClose={(saved) => { setChangingPin(false); if (saved) setPinChanged(true); }} />
      )}

      {confirmImport && (
        <Confirm
          title="Заменить все данные?"
          text={`Файл «${confirmImport.name}» заменит все текущие документы и людей. Отменить это будет нельзя — если нужно сохранить текущие данные, сначала сделайте экспорт.`}
          confirmLabel="Заменить"
          onConfirm={doImport}
          onClose={() => setConfirmImport(null)}
        />
      )}
    </div>
  );
}
