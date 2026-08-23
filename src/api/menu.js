import { request } from '@/utils/request';

const Api = {
  MenuTree: '/base/menu/treelist',
};

/** 获取服务端维护的菜单树。 */
export function getMenuTree() {
  return request.post({
    url: Api.MenuTree,
  });
}
