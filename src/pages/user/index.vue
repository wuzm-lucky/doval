<template>
  <div :class="[`${prefix}-main-wrapper`, 'user-center']">
    <section class="profile-summary">
      <div class="profile-avatar" aria-label="用户头像">
        <img v-if="hasAvatar" :src="avatarPreview" :alt="displayName" @error="avatarFailed = true" />
        <span v-else>{{ avatarText }}</span>
        <t-upload
          v-if="isEdit"
          v-model="avatarFiles"
          class="avatar-upload"
          theme="custom"
          accept="image/*"
          :size-limit="{ size: 2, unit: 'MB', message: '图片大小不超过 {sizeLimit} MB' }"
          :request-method="uploadAvatar"
          :show-image-file-name="false"
        >
          <button class="avatar-edit" type="button" title="上传头像"><Edit1Icon size="14px" /></button>
        </t-upload>
      </div>
      <div class="profile-content">
        <div class="profile-name-row">
          <h1>{{ displayName }}</h1>
        </div>
        <div class="profile-meta">
          <span v-if="profile.username">{{ profile.username }}</span
          ><span>UID {{ profile.id || '-' }}</span>
        </div>
      </div>
      <div v-if="isEdit" class="profile-actions">
        <t-button theme="default" @click="cancelEdit">取消</t-button>
        <t-button :loading="saving" theme="primary" @click="saveProfile">保存</t-button>
      </div>
      <t-button v-else class="profile-action" theme="primary" @click="startEdit">编辑资料</t-button>
    </section>

    <section class="user-panel">
      <t-tabs v-model="activeTab" class="user-tabs">
        <t-tab-panel value="basic" label="基本信息">
          <section class="panel-section">
            <div class="basic-grid">
              <div v-for="item in basicFields" :key="item.key" class="info-row">
                <span class="info-label">{{ item.label }}</span>
                <div class="info-value">
                  <t-input v-if="isEdit && item.key === 'username'" v-model="form.username" size="small" />
                  <t-input v-else-if="isEdit && item.key === 'nickname'" v-model="form.nickname" size="small" />
                  <t-select
                    v-else-if="isEdit && item.key === 'gender'"
                    v-model="form.gender"
                    size="small"
                    :options="genderOptions"
                  />
                  <t-input
                    v-else-if="isEdit && item.key === 'nation'"
                    v-model="form.nation"
                    size="small"
                    type="number"
                  />
                  <t-date-picker
                    v-else-if="isEdit && item.key === 'birthday'"
                    v-model="form.birthday"
                    size="small"
                    format="YYYY-MM-DD"
                    value-type="YYYY-MM-DD"
                  />
                  <template v-else-if="item.key === 'gender'">{{ genderText }}</template>
                  <template v-else>{{ profile[item.key] || '-' }}</template>
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
                  >
                    {{ binding.bound ? '更换' : '立即绑定' }}
                  </t-button>
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
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ChevronRightIcon, Edit1Icon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';

import { prefix } from '@/config/global';
import { downloadUrl, uploadFile } from '@/api/file';
import { useUserStore } from '@/store';

