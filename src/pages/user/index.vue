<template>
  <div :class="[`${prefix}-main-wrapper`, 'user-center']">
    <section class="profile-summary">
      <div class="profile-avatar" aria-label="用户头像">
        王<span class="avatar-edit"><Edit1Icon size="14px" /></span>
      </div>
      <div class="profile-content">
        <div class="profile-name-row">
          <h1>{{ account.nickname }}</h1>
          <t-tag theme="primary" variant="light" size="small">超级管理员</t-tag>
          <t-tag theme="success" variant="light" size="small"><span class="tag-dot" />已实名</t-tag>
        </div>
        <div class="profile-meta">
          <span>@{{ account.username }}</span
          ><span>UID {{ account.uid }}</span
          ><span>注册于 {{ account.registerDate }}</span>
        </div>
      </div>
      <t-button class="profile-action" :theme="isEdit ? 'default' : 'primary'" @click="handlePrimaryAction">
        {{ isEdit ? '保存' : '编辑资料' }}
      </t-button>
    </section>

    <section class="user-panel">
      <t-tabs v-model="activeTab" class="user-tabs">
        <t-tab-panel value="basic" label="基本信息">
          <section class="panel-section">
            <div class="basic-grid">
              <div v-for="item in basicFields" :key="item.key" class="info-row">
                <span class="info-label">{{ item.label }}</span>
                <div class="info-value">
                  <t-input v-if="isEditable(item.key) && isEdit" v-model="form[item.key]" size="small" />
                  <t-tag v-else-if="item.key === 'status'" theme="success" variant="light" size="small"
                    ><span class="tag-dot" />正常</t-tag
                  >
                  <template v-else>{{ account[item.key] }}</template>
                </div>
              </div>
            </div>
          </section>
        </t-tab-panel>

        <t-tab-panel value="binding" label="账号绑定">
          <section class="panel-section">
            <div class="binding-list">
              <div v-for="binding in bindings" :key="binding.name" class="binding-item">
                <div class="binding-icon" :class="`binding-icon--${binding.type}`">{{ binding.icon }}</div>
                <div class="binding-content">
                  <h3>{{ binding.name }}</h3>
                  <p>{{ binding.description }}</p>
                </div>
                <div class="binding-actions">
                  <span v-if="binding.account" class="binding-account">{{ binding.account }}</span>
                  <t-tag :theme="binding.bound ? 'success' : 'primary'" variant="light" size="small">{{
                    binding.bound ? '已绑定' : '未绑定'
                  }}</t-tag>
                  <t-button
                    size="small"
                    :theme="binding.bound ? 'default' : 'primary'"
                    variant="outline"
                    @click="handleBinding(binding)"
                    >{{ binding.bound ? (binding.canChange ? '更换' : '解绑') : '立即绑定' }}</t-button
                  >
                </div>
              </div>
            </div>
          </section>
        </t-tab-panel>

        <t-tab-panel value="security" label="安全设置">
          <section class="panel-section">
            <div class="security-list">
              <button
                v-for="item in securityItems"
                :key="item.title"
                class="security-item"
                type="button"
                @click="handleSecurity(item)"
              >
                <span class="security-icon">{{ item.icon }}</span>
                <span class="security-content"
                  ><strong>{{ item.title }}</strong
                  ><small>{{ item.description }}</small></span
                >
                <span class="security-side"
                  ><t-tag v-if="item.status" :theme="item.statusTheme" variant="light" size="small">{{
                    item.status
                  }}</t-tag
                  ><ChevronRightIcon size="16px"
                /></span>
              </button>
            </div>
          </section>
        </t-tab-panel>
      </t-tabs>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { ChevronRightIcon, Edit1Icon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';

import { prefix } from '@/config/global';

const activeTab = ref('basic');
const isEdit = ref(false);

// 当前为静态演示数据，后续接入用户详情接口时只需替换此对象的数据来源。
const account = reactive({
  username: 'wangxm',
  uid: '10086',
  registerDate: '2023-04-19',
  nickname: '王晓明',
  uuid: '7f8a3c2e----a1a7',
  phone: '138****5678',
  gender: '男',
  ethnicity: '汉族',
  documentType: '居民身份证',
  status: '正常',
  email: 'wangxm@kaiyuan.cloud',
  birthday: '2000-01-01',
  registerSource: '后台开通',
  documentNumber: '1101012000********',
});
const form = reactive({ ...account });
const basicFields = computed(() => [
  { label: '用户名', key: 'username' },
  { label: '昵称', key: 'nickname' },
  { label: 'UUID', key: 'uuid' },
  { label: '状态', key: 'status' },
  { label: '手机号', key: 'phone' },
  { label: '邮箱', key: 'email' },
  { label: '性别', key: 'gender' },
  { label: '出生日期', key: 'birthday' },
  { label: '民族', key: 'ethnicity' },
  { label: '注册来源', key: 'registerSource' },
  { label: '证件类型', key: 'documentType' },
  { label: '证件号', key: 'documentNumber' },
]);
const bindings = [
  {
    name: '手机号',
    description: '用于登录、找回密码，接收验证码',
    account: '138****5678',
    bound: true,
    canChange: true,
    icon: '◉',
    type: 'phone',
  },
  {
    name: '电子邮箱',
    description: '用于登录、接收系统通知与安全告警',
    account: 'wangxm@kaiyuan.cloud',
    bound: true,
    canChange: true,
    icon: '✉',
    type: 'mail',
  },
  {
    name: '微信',
    description: '扫码快捷登录',
    account: '晓明很忙',
    bound: true,
    canChange: false,
    icon: '微',
    type: 'wechat',
  },
  { name: 'QQ', description: '网页登录授权登录', account: '', bound: false, canChange: false, icon: 'Q', type: 'qq' },
  {
    name: 'GitHub',
    description: '开发者账号',
    account: 'wuzm',
    bound: true,
    canChange: false,
    icon: 'G',
    type: 'github',
  },
];
const securityItems = [
  {
    title: '登录密码',
    description: '上次修改：2026-05-12（108 天前）',
    icon: '钥',
    status: '建议更换',
    statusTheme: 'warning',
  },
  { title: '登录设备', description: '3 台设备在线，可下线可疑设备', icon: '机' },
  {
    title: '两步验证',
    description: '登录时需要额外验证，大幅提升安全性',
    icon: '盾',
    status: '未开启',
    statusTheme: 'primary',
  },
];
const editableFields = new Set(['nickname', 'gender', 'ethnicity', 'birthday']);
const isEditable = (key) => editableFields.has(key);

const handlePrimaryAction = () => {
  if (!isEdit.value) {
    Object.assign(form, account);
    isEdit.value = true;
    return;
  }
  // 保存时仅回写允许编辑的字段，系统字段始终保持只读。
  editableFields.forEach((key) => {
    account[key] = form[key];
  });
  isEdit.value = false;
  MessagePlugin.success('资料保存成功');
};
const handleBinding = (binding) => {
  const action = binding.bound ? (binding.canChange ? '更换' : '解绑') : '绑定';
  MessagePlugin.info(`${action}${binding.name}功能待接入账号验证流程`);
};
const handleSecurity = (item) => MessagePlugin.info(`${item.title}功能待接入安全设置流程`);
</script>

<style scoped lang="less">
.user-center {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 0;
  background: #f4f7fb;
  box-sizing: border-box;
  overflow: hidden;
}
.profile-summary,
.user-panel {
  width: 100%;
  max-width: none;
  margin: 0;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}
.profile-summary {
  display: flex;
  align-items: center;
  flex: none;
  min-height: 116px;
  padding: 18px 22px;
  box-sizing: border-box;
}
.profile-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  flex: 0 0 80px;
  border-radius: 50%;
  background: #2475c4;
  color: #fff;
  font-size: 35px;
}
.avatar-edit {
  position: absolute;
  right: -2px;
  bottom: -1px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 23px;
  height: 23px;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  background: #fff;
  color: #6b7d91;
}
.profile-content {
  margin-left: 20px;
  min-width: 0;
}
.profile-name-row,
.profile-meta,
.binding-actions {
  display: flex;
  align-items: center;
}
.profile-name-row {
  gap: 10px;
}
.profile-name-row h1 {
  margin: 0;
  color: #172b4d;
  font-size: 21px;
  font-weight: 500;
}
.profile-meta {
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 10px;
  color: #53657b;
  font-size: 15px;
}
.profile-action {
  margin-left: auto;
}
.tag-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 4px;
  border-radius: 50%;
  background: currentColor;
}
.user-panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  margin-top: 16px;
  overflow: hidden;
}
:deep(.t-tabs) {
  display: flex;
  flex: 1;
  height: auto;
  min-height: 0;
  flex-direction: column;
}
:deep(.t-tabs__nav) {
  flex: none;
  padding: 0 20px;
}
:deep(.t-tabs__content) {
  flex: 1;
  height: auto;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}
