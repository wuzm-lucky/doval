import { useLocalStorage } from '@vueuse/core';
import { computed } from 'vue';

import { i18n, supportedLocales } from '@/locales/index';
import { useNotificationStore } from '@/store/modules/notification';

export function useLocale() {
  const locale = computed({
    get: () => i18n.global.locale.value,
    set: (val) => {
      i18n.global.locale.value = val;
    },
  });
  const storedLocale = useLocalStorage(supportedLocales, 'zh_CN');

  const changeLocale = (lang) => {
    const validLang = supportedLocales.includes(lang) ? lang : 'zh_CN';
    locale.value = validLang;
    storedLocale.value = validLang;
    // 刷新持久化的翻译数据
    useNotificationStore().refreshMsgData();
  };

  const getComponentsLocale = computed(() => {
    return i18n.global.getLocaleMessage(locale.value).componentsLocale;
  });

  return {
    changeLocale,
    getComponentsLocale,
    locale,
  };
}
