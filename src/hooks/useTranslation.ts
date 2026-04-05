import { useCallback } from 'react';
import { useDataStore } from '../store/useDataStore';
import { en } from '../locales/en';
import { zh } from '../locales/zh';

export function useTranslation() {
  const language = useDataStore((s) => s.language);
  const setLanguage = useDataStore((s) => s.setLanguage);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let current: any = language === 'zh' ? zh : en;
    
    for (const k of keys) {
      if (current[k] === undefined) {
        // Fallback to English if key missing in current language
        let fallback: any = en;
        for (const fk of keys) {
          if (fallback[fk] === undefined) return key;
          fallback = fallback[fk];
        }
        current = fallback;
        break;
      }
      current = current[k];
    }

    if (typeof current !== 'string') return key;

    let res = current;
    if (params) {
      Object.entries(params).forEach(([pk, pv]) => {
        res = res.replace(`{${pk}}`, String(pv));
      });
    }
    return res;
  }, [language]);

  return { t, language, setLanguage };
}
