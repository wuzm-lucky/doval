import { request } from '@framework/utils/request';

const prefix = '/youqianji/book';

/** 查询账簿全部类别，管理场景包含归档数据。 @author wuzm */
export function listBookCategory(data) {
  return request.post({ url: `${prefix}/category/list`, data });
}

/** 按主键新增或编辑类别，请求字段由页面白名单生成。 @author wuzm */
export function saveBookCategory(data) {
  return request.post({ url: `${prefix}/category/${data.id == null ? 'create' : 'update'}`, data });
}

/** 物理删除类别。 @author wuzm */
export function deleteBookCategory(id) {
  return request.post({ url: `${prefix}/category/delete/${id}` });
}

/** 归档类别，类别同时归档子树。 @author wuzm */
export function archiveBookCategory(id) {
  return request.post({ url: `${prefix}/category/archive/${id}` });
}

/** 恢复指定类别。 @author wuzm */
export function restoreBookCategory(id) {
  return request.post({ url: `${prefix}/category/restore/${id}` });
}

/** 移动类别：0 为目标子级，1 为之前，-1 为之后；targetId=0 移到根级。 @author wuzm */
export function moveBookCategory(data) {
  return request.post({ url: `${prefix}/category/move`, data });
}
