import { DashboardIcon } from 'tdesign-icons-vue-next';
import { shallowRef } from 'vue';

import { LAYOUT } from '@/utils/route/constant';

export default [
  {
    path: '/home',
    component: LAYOUT,
    name: 'home',
    meta: {
      title: {
        zh_CN: '首页',
        en_US: 'MainHome',
      },
      icon: shallowRef(DashboardIcon),
      orderNo: 0,
      single: true,
    },
    redirect: '/home/index',
    children: [
      {
        path: 'index',
        name: 'MainHome',
        // 仪表盘模板已裁剪，保留原路由地址并加载项目现有主页。
        component: () => import('@/pages/home/index.vue'),
        meta: {
          title: {
            zh_CN: '首页',
            en_US: 'MainHome',
          },
        },
      },
    ],
  },
];
