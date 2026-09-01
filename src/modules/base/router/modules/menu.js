import { LAYOUT } from '@framework/utils/route/constant';

/** base 模块的菜单管理路由。 */
export default [
  {
    path: '/base/menu',
    name: 'BaseMenu',
    component: LAYOUT,
    redirect: '/base/menu/index',
    meta: { title: { zh_CN: '菜单管理', en_US: 'Menu Management' }, icon: 'menu', single: true },
    children: [
      {
        path: 'index',
        name: 'BaseMenuIndex',
        component: () => import('@base/pages/menu/index.vue'),
        meta: { title: { zh_CN: '菜单管理', en_US: 'Menu Management' } },
      },
    ],
  },
];
