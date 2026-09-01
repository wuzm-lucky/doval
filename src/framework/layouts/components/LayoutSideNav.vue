<template>
  <l-side-nav
    v-if="settingStore.showSidebar"
    :show-logo="settingStore.showSidebarLogo"
    :layout="settingStore.layout"
    :is-fixed="settingStore.isSidebarFixed"
    :menu="sideMenu"
    :theme="settingStore.displaySideMode"
    :is-compact="settingStore.isSidebarCompact"
  />
</template>
<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useMenuStore, useSettingStore } from '@framework/store';

import LSideNav from './SideNav.vue';

const route = useRoute();
const menuStore = useMenuStore();
const settingStore = useSettingStore();
const { menuList } = storeToRefs(menuStore);

const sideMenu = computed(() => {
  const { layout, splitMenu } = settingStore;
  let newMenuRouters = menuList.value;
  if (layout === 'mix' && splitMenu) {
    newMenuRouters.forEach((menu) => {
      if (route.path.indexOf(menu.path) === 0 && menu.children?.length) {
        newMenuRouters = menu.children;
      }
    });
  }
  return newMenuRouters;
});
</script>
