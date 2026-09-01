import { createRouter, createWebHistory } from 'vue-router';

import { getModuleRoutes } from '@framework/bootstrap/modules.js';
import homepageRoutes from '@framework/router/modules/homepage.js';
import resultRoutes from '@framework/router/modules/result.js';
import userRoutes from '@framework/router/modules/user.js';
import { PAGE_NOT_FOUND_ROUTE } from '@framework/utils/route/constant.js';

const env = import.meta.env.MODE || 'development';

/**
 * 框架固定路由只包含框架页面，业务路由由本次启用的模块入口提供。
 *
 * @author wuzm
 */
const frameworkRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@framework/pages/login/index.vue'),
  },
  {
    path: '/',
    redirect: '/home',
  },
  PAGE_NOT_FOUND_ROUTE,
];
export const allRoutes = [...homepageRoutes, ...userRoutes, ...resultRoutes, ...frameworkRoutes, ...getModuleRoutes()];

export const getActive = (maxLevel = 3) => {
  // 非组件内调用必须通过Router实例获取当前路由
  const route = router.currentRoute.value;

  if (!route.path) {
    return '';
  }

  return route.path
    .split('/')
    .filter((_item, index) => index <= maxLevel && index > 0)
    .map((item) => `/${item}`)
    .join('');
};

const router = createRouter({
  history: createWebHistory(env === 'site' ? '/starter/vue-next/' : import.meta.env.VITE_BASE_URL),
  routes: allRoutes,
  scrollBehavior() {
    return {
      el: '#app',
      top: 0,
      behavior: 'smooth',
    };
  },
});

export default router;
