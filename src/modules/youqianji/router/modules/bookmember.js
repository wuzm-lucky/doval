import { LAYOUT } from '@framework/utils/route/constant';

/** 账簿成员管理页面路由。 */
export default [
  {
    path: '/youqianji/bookmember',
    name: 'YouqianjiBookMember',
    component: LAYOUT,
    redirect: '/youqianji/bookmember/index',
    meta: { title: { zh_CN: '成员管理' }, icon: 'usergroup', single: true },
    children: [
      {
        path: 'index',
        name: 'YouqianjiBookMemberIndex',
        component: () => import('@youqianji/pages/bookmember/index.vue'),
        meta: { title: { zh_CN: '成员管理' } },
      },
    ],
  },
];
