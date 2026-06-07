import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import yo from './locales/yo';
import ig from './locales/ig';
import ha from './locales/ha';
import pcm from './locales/pcm';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'yo', label: 'Yorùbá' },
  { code: 'ig', label: 'Igbo' },
  { code: 'ha', label: 'Hausa' },
  { code: 'pcm', label: 'Pidgin' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

const STORAGE_KEY = 'dermascan_lang';

const savedLang = (localStorage.getItem(STORAGE_KEY) as LanguageCode) || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    yo: { translation: yo },
    ig: { translation: ig },
    ha: { translation: ha },
    pcm: { translation: pcm },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function setLanguage(code: LanguageCode) {
  i18n.changeLanguage(code);
  localStorage.setItem(STORAGE_KEY, code);
}

export default i18n;
