import { request } from '@framework/utils/request';

const Api = {
  PageList: '/base/message/pagelist',
  Get: '/base/message/get/',
  Read: '/base/message/read/',
  Unread: '/base/message/unread/',
  Top: '/base/message/top/',
  CancelTop: '/base/message/top/cancel/',
  Delete: '/base/message/delete/',
  UnreadCount: '/base/message/unread/count',
};

/** 分页查询当前登录用户可见的站内消息。 */
export function pageList(data, params) {
  return request.post({ url: Api.PageList, data, params });
}

/** 查询消息详情；服务端会同时将该消息标记为已读。 */
export function get(id) {
  return request.get({ url: `${Api.Get}${id}` });
}

/** 标记一条消息为已读。 */
export function read(id) {
  return request.post({ url: `${Api.Read}${id}` });
}

/** 将一条已读消息恢复为未读。 */
export function unread(id) {
  return request.post({ url: `${Api.Unread}${id}` });
}

/** 设置或取消当前用户对一条消息的置顶状态。 */
export function setTop(id, top) {
  return request.post({ url: `${Api.Top}${id}`, params: { top } });
}

/** 取消当前用户对一条消息的置顶状态。 */
export function cancelTop(id) {
  return request.post({ url: `${Api.CancelTop}${id}` });
}

/** 从当前登录用户的消息列表中删除一条消息。 */
export function deleteMessage(id) {
  return request.post({ url: `${Api.Delete}${id}` });
}

/** 查询当前用户未读消息数量。 */
export function getUnreadCount() {
  return request.get({ url: Api.UnreadCount });
}
