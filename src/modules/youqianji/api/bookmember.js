import { request } from '@framework/utils/request';

const prefix = '/youqianji/book';

/** 按账簿、名称前缀与状态查询成员；省略状态返回全部，选择场景传 ACTIVE。 @author wuzm */
export function listBookMember(data) {
  return request.post({ url: `${prefix}/member/list`, data });
}

/** 根据成员主键决定调用新增或编辑接口。 */
export function saveBookMember(data) {
  return request.post({ url: `${prefix}/member/${data.id == null ? 'create' : 'update'}`, data });
}

/** 物理删除指定成员；保留历史身份时应使用归档。 @author wuzm */
export function deleteBookMember(id) {
  return request.post({ url: `${prefix}/member/delete/${id}` });
}

/** 归档成员，停止新增选择并保留历史身份。 @author wuzm */
export function archiveBookMember(id) {
  return request.post({ url: `${prefix}/member/archive/${id}` });
}

/** 使用原成员主键恢复可用状态。 @author wuzm */
export function restoreBookMember(id) {
  return request.post({ url: `${prefix}/member/restore/${id}` });
}

/** 相对目标成员排序：where=1 为之前，-1 为之后。 @author wuzm */
export function sortBookMember(data) {
  return request.post({ url: `${prefix}/member/sort`, data });
}
