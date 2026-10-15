import { request } from '@framework/utils/request';

const prefix = '/youqianji/account/platform';

/** 查询本人平台，searchKey 按名称前缀匹配。 @author wuzm */
export function listPlatform(data) {
  return request.post({ url: `${prefix}/list`, data });
}

/** 获取平台最新详情。 @author wuzm */
export function getPlatform(id) {
  return request.get({ url: `${prefix}/get/${id}` });
}

/** 根据主键分流新增和编辑，仅提交页面整理后的字段。 @author wuzm */
export function savePlatform(data) {
  return request.post({ url: `${prefix}/${data.id == null ? 'create' : 'update'}`, data });
}

/** 删除本人平台。 @author wuzm */
export function deletePlatform(id) {
  return request.post({ url: `${prefix}/delete/${id}` });
}

/** 相对目标平台移动，where 为 1 时在前，为 -1 时在后。 @author wuzm */
export function movePlatform(data) {
  return request.post({ url: `${prefix}/move`, data });
}
