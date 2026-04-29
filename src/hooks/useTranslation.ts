import { useDataStore } from '../store/useDataStore';
import { en } from '../locales/en';
import { zh } from '../locales/zh';

type TranslationSchema = typeof en;

type DotPaths<T, Prefix extends string = ''> = T extends string
  ? Prefix
  : { [K in keyof T & string]: DotPaths<T[K], Prefix extends '' ? K : `${Prefix}.${K}`> }[keyof T & string];

type TranslationKey = DotPaths<TranslationSchema>;

/**
 * Super lightweight translation hook.
 */
export function useTranslation() {
  const { language, setLanguage } = useDataStore();

  const translations: TranslationSchema = language === 'zh' ? (zh as TranslationSchema) : en;

  function t(path: TranslationKey, params?: Record<string, string | number>): string {
    const keys = path.split('.');
    let value: unknown = translations;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return path;
      }
    }

    if (typeof value !== 'string') return path;
    let result = value;

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        result = result.replace(`{${key}}`, String(val));
      });
    }

    return result;
  }

  return { t, language, setLanguage };
}
