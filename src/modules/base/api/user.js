import { request } from '@framework/utils/request';

const prefix = '/base';
const Api = {
  PageList: `${prefix}/user/pagelist`,
  List: `${prefix}/user/list`,
  Create: `${prefix}/user/create`,
  Update: `${prefix}/user/update`,
  Get: `${prefix}/user/get/`,
  Delete: `${prefix}/user/delete/`,
};

export function pageList(data, params) {
  return request.post({ url: Api.PageList, data, params });
}
export function list(data = {}) {
  return request.post({ url: Api.List, data });
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
