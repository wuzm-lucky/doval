import { request } from '@framework/utils/request';

const Api = {
  PageList: '/base/menu/pagelist',
  TreeList: '/base/menu/treelist',
  Create: '/base/menu/create',
  Update: '/base/menu/update',
  Get: '/base/menu/get/',
  Delete: '/base/menu/delete/',
};

export function pageList(data, params) {
  return request.post({ url: Api.PageList, data, params });
}
export function treeList() {
  return request.post({ url: Api.TreeList });
}
export function create(data) {
  return request.post({ url: Api.Create, data });
}
export function update(data) {
  return request.put({ url: Api.Update, data });
}
export function get(id) {
  return request.get({ url: `${Api.Get}${id}` });
}
export function del(id) {
  return request.delete({ url: `${Api.Delete}${id}` });
}
