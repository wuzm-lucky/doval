import { request } from '@framework/utils/request';

const prefix = '/youqianji/book';

/** 分页获取当前登录用户可访问的账簿。 */
export function pageList(data, params) {
  return request.post({ url: `${prefix}/pagelist`, data, params });
}

/** 获取账簿公共资料、个人偏好和当前有效成员。 */
export function getBook(id) {
  return request.get({ url: `${prefix}/get`, params: { id } });
}

/** 创建或更新账簿公共资料。 */
export function saveBook(data) {
  return request.post({ url: `${prefix}/save`, data });
}

/** 删除由当前用户创建的账簿。 */
export function deleteBook(id) {
  return request.post({ url: `${prefix}/delete`, data: { bookId: id } });
}

/** 保存当前用户独立维护的账簿排序、显示状态和默认账户。 */
export function saveBookRelation(data) {
  return request.post({ url: `${prefix}/relation/save`, data });
}

/** 新增或更新仅用于交易、账户归属选择的账簿内部成员。 */
export function saveBookMember(data) {
  return request.post({ url: `${prefix}/member/save`, data });
}

/** 移除账簿内部成员，不影响任何已分享用户。 */
export function deleteBookMember(data) {
  return request.post({ url: `${prefix}/member/delete`, data });
}

/** 邀请已注册用户访问账簿。 */
export function saveBookShare(data) {
  return request.post({ url: `${prefix}/share/save`, data });
}

/** 查询账簿已邀请的账户。 */
export function listBookShares(bookId) {
  return request.get({ url: `${prefix}/share/list`, params: { bookId } });
}

/** 取消已分享用户的账簿访问权限。 */
export function deleteBookShare(data) {
  return request.post({ url: `${prefix}/share/delete`, data });
}
