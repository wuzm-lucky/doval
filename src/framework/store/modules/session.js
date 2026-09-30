import { defineStore } from 'pinia';

const SESSION_KEY = 'doval.session';
const CLIENT_ID_KEY = 'doval.clientId';

/**
 * 使用 Pinia actions 组织浏览器存储；不创建令牌响应式副本，不启用持久化插件。
 * 认证信息直接写入开发者工具可查看的 Session Storage：doval.session。
 * @author wuzm
 */
export const useSessionStore = defineStore(
  'session',
  () => {
    /**
     * 获取站点内长期复用的浏览器标识；迁移旧 user 中的标识后移除旧认证持久化数据。
     * @author wuzm
     */
    function getClientId() {
      const storedClientId = localStorage.getItem(CLIENT_ID_KEY);
      let clientId = storedClientId;
      const legacyUser = localStorage.getItem('user');
      if (!clientId && legacyUser) {
        try {
          const legacy = JSON.parse(legacyUser);
          if (typeof legacy?.clientId === 'string' && legacy.clientId) clientId = legacy.clientId;
        } catch {
          // 旧数据损坏时只重新生成客户端标识，不恢复其中的令牌。
        }
      }
      if (!clientId) {
        clientId =
          globalThis.crypto.randomUUID?.() ||
          Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (value) =>
            value.toString(16).padStart(2, '0'),
          ).join('');
      }
      if (!storedClientId) localStorage.setItem(CLIENT_ID_KEY, clientId);
      if (legacyUser !== null) localStorage.removeItem('user');
      return clientId;
    }

    /**
     * 读取唯一会话来源；损坏或不完整的数据视为无会话，不创建内存副本。
     * @author wuzm
     */
    function readSession() {
      getClientId();
      const value = sessionStorage.getItem(SESSION_KEY);
      if (!value) return null;
      try {
        const session = JSON.parse(value);
        if (
          typeof session?.accessToken === 'string' &&
          session.accessToken &&
          typeof session.refreshToken === 'string' &&
          session.refreshToken &&
          Number.isFinite(session.accessTokenExpiresAt) &&
          Number.isFinite(session.refreshTokenExpiresAt)
        )
          return session;
      } catch {
        // JSON 损坏时清理当前会话，避免每次路由导航重复解析失败。
      }
      removeSession();
      return null;
    }

    /**
     * 将服务端剩余秒数换算为绝对毫秒时间，整项替换双令牌，避免刷新后混用新旧凭据。
     * @author wuzm
     */
    function saveSession(tokenVo) {
      const { accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn } = tokenVo || {};
      if (
        typeof accessToken !== 'string' ||
        !accessToken ||
        typeof refreshToken !== 'string' ||
        !refreshToken ||
        !Number.isFinite(accessTokenExpiresIn) ||
        accessTokenExpiresIn <= 0 ||
        !Number.isFinite(refreshTokenExpiresIn) ||
        refreshTokenExpiresIn <= 0
      ) {
        throw new Error('服务端返回的登录会话不完整');
      }
      const now = Date.now();
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          accessToken,
          refreshToken,
          accessTokenExpiresAt: now + accessTokenExpiresIn * 1000,
          refreshTokenExpiresAt: now + refreshTokenExpiresIn * 1000,
        }),
      );
    }

    /**
     * 仅清理当前标签页会话，保留长期客户端标识。
     * @author wuzm
     */
    function removeSession() {
      sessionStorage.removeItem(SESSION_KEY);
    }

    /**
     * 从 JWT 的 sub 提取刷新定位参数；不验签、不用其判定认证成功，保留字符串避免大整数精度丢失。
     * @author wuzm
     */
    function getSessionUserId(accessToken) {
      try {
        const payload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const bytes = Uint8Array.from(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')), (char) =>
          char.charCodeAt(0),
        );
        const { sub } = JSON.parse(new TextDecoder().decode(bytes));
        if (typeof sub === 'string' && /^\d+$/.test(sub)) return sub;
      } catch {
        // 无法读取定位参数时由会话服务转为重新登录，不将解析结果视为可信身份。
      }
      throw Object.assign(new Error('登录凭证无效，请重新登录'), { code: 'token_invalid' });
    }

    return { getClientId, readSession, saveSession, removeSession, getSessionUserId };
  },
  { persist: false },
);
