import { LAYOUT } from '@framework/utils/route/constant';

/** 个人配置页面沿用模块路由自动发现机制。 */
export default [
  {
    path: '/youqianji/userconfig',
    name: 'YouqianjiUserConfig',
    component: LAYOUT,
    redirect: '/youqianji/userconfig/index',
    meta: { title: { zh_CN: '个人配置' }, icon: 'setting', single: true },
    children: [
      {
        path: 'index',
        name: 'YouqianjiUserConfigIndex',
        component: () => import('@youqianji/pages/userconfig/index.vue'),
        meta: { title: { zh_CN: '个人配置' } },
      },
    ],
  },
];
