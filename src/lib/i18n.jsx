import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Preferences } from '@capacitor/preferences';
import { STRINGS } from './strings.js';

const KEY = 'vital.lang';
const I18nContext = createContext({ lang: 'ru', setLang: () => {}, t: (k) => k });

function guessLang() {
  const n = (navigator.language || 'ru').toLowerCase();
  if (n.startsWith('uz')) return 'uz';
  if (n.startsWith('en')) return 'en';
  return 'ru';
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(guessLang);

  useEffect(() => {
    Preferences.get({ key: KEY }).then(({ value }) => {
      if (value && STRINGS[value]) setLangState(value);
    });
  }, []);

  const setLang = useCallback((next) => {
    setLangState(next);
    Preferences.set({ key: KEY, value: next });
  }, []);

  const value = useMemo(() => ({
    lang, setLang, t: (k) => STRINGS[lang]?.[k] ?? STRINGS.ru[k] ?? k,
  }), [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
