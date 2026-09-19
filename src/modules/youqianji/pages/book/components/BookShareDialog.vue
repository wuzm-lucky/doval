<template>
  <t-drawer v-model:visible="drawerVisible" size="560px" :footer="false" :close-btn="true" destroy-on-close>
    <template #header>
      <t-button theme="primary" @click="openAddDialog">添加</t-button>
    </template>
    <t-loading :loading="loading" size="small">
      <t-table :data="shareUsers" :columns="columns" row-key="id" size="small">
        <template #account="{ row }">{{ row.nickname || row.username || '未命名用户' }}</template>
        <template #identity="{ row }">
          <t-tag :theme="row.creator ? 'primary' : 'default'" variant="light">{{
            row.creator ? '创建人' : '受邀账户'
          }}</t-tag>
        </template>
        <template #op="{ row }">
          <t-popconfirm
            v-if="!row.creator"
            content="取消邀请后，该账户将无法访问此账簿，确定继续吗？"
            :popup-props="{ popperOptions: { strategy: 'fixed' } }"
            @confirm="removeShare(row)"
          >
            <t-link theme="danger">取消邀请</t-link>
          </t-popconfirm>
        </template>
      </t-table>
    </t-loading>
  </t-drawer>

  <t-dialog v-model:visible="formVisible" header="添加邀请账户" :width="680" :footer="false" destroy-on-close>
    <t-form :data="formData" :rules="rules" :label-width="100" @submit="handleSubmit">
      <t-form-item label="邀请账户" name="userId">
        <t-select
          v-model="formData.userId"
          :options="userOptions"
          :loading="searchingUsers"
          :style="fieldStyle"
          clearable
          filterable
          placeholder="输入用户名、昵称或手机号搜索已注册用户"
          @search="searchUsers"
        />
      </t-form-item>
      <t-form-item label="说明">
        <span class="hint">受邀账户将获得该账簿访问入口，其显示状态、排序和默认账户独立维护。</span>
      </t-form-item>
      <t-form-item class="form-actions">
        <t-button variant="outline" :disabled="saving" @click="formVisible = false">取消</t-button>
        <t-button theme="primary" :loading="saving" type="submit">发送邀请</t-button>
      </t-form-item>
    </t-form>
  </t-dialog>
</template>

<script setup>
import { MessagePlugin } from 'tdesign-vue-next';
import { ref, watch } from 'vue';

import { list as listUsers } from '@base/api/user';
import { deleteBookShare, listBookShares, saveBookShare } from '@youqianji/api/book';

/** 已邀请账户维护抽屉；分享关系独立于账簿内部成员。 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  bookId: { type: [Number, String], default: undefined },
});
const emit = defineEmits(['update:visible', 'changed']);
const columns = [
  { title: '账户', colKey: 'account', ellipsis: true },
  { title: '身份', colKey: 'identity', width: 100 },
  { title: '手机号', colKey: 'phone', width: 180, ellipsis: true },
  { title: '操作', colKey: 'op', fixed: 'right', width: 110 },
];
const rules = { userId: [{ required: true, message: '请选择邀请账户', type: 'error' }] };
const fieldStyle = { width: '480px' };
const drawerVisible = ref(false);
const formVisible = ref(false);
const loading = ref(false);
const saving = ref(false);
const searchingUsers = ref(false);
const shareUsers = ref([]);
const userOptions = ref([]);
const formData = ref({ userId: undefined });

/** 加载当前账簿已邀请账户，抽屉每次打开均刷新。 */
const loadShareUsers = async () => {
  if (!props.bookId) return;
  loading.value = true;
  try {
    shareUsers.value = await listBookShares(props.bookId);
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '已邀请账户加载失败');
  } finally {
    loading.value = false;
  }
};
const openAddDialog = () => {
  formData.value = { userId: undefined };
  userOptions.value = [];
  formVisible.value = true;
};
/** 通过用户查询接口搜索可被邀请的已注册账户。 */
const searchUsers = async (searchKey) => {
  const keyword = String(searchKey || '').trim();
  if (!keyword) {
    userOptions.value = [];
    return;
  }
  searchingUsers.value = true;
  try {
    const users = await listUsers({ searchKey: keyword });
    userOptions.value = users.map((user) => ({
      value: user.id,
      label: `${user.nickname || user.username || '未命名用户'}（${user.phone || user.id}）`,
    }));
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '账户搜索失败，请重试');
  } finally {
    searchingUsers.value = false;
  }
};
const handleSubmit = async ({ validateResult }) => {
  if (validateResult !== true || saving.value) return;
  saving.value = true;
  try {
    await saveBookShare({ bookId: props.bookId, userId: formData.value.userId });
    formVisible.value = false;
    await loadShareUsers();
    emit('changed');
    MessagePlugin.success('账户邀请成功');
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '账户邀请失败，请重试');
  } finally {
    saving.value = false;
  }
};
const removeShare = async (shareUser) => {
  loading.value = true;
  try {
    await deleteBookShare({ bookId: props.bookId, userId: shareUser.id });
    await loadShareUsers();
    emit('changed');
    MessagePlugin.success('账户邀请已取消');
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '取消账户邀请失败，请重试');
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  (visible) => {
    drawerVisible.value = visible;
    if (visible) loadShareUsers();
  },
  { immediate: true },
);
watch(drawerVisible, (visible) => emit('update:visible', visible));
</script>

<style lang="less" scoped>
.hint {
  color: var(--td-text-color-placeholder);
  font: var(--td-font-body-small);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0;

  :deep(.t-form__controls) {
    display: flex;
    gap: var(--td-comp-margin-s);
  }
}
</style>
