import { defineStore } from 'pinia';

import {
  getCurrentProfile,
  loginByAuth,
  logoutCurrentClient,
  refreshAuthToken,
  updateCurrentProfile,
} from '@/api/auth';

const InitUserInfo = {
  name: '', // 用户名称，用于展示在页面右上角头像处
  username: '',
  nickname: '',
  avatar: '',
  roles: [], // 角色信息预留字段，当前不参与路由或菜单控制
};

/** 生成并长期保存浏览器逻辑客户端标识。 */
function createClientId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useUserStore = defineStore('user', {
  state: () => ({
    accessToken: '',
    refreshToken: '',
    clientRecordId: null,
    accessTokenExpiresIn: null,
    refreshTokenExpiresIn: null,
    clientId: createClientId(),
    userInfo: { ...InitUserInfo },
  }),
  getters: {
    roles: (state) => {
      return state.userInfo?.roles;
    },
  },
  actions: {
    /**
     * 原子保存后端签发的登录会话信息。
     *
     * @param tokenVo 后端 LoginTokenVo 响应
     */
    saveSession(tokenVo) {
      this.accessToken = tokenVo.accessToken;
      this.refreshToken = tokenVo.refreshToken;
      this.clientRecordId = tokenVo.clientRecordId;
      this.accessTokenExpiresIn = tokenVo.accessTokenExpiresIn;
      this.refreshTokenExpiresIn = tokenVo.refreshTokenExpiresIn;
    },
    /** 使用统一认证接口登录，并初始化当前用户资料。 */
    async login(loginDto) {
      const tokenVo = await loginByAuth(loginDto);
      this.saveSession(tokenVo);
      await this.getUserInfo();
    },
    /** 使用 Refresh Token 刷新会话；刷新凭据为一次性凭据。 */
    async refreshSession() {
      if (!this.clientRecordId || !this.refreshToken) {
        throw new Error('登录已过期');
      }
      const tokenVo = await refreshAuthToken({ clientRecordId: this.clientRecordId, refreshToken: this.refreshToken });
      this.saveSession(tokenVo);
    },
    async getUserInfo() {
      const profile = await getCurrentProfile();
      this.setUserInfo(profile);
    },
    /** 将后端资料模型转换为前端顶部展示模型。 */
    setUserInfo(profile) {
      this.userInfo = {
        ...profile,
        name: profile.nickname || profile.username || '',
        roles: [],
      };
    },
    /** 保存当前用户允许编辑的资料，并同步 Store 内的展示信息。 */
    async updateProfile(profileDto) {
      const profile = await updateCurrentProfile(profileDto);
      this.setUserInfo(profile);
    },
    /** 清理浏览器会话，但保留稳定的客户端标识供下次登录复用。 */
    clearSession() {
      this.accessToken = '';
      this.refreshToken = '';
      this.clientRecordId = null;
      this.accessTokenExpiresIn = null;
      this.refreshTokenExpiresIn = null;
      this.userInfo = { ...InitUserInfo };
    },
    /** 主动退出时通知服务端立即失效当前客户端会话。 */
    async logout() {
      try {
        if (this.accessToken) {
          await logoutCurrentClient();
        }
      } finally {
        this.clearSession();
      }
    },
  },
  persist: {
    key: 'user',
    pick: [
      'accessToken',
      'refreshToken',
      'clientRecordId',
      'accessTokenExpiresIn',
      'refreshTokenExpiresIn',
      'clientId',
    ],
  },
});
