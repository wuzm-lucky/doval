import { request } from '@framework/utils/request';

const Api = {
  GetDetailByCode: '/base/dict/get/detail/code/',
};

/**
 * 根据全局唯一编码获取字典详情及字典项，保留编码大小写并转义路径参数。
 * @param {string} code 字典编码
 * @author wuzm
 */
export function getDetailByCode(code) {
  return request.get({ url: `${Api.GetDetailByCode}${encodeURIComponent(code)}` });
}
