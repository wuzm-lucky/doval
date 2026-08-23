import { LogoutIcon } from 'tdesign-icons-vue-next';
import { shallowRef } from 'vue';

import { LAYOUT } from '@/utils/route/constant';

export default [
  {
    path: '/user',
    name: 'user',
    component: LAYOUT,
    redirect: '/user/index',
    meta: { title: { zh_CN: '个人中心', en_US: 'User Center' }, icon: 'user-circle' },
    children: [
      {
        path: 'index',
        name: 'UserIndex',
        component: () => import('@/pages/user/index.vue'),
        meta: { title: { zh_CN: '个人中心', en_US: 'User Center' } },
      },
    ],
  },
];
