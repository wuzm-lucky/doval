import { LAYOUT } from '@framework/utils/route/constant';

/** 账簿管理页面路由。 */
export default [
  {
    path: '/youqianji/book',
    name: 'YouqianjiBook',
    component: LAYOUT,
    redirect: '/youqianji/book/index',
    meta: { title: { zh_CN: '账簿管理' }, icon: 'wallet', single: true },
    children: [
      {
        path: 'index',
        name: 'YouqianjiBookIndex',
        component: () => import('@youqianji/pages/book/index.vue'),
        meta: { title: { zh_CN: '账簿管理' } },
      },
    ],
  },
];
