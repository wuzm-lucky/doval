import { request } from '@framework/utils/request';

const prefix = '/base';
const DictApi = {
  PageList: `${prefix}/dict/pagelist`,
  Create: `${prefix}/dict/create`,
  Update: `${prefix}/dict/update`,
  Get: `${prefix}/dict/get/`,
  GetDetail: `${prefix}/dict/get/detail/`,
  Delete: `${prefix}/dict/delete/`,
};

const DictItemApi = {
  ListByDictCode: `${prefix}/dictItem/list/dictCode`,
  Create: `${prefix}/dictItem/create`,
  Update: `${prefix}/dictItem/update`,
  Delete: `${prefix}/dictItem/delete/`,
};

export function pageList(params) {
  return request.post({ url: DictApi.PageList, params });
}
export function create(data) {
  return request.post({ url: DictApi.Create, data });
}
export function update(data) {
  return request.put({ url: DictApi.Update, data });
}
export function get(id) {
  return request.get({ url: `${DictApi.Get}${id}` });
}
export function getDetail(id) {
  return request.get({ url: `${DictApi.GetDetail}${id}` });
}
export function del(id) {
  return request.delete({ url: `${DictApi.Delete}${id}` });
}
export function listItems(data) {
  return request.post({ url: DictItemApi.ListByDictCode, data });
}
export function createItem(data) {
  return request.post({ url: DictItemApi.Create, data });
}
export function updateItem(data) {
  return request.put({ url: DictItemApi.Update, data });
}
export function delItem(id) {
  return request.delete({ url: `${DictItemApi.Delete}${id}` });
}
