import isObject from 'lodash/isObject';
import { createRouter, createWebHistory } from 'vue-router';

import { PAGE_NOT_FOUND_ROUTE } from '@/utils/route/constant';

const env = import.meta.env.MODE || 'development';

// 导入homepage相关固定路由
const homepageModules = import.meta.glob('./modules/**/homepage.js', { eager: true });

// 导入modules非homepage相关固定路由
const fixedModules = import.meta.glob(['./modules/**/*.js', '!./modules/**/homepage.js'], { eager: true });

// 其他固定路由
const defaultRouterList = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/login/index.vue'),
  },
  {
    path: '/',
    redirect: '/home',
  },
  PAGE_NOT_FOUND_ROUTE,
];
// 存放固定路由
export const homepageRouterList = mapModuleRouterList(homepageModules);
export const fixedRouterList = mapModuleRouterList(fixedModules);

export const allRoutes = [...homepageRouterList, ...fixedRouterList, ...defaultRouterList];

// 固定路由模块转换为路由
export function mapModuleRouterList(modules) {
  const routerList = [];
  Object.keys(modules).forEach((key) => {
    const routeModule = modules[key];
    if (isObject(routeModule) && 'default' in routeModule) {
      const route = routeModule.default;
      const routes = Array.isArray(route) ? [...route] : [route];
      routerList.push(...routes);
    }
  });
  return routerList;
}

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
