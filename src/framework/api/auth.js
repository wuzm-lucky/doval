import { request } from '@framework/utils/request';

const Api = {
  Login: '/auth/login',
  RefreshToken: '/auth/token/refresh',
  Profile: '/auth/profile',
  Logout: '/auth/logout',
  SendMessageCode: '/auth/verification/message/send',
  VerifyMessageCode: '/auth/verification/message/verify',
};

const publicRequestOptions = { withToken: false, skipAuthRefresh: true };

/** 使用统一认证接口完成账号、手机号或邮箱登录。 */
export function loginByAuth(params) {
  return request.post({ url: Api.Login, params }, publicRequestOptions);
}

/** 使用一次性刷新凭据轮换双令牌。 */
export function refreshAuthToken(params) {
  return request.post({ url: Api.RefreshToken, params }, publicRequestOptions);
}

/** 获取当前登录用户资料。 */
export function getCurrentProfile() {
  return request.get({ url: Api.Profile });
}

/** 编辑当前登录用户允许维护的资料字段。 */
export function updateCurrentProfile(params) {
  return request.put({ url: Api.Profile, params });
}

/** 退出当前客户端登录会话。 */
export function logoutCurrentClient() {
  return request.post({ url: Api.Logout });
}

/** 发送手机号或邮箱消息验证码。 */
export function sendMessageVerificationCode(params) {
  return request.post({ url: Api.SendMessageCode, params }, publicRequestOptions);
}

/** 校验消息验证码并获取一次性验证凭据。 */
export function verifyMessageVerificationCode(params) {
  return request.post({ url: Api.VerifyMessageCode, params }, publicRequestOptions);
}
