import {
  loginByAuth,
  loginByCode as requestCodeLogin,
  logoutCurrentClient,
  refreshAuthToken,
} from '@framework/api/auth';
import { getMenuStore, store, useUserStore } from '@framework/store';
import { useSessionStore } from '@framework/store/modules/session';

let refreshPromise = null;

/**
 * 识别服务端明确的认证失效，网络异常、权限不足和普通业务错误不应清理会话。
 * @author wuzm
 */
export function isSessionInvalid(error) {
  const code = error?.code || error?.response?.data?.code;
  return (
    error?.response?.status === 401 ||
    [
      'unauthenticated',
      'token_invalid',
      'token_expired',
      'refresh_token_invalid',
      'refresh_token_expired',
      'client_disabled',
      'account_disabled',
    ].includes(code)
  );
}

/**
 * 清理当前会话和对应用户、菜单缓存，不删除客户端标识。
 * @author wuzm
 */
export function clearSession() {
  useSessionStore(store).removeSession();
  useUserStore(store).clearUserInfo();
  getMenuStore().resetMenuList();
}

/**
 * 完成密码登录后初始化用户上下文，令牌仅写入 Session Storage。
 * @author wuzm
 */
export async function login(loginDto) {
  await initializeLogin(await loginByAuth(loginDto));
}

/**
 * 验证码登录使用独立接口，共用会话初始化流程。
 * @author wuzm
 */
export async function loginByCode(loginDto) {
  await initializeLogin(await requestCodeLogin(loginDto));
}

/**
 * 更新凭据后清理上一用户缓存，再加载当前资料；资料网络故障不丢弃已签发的凭据。
 * @author wuzm
 */
async function initializeLogin(tokenVo) {
  useSessionStore(store).saveSession(tokenVo);
  useUserStore(store).clearUserInfo();
  getMenuStore().resetMenuList();
  await useUserStore(store).getUserInfo();
}

/**
 * 同一标签页的并发请求共享一次刷新；旧请求不能覆盖退出或重新登录后的会话。
 * @author wuzm
 */
export function refreshSession() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = rotateSession().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

/**
 * 按 RefreshTokenDto 提交用户主键、客户端标识和一次性刷新凭据，仅明确失效时清理原会话。
 * @author wuzm
 */
async function rotateSession() {
  const session = useSessionStore(store).readSession();
  try {
    if (!session || session.refreshTokenExpiresAt <= Date.now()) {
      throw Object.assign(new Error('登录已过期，请重新登录'), { code: 'refresh_token_expired' });
    }
    const tokenVo = await refreshAuthToken({
      userId: useSessionStore(store).getSessionUserId(session.accessToken),
      clientId: useSessionStore(store).getClientId(),
      refreshToken: session.refreshToken,
    });
    if (useSessionStore(store).readSession()?.refreshToken !== session.refreshToken)
      throw new Error('会话已变更，请重试');
    useSessionStore(store).saveSession(tokenVo);
  } catch (error) {
    if (isSessionInvalid(error) && useSessionStore(store).readSession()?.refreshToken === session?.refreshToken)
      clearSession();
    throw error;
  }
}

/**
 * 有效访问令牌直接复用；只有本地已过期才刷新，刷新页面不会无条件轮换令牌。
 * @author wuzm
 */
export async function ensureAccessToken() {
  const session = useSessionStore(store).readSession();
  if (!session || session.accessTokenExpiresAt <= Date.now()) await refreshSession();
  return useSessionStore(store).readSession()?.accessToken;
}

/**
 * 退出接口要求有效 Bearer 凭据，必要时先刷新；无论请求结果如何都清理当前标签页。
 * @author wuzm
 */
export async function logout() {
  try {
    if (useSessionStore(store).readSession()) await logoutCurrentClient();
  } finally {
    clearSession();
  }
}
