import { LAYOUT } from '@framework/utils/route/constant';

/** 个人配置页面沿用模块路由自动发现机制。 */
export default [
  {
    path: '/youqianji/personalconfig',
    name: 'YouqianjiPersonalConfig',
    component: LAYOUT,
    redirect: '/youqianji/personalconfig/index',
    meta: { title: { zh_CN: '个人配置' }, icon: 'setting', single: true },
    children: [
      {
        path: 'index',
        name: 'YouqianjiPersonalConfigIndex',
        component: () => import('@youqianji/pages/personalconfig/index.vue'),
        meta: { title: { zh_CN: '个人配置' } },
      },
    ],
  },
];
