import { LAYOUT } from '@framework/utils/route/constant';

/** base 模块的文件管理路由。 */
export default [
  {
    path: '/base/file',
    name: 'BaseFile',
    component: LAYOUT,
    redirect: '/base/file/index',
    meta: { title: { zh_CN: '文件管理', en_US: 'File Management' }, icon: 'file', single: true },
    children: [
      {
        path: 'index',
        name: 'BaseFileIndex',
        component: () => import('@base/pages/file/index.vue'),
        meta: { title: { zh_CN: '文件管理', en_US: 'File Management' } },
      },
    ],
  },
];
