import { request } from '@framework/utils/request';

const prefix = '/youqianji/book';

/** 分页获取归属于当前登录用户的账簿，关键词按名称前缀匹配。 */
export function pageList(data, params) {
  return request.post({ url: `${prefix}/pagelist`, data, params });
}

/** 查询当前用户可见账簿，供成员管理等需要切换账簿的页面使用。 */
export function listBook(data) {
  return request.post({ url: `${prefix}/list`, data });
}

/** 获取本人账簿详情。 */
export function getBook(id) {
  return request.get({ url: `${prefix}/get/${id}` });
}

/** 根据是否有主键分别调用创建、编辑接口。 */
export function saveBook(data) {
  return request.post({ url: `${prefix}/${data.id == null ? 'create' : 'update'}`, data });
}

/** 删除本人账簿。 */
export function deleteBook(id) {
  return request.post({ url: `${prefix}/delete/${id}` });
}

/** 将本人账簿设为显示状态。 */
export function showBook(id) {
  return request.post({ url: `${prefix}/show/${id}` });
}

/** 将本人账簿设为隐藏状态。 */
export function hideBook(id) {
  return request.post({ url: `${prefix}/hide/${id}` });
}

/** 按账簿主键与成员名称前缀查询有效成员。 */
export function listBookMember(data) {
  return request.post({ url: `${prefix}/member/list`, data });
}

/** 根据成员主键决定调用新增或编辑接口。 */
export function saveBookMember(data) {
  return request.post({ url: `${prefix}/member/${data.id == null ? 'create' : 'update'}`, data });
}

/** 逻辑删除指定账簿成员。 */
export function deleteBookMember(id) {
  return request.post({ url: `${prefix}/member/delete/${id}` });
}
