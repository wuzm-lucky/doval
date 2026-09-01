<template>
  <t-dropdown trigger="click">
    <t-button theme="default" shape="square" variant="text">
      <translate-icon />
    </t-button>
    <t-dropdown-menu>
      <t-dropdown-item
        v-for="(lang, index) in languageList"
        :key="index"
        :value="lang.value"
        @click="(options) => changeLang(options.value)"
        >{{ lang.content }}</t-dropdown-item
      ></t-dropdown-menu
    >
  </t-dropdown>
</template>
<script setup>
import { TranslateIcon } from 'tdesign-icons-vue-next';

import { languageList } from '@framework/locales';
import { useLocale } from '@framework/locales/useLocale';

const { changeLocale } = useLocale();

const changeLang = (lang) => {
  changeLocale(lang);
};
</script>
