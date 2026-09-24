import { request } from '@framework/utils/request';

const Api = {
  PageList: '/base/message/manage/pagelist',
  Get: '/base/message/manage/get/',
  Create: '/base/message/manage/create',
  Update: '/base/message/manage/update',
  Delete: '/base/message/manage/delete/',
};

/** 分页查询管理端站内消息。 */
export function managePageList(data, params) {
  return request.post({ url: Api.PageList, data, params });
}

/** 查询管理端消息详情，用于编辑时回填完整正文。 */
export function getMessage(id) {
  return request.get({ url: `${Api.Get}${id}` });
}

/** 发布站内消息。 */
export function createMessage(data) {
  return request.post({ url: Api.Create, data });
}

/** 编辑已发布消息内容。 */
export function updateMessage(data) {
  return request.put({ url: Api.Update, data });
}

/** 逻辑删除管理端指定的消息。 */
export function deleteMessage(id) {
  return request.post({ url: `${Api.Delete}${id}` });
}
