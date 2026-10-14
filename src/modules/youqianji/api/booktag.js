import { request } from '@framework/utils/request';

const prefix = '/youqianji/book';

/** 查询账簿全部标签，管理场景包含归档数据。 @author wuzm */
export function listBookTag(data) {
  return request.post({ url: `${prefix}/tag/list`, data });
}

/** 按主键新增或编辑标签，请求字段由页面白名单生成。 @author wuzm */
export function saveBookTag(data) {
  return request.post({ url: `${prefix}/tag/${data.id == null ? 'create' : 'update'}`, data });
}

/** 物理删除标签。 @author wuzm */
export function deleteBookTag(id) {
  return request.post({ url: `${prefix}/tag/delete/${id}` });
}

/** 归档标签并保留历史身份。 @author wuzm */
export function archiveBookTag(id) {
  return request.post({ url: `${prefix}/tag/archive/${id}` });
}

/** 恢复指定标签。 @author wuzm */
export function restoreBookTag(id) {
  return request.post({ url: `${prefix}/tag/restore/${id}` });
}

/** 相对目标移动标签：1 为之前，-1 为之后。 @author wuzm */
export function sortBookTag(data) {
  return request.post({ url: `${prefix}/tag/sort`, data });
}
