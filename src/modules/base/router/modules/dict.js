import { LAYOUT } from '@framework/utils/route/constant';

/** base 模块的字典管理路由。 */
export default [
  {
    path: '/base/dict',
    name: 'BaseDict',
    component: LAYOUT,
    redirect: '/base/dict/index',
    meta: { title: { zh_CN: '字典管理', en_US: 'Dict Management' }, icon: 'data', single: true },
    children: [
      {
        path: 'index',
        name: 'BaseDictIndex',
        component: () => import('@base/pages/dict/index.vue'),
        meta: { title: { zh_CN: '字典管理', en_US: 'Dict Management' } },
      },
    ],
  },
];
