<template>
  <l-header
    v-if="settingStore.showHeader"
    :show-logo="settingStore.showHeaderLogo"
    :theme="settingStore.displayMode"
    :layout="settingStore.layout"
    :is-fixed="settingStore.isHeaderFixed"
    :menu="headerMenu"
    :is-compact="settingStore.isSidebarCompact"
  />
</template>
<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useMenuStore, useSettingStore } from '@framework/store';

import LHeader from './Header.vue';

const menuStore = useMenuStore();
const settingStore = useSettingStore();
const { menuList } = storeToRefs(menuStore);
const headerMenu = computed(() => {
  if (settingStore.layout === 'mix') {
    if (settingStore.splitMenu) {
      return menuList.value.map((menu) => ({
        ...menu,
        children: [],
      }));
    }
    return [];
  }
  return menuList.value;
});
</script>
