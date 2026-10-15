import { LAYOUT } from '@framework/utils/route/constant';

/** 平台管理页面入口。 @author wuzm */
export default [
  {
    path: '/youqianji/platform',
    name: 'YouqianjiPlatform',
    component: LAYOUT,
    redirect: '/youqianji/platform/index',
    meta: { title: { zh_CN: '平台管理' }, icon: 'app', single: true },
    children: [
      {
        path: 'index',
        name: 'YouqianjiPlatformIndex',
        component: () => import('@youqianji/pages/platform/index.vue'),
        meta: { title: { zh_CN: '平台管理' } },
      },
    ],
  },
];
