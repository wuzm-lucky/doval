import { LAYOUT } from '@framework/utils/route/constant';

/** 当前登录用户的消息中心路由。 */
export default [
  {
    path: '/message',
    name: 'Message',
    component: LAYOUT,
    redirect: '/message/index',
    meta: { title: { zh_CN: '我的消息', en_US: 'My Messages' }, icon: 'mail', single: true },
    children: [
      {
        path: 'index',
        name: 'MessageIndex',
        component: () => import('@framework/pages/message/index.vue'),
        meta: { title: { zh_CN: '我的消息', en_US: 'My Messages' } },
      },
    ],
  },
];
