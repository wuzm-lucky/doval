import { LogoutIcon } from 'tdesign-icons-vue-next';
import { shallowRef } from 'vue';

import { LAYOUT } from '@framework/utils/route/constant';

export default [
  {
    path: '/profile',
    name: 'profile',
    component: LAYOUT,
    redirect: '/profile/index',
    meta: { title: { zh_CN: '个人中心', en_US: 'User Center' }, icon: 'user-circle' },
    children: [
      {
        path: 'index',
        name: 'ProfileIndex',
        component: () => import('@framework/pages/user/index.vue'),
        meta: { title: { zh_CN: '个人中心', en_US: 'User Center' } },
      },
    ],
  },
];
