import 'nprogress/nprogress.css'; // progress bar style

import NProgress from 'nprogress'; // progress bar
import { MessagePlugin } from 'tdesign-vue-next';

import router from '@framework/router';
import { getMenuStore, useUserStore } from '@framework/store';

NProgress.configure({ showSpinner: false });

const whiteListRouters = ['/login'];

router.beforeEach(async (to) => {
  NProgress.start();

  const userStore = useUserStore();

  if (userStore.accessToken) {
    if (to.path === '/login') {
      return;
    }
    try {
      await userStore.getUserInfo();

      await getMenuStore().loadMenuList();
      if (router.hasRoute(to.name)) {
        return;
      } else {
        return '/';
      }
    } catch (error) {
      userStore.clearSession();
      getMenuStore().resetMenuList();
      MessagePlugin.error(error.message || '登录状态已失效');
      NProgress.done();
      return {
        path: '/login',
        query: { redirect: encodeURIComponent(to.fullPath) },
      };
    }
  } else {
    /* white list router */
    NProgress.done();
    if (whiteListRouters.includes(to.path)) {
      return;
    } else {
      return {
        path: '/login',
        query: { redirect: encodeURIComponent(to.fullPath) },
      };
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});
