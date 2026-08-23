export const LAYOUT = () => import('@/layouts/index.vue');
export const BLANK_LAYOUT = () => import('@/layouts/blank.vue');
export const IFRAME = () => import('@/layouts/components/FrameBlank.vue');
// 项目已移除模板结果页，动态路由找不到组件时回到现有登录页。
export const EXCEPTION_COMPONENT = () => import('@/pages/login/index.vue');
export const PARENT_LAYOUT = () =>
  new Promise((resolve) => {
    resolve({ name: 'ParentLayout' });
  });

export const PAGE_NOT_FOUND_ROUTE = {
  path: '/:w+',
  name: '404Page',
  redirect: '/result/404',
};
