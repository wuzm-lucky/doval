import { defineStore } from 'pinia';

import { t } from '@/locales';

const InitUserInfo = {
  name: '', // 用户名，用于展示在页面右上角头像处
  roles: [], // 角色信息预留字段，当前不参与路由或菜单控制
};

export const useUserStore = defineStore('user', {
  state: () => ({
    token: 'main_token', // 默认token不走权限
    userInfo: { ...InitUserInfo },
  }),
  getters: {
    roles: (state) => {
      return state.userInfo?.roles;
    },
  },
  actions: {
    async login(userInfo) {
      const mockLogin = async (userInfo) => {
        // 登录请求流程
        console.log(`用户信息:`, userInfo);
        // const { account, password } = userInfo;
        // if (account !== 'td') {
        //   return {
        //     code: 401,
        //     message: t('pages.login.validation.accountNotFound'),
        //   };
        // }
        // if (['main_', 'dev_'].indexOf(password) === -1) {
        //   return {
        //     code: 401,
        //     message: t('pages.login.validation.passwordError'),
        //   };
        // }
        // const token = {
        //   main_: 'main_token',
        //   dev_: 'dev_token',
        // }[password];
        return {
          code: 200,
          message: t('pages.login.loginSuccess'),
          data: 'main_token',
        };
      };

      const res = await mockLogin(userInfo);
      if (res.code === 200) {
        this.token = res.data;
      } else {
        throw res;
      }
    },
    async getUserInfo() {
      const mockRemoteUserInfo = async (token) => {
        if (token === 'main_token') {
          return {
            name: 'Tencent',
            roles: ['all'], // 角色信息预留字段，当前不参与路由或菜单控制
          };
        }
        return {
          name: 'td_dev',
          roles: ['UserIndex', 'DashboardBase', 'login'], // 角色信息预留字段，当前不参与路由或菜单控制
        };
      };
      const res = await mockRemoteUserInfo(this.token);

      this.userInfo = res;
    },
    async logout() {
      this.token = '';
      this.userInfo = { ...InitUserInfo };
    },
  },
  persist: {
    key: 'user',
    pick: ['token'],
  },
});
