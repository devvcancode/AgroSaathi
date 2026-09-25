import en from './en';
import hi from './hi';
import pa from './pa';

export const dictionaries = { en, hi, pa };
export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

export function getDictionary(locale) {
  return dictionaries[locale] || dictionaries.en;
}