const activeTab = ref('basic');
const userStore = useUserStore();
const profile = computed(() => userStore.userInfo);
const isEdit = ref(false);
const saving = ref(false);
const avatarFailed = ref(false);
const avatarFiles = ref([]);
const form = reactive({ username: '', nickname: '', avatar: '', gender: null, nation: null, birthday: '' });
const displayName = computed(() => profile.value.nickname || profile.value.username || '未命名用户');
const avatarText = computed(() =>
  (profile.value.nickname || profile.value.username || '用').trim().slice(0, 1).toUpperCase(),
);
const avatarPreview = computed(() => {
  const uploadedAvatar = avatarFiles.value[0]?.url || avatarFiles.value[0]?.thumb;
  if (uploadedAvatar) {
    return uploadedAvatar;
  }
  const avatar = profile.value.avatar?.trim();
  if (!avatar) {
    return '';
  }
  return /^https?:\/\//i.test(avatar) ? avatar : downloadUrl(avatar, 'avatar.png');
});
const hasAvatar = computed(() => Boolean(avatarPreview.value) && !avatarFailed.value);
const genderText = computed(() => ({ 0: '未知', 1: '男', 2: '女' })[profile.value.gender] || '-');
const genderOptions = [
  { label: '男', value: 1 },
  { label: '女', value: 2 },
];
const basicFields = computed(() => [
  { label: '姓名', key: 'username' },
  { label: '昵称', key: 'nickname' },
  { label: '手机号', key: 'phone' },
  { label: '邮箱', key: 'email' },
  { label: '性别', key: 'gender' },
  { label: '出生日期', key: 'birthday' },
  { label: '民族', key: 'nation' },
]);
const bindings = computed(() => [
  {
    name: '手机号',
    description: '用于登录、找回密码和接收验证码',
    account: profile.value.phone || '',
    bound: Boolean(profile.value.phone),
    icon: '◉',
    type: 'phone',
  },
  {
    name: '电子邮箱',
    description: '用于登录、接收系统通知与安全告警',
    account: profile.value.email || '',
    bound: Boolean(profile.value.email),
    icon: '✉',
    type: 'mail',
  },
  { name: '微信', description: '第三方账号绑定功能待接入', account: '', bound: false, icon: '微', type: 'wechat' },
  { name: 'QQ', description: '第三方账号绑定功能待接入', account: '', bound: false, icon: 'Q', type: 'qq' },
  { name: 'GitHub', description: '第三方账号绑定功能待接入', account: '', bound: false, icon: 'G', type: 'github' },
]);
const securityItems = [
  { title: '登录密码', description: '密码修改功能待接入', icon: '钥' },
  { title: '登录设备', description: '登录设备管理功能待接入', icon: '机' },
  { title: '两步验证', description: '两步验证功能待接入', icon: '盾', status: '未开启', statusTheme: 'primary' },
];
watch(
  () => profile.value.avatar,
  () => {
    avatarFailed.value = false;
    avatarFiles.value = [];
  },
);
const startEdit = () => {
  Object.assign(form, {
    username: profile.value.username || '',
    nickname: profile.value.nickname || '',
    avatar: profile.value.avatar || '',
    gender: profile.value.gender || null,
    nation: profile.value.nation || null,
    birthday: profile.value.birthday || '',
  });
  isEdit.value = true;
};
const cancelEdit = () => {
  if (form.avatar !== (profile.value.avatar || '')) {
    avatarFiles.value = [];
  }
  isEdit.value = false;
};
const saveProfile = async () => {
  saving.value = true;
  try {
    await userStore.updateProfile({
      username: form.username.trim(),
      nickname: form.nickname.trim(),
      avatar: form.avatar,
      gender: form.gender || null,
      nation: form.nation === '' || form.nation === null ? null : Number(form.nation),
      birthday: form.birthday || null,
    });
    isEdit.value = false;
    MessagePlugin.success('资料保存成功');
  } catch (error) {
    MessagePlugin.error(error instanceof Error ? error.message : String(error));
  } finally {
    saving.value = false;
  }
};
const uploadAvatar = async (file) => {
  if (!file.raw?.type?.startsWith('image/')) {
    MessagePlugin.warning('只能上传图片文件');
    return { status: 'fail' };
  }
  try {
    const uploadedFile = await uploadFile(file.raw, file.name);
    const avatarUrl = downloadUrl(uploadedFile.uuid, uploadedFile.name || file.name);
    form.avatar = uploadedFile.uuid;
    avatarFiles.value = [{ name: uploadedFile.name || file.name, url: avatarUrl, status: 'success' }];
    avatarFailed.value = false;
    MessagePlugin.success('头像上传成功，点击保存后生效');
    return { status: 'success', response: { url: avatarUrl } };
  } catch (error) {
    MessagePlugin.error('头像上传失败，请重试');
    throw error;
  }
};
const handleBinding = (binding) => MessagePlugin.info(`${binding.name}绑定功能待接入账号验证流程`);
const handleSecurity = (item) => MessagePlugin.info(`${item.title}功能待接入安全设置流程`);
onMounted(async () => {
  if (userStore.accessToken && !profile.value.id) {
    await userStore.getUserInfo();
  }
});
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
.profile-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
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
  padding: 0;
}
.avatar-edit:hover {
  color: #1769bd;
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
.profile-actions {
  display: flex;
  gap: 12px;
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
