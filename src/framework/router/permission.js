import 'nprogress/nprogress.css'; // progress bar style

import NProgress from 'nprogress'; // progress bar
import { MessagePlugin } from 'tdesign-vue-next';

import router from '@framework/router';
import { getMenuStore, store, useUserStore } from '@framework/store';
import { ensureAccessToken } from '@framework/pages/login/auth';
import { useSessionStore } from '@framework/store/modules/session';

NProgress.configure({ showSpinner: false });

/**
 * 受保护页面先恢复可用令牌，再加载资料和菜单；网络或业务错误保留会话以便重试。
 * @author wuzm
 */
router.beforeEach(async (to) => {
  NProgress.start();
  if (to.path === '/login') {
    NProgress.done();
    return;
  }
  const loginRoute = { path: '/login', query: { redirect: encodeURIComponent(to.fullPath) } };
  try {
    if (!useSessionStore(store).readSession()) return loginRoute;
    await ensureAccessToken();
    await useUserStore().getUserInfo();
    await getMenuStore().loadMenuList();
    return router.hasRoute(to.name) ? undefined : '/';
  } catch (error) {
    MessagePlugin.error(error.message || '页面加载失败，请重试');
    // 会话服务或请求层只在明确失效时清理凭据，其他异常不强制用户重新登录。
    return useSessionStore(store).readSession() ? false : loginRoute;
  } finally {
    NProgress.done();
  }
});

router.afterEach(() => {
  NProgress.done();
});
