import 'nprogress/nprogress.css'; // progress bar style

import NProgress from 'nprogress'; // progress bar
import { MessagePlugin } from 'tdesign-vue-next';

import router from '@framework/router';
import { getMenuStore, useUserStore } from '@framework/store';

NProgress.configure({ showSpinner: false });

const whiteListRouters = ['/login'];

router.beforeEach(async (to, _from, next) => {
  NProgress.start();

  const userStore = useUserStore();

  if (userStore.accessToken) {
    if (to.path === '/login') {
      next();
      return;
    }
    try {
      await userStore.getUserInfo();

      await getMenuStore().loadMenuList();
      if (router.hasRoute(to.name)) {
        next();
      } else {
        next(`/`);
      }
    } catch (error) {
      userStore.clearSession();
      getMenuStore().resetMenuList();
      MessagePlugin.error(error.message || '登录状态已失效');
      next({
        path: '/login',
        query: { redirect: encodeURIComponent(to.fullPath) },
      });
      NProgress.done();
    }
  } else {
    /* white list router */
    if (whiteListRouters.includes(to.path)) {
      next();
    } else {
      next({
        path: '/login',
        query: { redirect: encodeURIComponent(to.fullPath) },
      });
    }
    NProgress.done();
  }
});

router.afterEach((to) => {
  NProgress.done();
});
