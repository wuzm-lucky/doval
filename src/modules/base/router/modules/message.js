import { LAYOUT } from '@framework/utils/route/constant';

/** base 模块的消息管理路由。 */
export default [
  {
    path: '/base/message',
    name: 'BaseMessage',
    component: LAYOUT,
    redirect: '/base/message/index',
    meta: { title: { zh_CN: '消息管理', en_US: 'Message Management' }, icon: 'notification', single: true },
    children: [
      {
        path: 'index',
        name: 'BaseMessageManageIndex',
        component: () => import('@base/pages/message/index.vue'),
        meta: { title: { zh_CN: '消息管理', en_US: 'Message Management' } },
      },
    ],
  },
];