:deep(.t-tab-panel) {
  height: 100%;
  overflow-y: auto;
}
.panel-section {
  min-height: 100%;
  padding: 23px 28px 28px;
  box-sizing: border-box;
}
.basic-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 72px;
}
.info-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  align-items: center;
  min-height: 52px;
}
.info-label {
  padding-left: 10px;
  color: #8292a8;
  font-size: 15px;
}
.info-value {
  color: #172b4d;
  font-size: 16px;
}
.info-value :deep(.t-input) {
  width: 100%;
}
.binding-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.binding-item {
  display: flex;
  align-items: center;
  min-height: 68px;
  padding: 0 8px;
}
.binding-icon,
.security-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #e8f2fd;
  color: #1769bd;
  font-size: 18px;
}
.binding-icon--mail,
.binding-icon--wechat {
  background: #eff7e6;
  color: #4a8b11;
}
.binding-icon--github {
  background: #2f3b52;
  color: #fff;
}
.binding-content {
  margin-left: 16px;
}
.binding-content h3 {
  margin: 0;
  color: #172b4d;
  font-size: 16px;
  font-weight: 500;
}
.binding-content p {
  margin: 6px 0 0;
  color: #8292a8;
  font-size: 14px;
}
.binding-actions {
  gap: 12px;
  margin-left: auto;
}
.binding-account {
  color: #53657b;
  font-size: 15px;
}
.security-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.security-item {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 68px;
  padding: 0 8px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.security-item:hover {
  border-radius: 6px;
  background: #f7f9fc;
}
.security-icon {
  border-radius: 8px;
}
.security-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: 16px;
}
.security-content strong {
  color: #172b4d;
  font-size: 16px;
  font-weight: 500;
}
.security-content small {
  color: #8292a8;
  font-size: 14px;
}
.security-side {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-left: auto;
  color: #8292a8;
}
@media (max-width: 768px) {
  .user-center {
    padding: 16px;
  }
  .profile-summary {
    align-items: flex-start;
  }
  .profile-content {
    margin-left: 12px;
  }
  .profile-name-row {
    flex-wrap: wrap;
  }
  .profile-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .basic-grid {
    grid-template-columns: 1fr;
    column-gap: 0;
  }
  .binding-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .binding-account {
    display: none;
  }
}
@media (max-width: 480px) {
  .basic-grid {
    grid-template-columns: 1fr;
  }
}
</style>
