export const LAYOUT = () => import('@framework/layouts/index.vue');
export const BLANK_LAYOUT = () => import('@framework/layouts/blank.vue');
export const IFRAME = () => import('@framework/layouts/components/FrameBlank.vue');
// 项目已移除模板结果页，动态路由找不到组件时回到现有登录页。
export const EXCEPTION_COMPONENT = () => import('@framework/pages/login/index.vue');
export const PARENT_LAYOUT = () =>
  new Promise((resolve) => {
    resolve({ name: 'ParentLayout' });
  });

export const PAGE_NOT_FOUND_ROUTE = {
  path: '/:w+',
  name: '404Page',
  redirect: '/result/404',
};
