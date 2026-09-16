import { request } from '@framework/utils/request';

const prefix = '/youqianji/userconfig';

/** 获取当前登录用户的配置，未设置时 currency 可能为空或缺失。 */
export function getUserConfig() {
  return request.get({ url: `${prefix}/get` });
}

/** 仅提交展示币种；归属和审计字段由服务端维护，空值表示恢复默认。 */
export function saveUserConfig({ currency }) {
  return request.post({ url: `${prefix}/save`, data: { currency: currency || null } });
}
