import en from './src/i18n/locales/en.ts';
import yo from './src/i18n/locales/yo.ts';
import ig from './src/i18n/locales/ig.ts';
import ha from './src/i18n/locales/ha.ts';
import pcm from './src/i18n/locales/pcm.ts';

const files = { yo, ig, ha, pcm };

function checkObj(base: any, target: any, path: string, lang: string) {
  for (const key in base) {
    if (typeof base[key] === 'object' && base[key] !== null) {
      if (!target[key]) {
        console.log(`[${lang}] Missing section: ${path}${key}`);
      } else {
        checkObj(base[key], target[key], `${path}${key}.`, lang);
      }
    } else {
      if (target[key] === undefined) {
        console.log(`[${lang}] Missing key: ${path}${key}`);
      }
    }
  }
}

for (const [lang, obj] of Object.entries(files)) {
  checkObj(en, obj, '', lang);
}
