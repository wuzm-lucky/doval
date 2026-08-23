import { defineStore } from 'pinia';

import { getMenuTree } from '@/api/menu';
import { store } from '@/store';

/**
 * 将服务端菜单树转换为前端展示结构。
 * 顶层无子项菜单需要标记为单个主菜单，其他节点保持服务端树结构。
 */
function transformMenuTree(menuList, isTopLevel = true) {
  return menuList.map((menu) => {
    const children = Array.isArray(menu.children) ? menu.children : [];
    const transformedMenu = {
      ...menu,
      meta: { ...menu.meta },
    };

    if (children.length > 0) {
      transformedMenu.children = transformMenuTree(children, false);
    } else if (isTopLevel) {
      transformedMenu.meta.single = true;
    }

    return transformedMenu;
  });
}

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menuList: [],
    loaded: false,
  }),
  actions: {
    async loadMenuList() {
      if (this.loaded) {
        return;
      }

      try {
        const menuTree = await getMenuTree();
        this.menuList = transformMenuTree(menuTree);
        this.loaded = true;
      } catch (error) {
        console.error('加载服务端菜单失败:', error);
        throw error;
      }
    },
    resetMenuList() {
      this.menuList = [];
      this.loaded = false;
    },
  },
});

export function getMenuStore() {
  return useMenuStore(store);
}
