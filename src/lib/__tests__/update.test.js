import { describe, it, expect } from 'vitest';
import { isNewer, checkForUpdate } from '../update.js';

const fakeFetch = (body, ok = true) => async () => ({ ok, json: async () => body });

describe('isNewer', () => {
  it('сравнивает по числам, а не по строкам', () => {
    expect(isNewer('1.10.0', '1.9.0')).toBe(true);
    expect(isNewer('v1.5.0', '1.5.0')).toBe(false);
    expect(isNewer('1.4.9', '1.5.0')).toBe(false);
  });
});

describe('checkForUpdate', () => {
  it('отдаёт версию и ссылку на APK, если релиз новее', async () => {
    const f = fakeFetch({ tag_name: 'v1.7.0', html_url: 'h', assets: [{ name: 'vital-1.7.0.apk', browser_download_url: 'apk' }] });
    expect(await checkForUpdate('1.6.0', f)).toEqual({ version: '1.7.0', url: 'apk' });
  });
  it('null, если версия та же, ошибка или нет сети', async () => {
    expect(await checkForUpdate('1.7.0', fakeFetch({ tag_name: 'v1.7.0' }))).toBeNull();
    expect(await checkForUpdate('1.0.0', fakeFetch({}, false))).toBeNull();
    expect(await checkForUpdate('1.0.0', async () => { throw new Error('offline'); })).toBeNull();
  });
});
