import { request } from '@framework/utils/request';

const prefix = '/base';
const DictApi = {
  List: `${prefix}/dict/list`,
  Create: `${prefix}/dict/create`,
  Update: `${prefix}/dict/update`,
  Get: `${prefix}/dict/get/`,
  GetDetail: `${prefix}/dict/get/detail/`,
  Delete: `${prefix}/dict/delete/`,
};

const DictItemApi = {
  PageList: `${prefix}/dictItem/pagelist`,
  Create: `${prefix}/dictItem/create`,
  Update: `${prefix}/dictItem/update`,
  Delete: `${prefix}/dictItem/delete/`,
};

/**
 * 查询字典列表，用于构建字典树及按编码、名称筛选。
 *
 * @param {{ codeRLike?: string, nameLike?: string }} data 查询条件
 */
export function list(data) {
  return request.post({ url: DictApi.List, data });
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
/**
 * 分页查询指定字典的字典项。
 *
 * @param {{ dictId?: number, nameLike?: string, group?: string }} data 查询条件
 * @param {{ page?: number, size?: number }} params 分页参数
 */
export function pageListItems(data, params) {
  return request.post({ url: DictItemApi.PageList, data, params });
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
