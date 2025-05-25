import { createI18n } from 'vue-i18n';
import zh_CN from './locales/zh-CN.json';
import { Language } from '@/types/appSettings';
import { getSettingsLanguage } from '@/services/persistService';

// 定义语言类型
// export type I18nSchema = typeof import('./locales/zh.json');
export type I18nSchema = typeof zh_CN;
declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends I18nSchema {}
}
export const setLanguage = async (lang: Language) => {
  lang = converLanguage(lang)
  console.log('set language', lang);
  try {
    const messages = await getMessage(lang);
    i18n.global.mergeLocaleMessage(lang, messages.default);
    i18n.global.locale.value = lang;
    console.log('language changed to', i18n.global.locale.value);
  } catch (error) {
    console.error('Failed to load language file', error);
  }
};
const converLanguage = (lang: string): Language => {
  if (!lang || lang === 'system') {
    lang = navigator.language;
  }
  if (lang.startsWith('zh')) {
    return 'zh-CN'
  } else if (lang.startsWith('en')) {
    return 'en-US'
  } else {
    return 'en-US'
  }
}
const getMessage = (lang: Language) => {
  return import(`./locales/${lang}.json`);
};
// 获取保存的语言设置
function getSavedLanguage(): Language {
  const language = getSettingsLanguage()
  // 检查是否为有效的语言设置
  return converLanguage(language)
}
const savedLanguage = getSavedLanguage()
export const initI18n = async () => {
  await setLanguage(savedLanguage);
}
// 创建 i18n 实例
const i18n = createI18n({
  legacy: false,
  locale: '',
  fallbackLocale: 'zh-CN',
  globalInjection: true,
  messages: {},
});
// 获取当前语言
export const getCurrentLanguage = (): Language => {
  return i18n.global.locale.value as Language;
};

// 类型安全的翻译函数
export const t = (key: keyof I18nSchema | string): string => {
  return i18n.global.t(key);
};

export default i18n;