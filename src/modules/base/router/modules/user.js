import { LAYOUT } from '@framework/utils/route/constant';

/** base 模块的用户管理路由。 */
export default [
  {
    path: '/base/user',
    name: 'BaseUser',
    component: LAYOUT,
    redirect: '/base/user/index',
    meta: { title: { zh_CN: '用户管理', en_US: 'User Management' }, icon: 'user', single: true },
    children: [
      {
        path: 'index',
        name: 'BaseUserIndex',
        component: () => import('@base/pages/user/index.vue'),
        meta: { title: { zh_CN: '用户管理', en_US: 'User Management' } },
      },
    ],
  },
];
