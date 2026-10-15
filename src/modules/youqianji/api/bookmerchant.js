import { request } from '@framework/utils/request';

const prefix = '/youqianji/book';

/** 查询账簿全部商户，管理场景包含归档数据。 @author wuzm */
export function listBookMerchant(data) {
  return request.post({ url: `${prefix}/merchant/list`, data });
}

/** 按主键新增或编辑商户，请求字段由页面白名单生成。 @author wuzm */
export function saveBookMerchant(data) {
  return request.post({ url: `${prefix}/merchant/${data.id == null ? 'create' : 'update'}`, data });
}

/** 物理删除商户。 @author wuzm */
export function deleteBookMerchant(id) {
  return request.post({ url: `${prefix}/merchant/delete/${id}` });
}

/** 归档商户并保留历史身份。 @author wuzm */
export function archiveBookMerchant(id) {
  return request.post({ url: `${prefix}/merchant/archive/${id}` });
}

/** 恢复指定商户。 @author wuzm */
export function restoreBookMerchant(id) {
  return request.post({ url: `${prefix}/merchant/restore/${id}` });
}

/** 相对目标商户排序：where=1 为之前，-1 为之后。 @author wuzm */
export function moveBookMerchant(data) {
  return request.post({ url: `${prefix}/merchant/move`, data });
}
