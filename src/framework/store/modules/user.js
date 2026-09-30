import { defineStore } from 'pinia';

import { getCurrentProfile, updateCurrentProfile } from '@framework/api/auth';

const InitUserInfo = {
  name: '', // 用户名称，用于展示在页面右上角头像处
  username: '',
  nickname: '',
  avatar: '',
  roles: [], // 角色信息预留字段，当前不参与路由或菜单控制
};

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: { ...InitUserInfo },
    // 只持久化资料，加载标记刷新后仍为 false，首次导航重新获取最新资料。@author wuzm
    userInfoLoaded: false,
  }),
  getters: {
    roles: (state) => {
      return state.userInfo?.roles;
    },
  },
  actions: {
    async getUserInfo() {
      if (this.userInfoLoaded) {
        return;
      }

      const profile = await getCurrentProfile();
      this.setUserInfo(profile);
      this.userInfoLoaded = true;
    },
    /** 将后端资料模型转换为前端顶部展示模型。 */
    setUserInfo(profile) {
      this.userInfo = {
        ...profile,
        name: profile.nickname || profile.username || '',
        roles: [],
      };
      this.userInfoLoaded = true;
    },
    /** 保存当前用户允许编辑的资料，并同步 Store 内的展示信息。 */
    async updateProfile(profileDto) {
      const profile = await updateCurrentProfile(profileDto);
      this.setUserInfo(profile);
    },
    /**
     * 清空当前用户资料，由会话服务在退出或切换账号时调用。
     * @author wuzm
     */
    clearUserInfo() {
      this.userInfo = { ...InitUserInfo };
      this.userInfoLoaded = false;
    },
  },
  // 方便在浏览器查看用户资料；退出或切换账号时由 clearUserInfo 同步清空。@author wuzm
  persist: {
    key: 'doval.user',
    storage: sessionStorage,
    pick: ['userInfo'],
  },
});
