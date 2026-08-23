import en_US from 'tdesign-vue-next/es/locale/en_US';
import zh_CN from 'tdesign-vue-next/es/locale/zh_CN';
import { computed } from 'vue';
import { createI18n } from 'vue-i18n';

export const localeConfigKey = 'tdesign-starter-locale';

// 定义支持的语言列表，添加新语言时只需在此处添加
export const supportedLocales = ['zh_CN', 'en_US'];

const tdesignLocaleMap = { zh_CN, en_US };

const langModules = import.meta.glob('./lang/*.json', { eager: true });

const langCode = [];
const messages = {};
const langList = [];

Object.entries(langModules).forEach(([path, module]) => {
  const code = path.match(/\.\/lang\/([^.]+)\.json$/)?.[1];
  if (!code || !supportedLocales.includes(code)) return;
  langCode.push(code);
  messages[code] = { ...module.default, componentsLocale: tdesignLocaleMap[code] };
  langList.push({ content: module.default.lang, value: code });
});

export { langCode };

// 获取初始语言：优先本地存储，其次浏览器偏好，最后默认中文
const getInitialLocale = () => {
  const stored = localStorage.getItem(localeConfigKey);
  if (stored && supportedLocales.includes(stored)) {
    return stored;
  }
  const preferred = navigator.languages?.[0]?.replace(/-/g, '_');
  if (preferred && supportedLocales.includes(preferred)) {
    return preferred;
  }
  return 'zh_CN';
};

const initialLocale = getInitialLocale();

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'zh_CN',
  messages,
  globalInjection: true,
});

export const languageList = computed(() => langList);
export const { t } = i18n.global;
export default i18n;
