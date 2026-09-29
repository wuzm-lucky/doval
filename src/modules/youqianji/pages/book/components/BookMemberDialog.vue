<template>
  <t-drawer v-model:visible="drawerVisible" size="560px" :footer="false" :close-btn="true" destroy-on-close>
    <template #header>
      <t-button theme="primary" @click="openAddDialog">添加</t-button>
    </template>
    <t-loading :loading="loading" size="small">
      <t-table :data="members" :columns="columns" row-key="id" size="small">
        <template #op="{ row }">
          <t-space>
            <t-link theme="primary" @click="openEditDialog(row)">编辑</t-link>
            <t-popconfirm
              content="确定移除该账簿成员吗？"
              :popup-props="{ popperOptions: { strategy: 'fixed' } }"
              @confirm="removeMember(row)"
            >
              <t-link theme="danger">移除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
    </t-loading>
  </t-drawer>

  <t-dialog
    v-model:visible="formVisible"
    :header="formData.id ? '编辑成员' : '添加成员'"
    :width="680"
    :footer="false"
    destroy-on-close
  >
    <t-form :data="formData" :rules="rules" :label-width="100" @submit="handleSubmit">
      <t-form-item label="成员名称" name="name">
        <t-input v-model="formData.name" :maxlength="100" :style="fieldStyle" placeholder="请输入账簿内成员名称" />
      </t-form-item>
      <t-form-item class="form-actions">
        <t-button variant="outline" @click="formVisible = false">取消</t-button>
        <t-button theme="primary" type="submit">保存</t-button>
      </t-form-item>
    </t-form>
  </t-dialog>
</template>

<script setup>
import { MessagePlugin } from 'tdesign-vue-next';
import { ref, watch } from 'vue';

import { deleteBookMember, listBookMember, saveBookMember } from '@youqianji/api/book';

/** 账簿内部成员维护抽屉；成员不对应平台注册账户。 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  bookId: { type: [Number, String], default: undefined },
});
const emit = defineEmits(['update:visible']);
const columns = [
  { title: '成员名称', colKey: 'name', ellipsis: true },
  { title: '排序', colKey: 'sort', width: 100 },
  { title: '创建用户', colKey: 'createUser', width: 180, ellipsis: true },
  { title: '操作', colKey: 'op', fixed: 'right', width: 140 },
];
const rules = { name: [{ required: true, message: '请输入成员名称', type: 'error' }] };
const fieldStyle = { width: '480px' };
const drawerVisible = ref(false);
const formVisible = ref(false);
const loading = ref(false);
const members = ref([]);
const formData = ref({ id: undefined, name: '' });

/** 成员列表接口返回当前账簿的全部有效内部成员。 */
const loadMembers = async () => {
  if (!props.bookId) return;
  loading.value = true;
  try {
    members.value = await listBookMember({ bookId: props.bookId });
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '账簿成员加载失败');
  } finally {
    loading.value = false;
  }
};
const openAddDialog = () => {
  formData.value = { id: undefined, name: '' };
  formVisible.value = true;
};
const openEditDialog = (member) => {
  // 使用副本编辑，取消时不改变成员列表中的数据。
  formData.value = { id: member.id, name: member.name };
  formVisible.value = true;
};
const handleSubmit = async ({ validateResult }) => {
  if (validateResult !== true || loading.value) return;
  loading.value = true;
  try {
    await saveBookMember({ bookId: props.bookId, ...formData.value });
    formVisible.value = false;
    await loadMembers();
    MessagePlugin.success('账簿成员保存成功');
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '账簿成员保存失败，请重试');
  } finally {
    loading.value = false;
  }
};
const removeMember = async (member) => {
  loading.value = true;
  try {
    await deleteBookMember(member.id);
    await loadMembers();
    MessagePlugin.success('账簿成员已移除');
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '账簿成员移除失败，请重试');
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  (visible) => {
    drawerVisible.value = visible;
    if (visible) loadMembers();
  },
  { immediate: true },
);
watch(drawerVisible, (visible) => emit('update:visible', visible));
</script>

<style lang="less" scoped>
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
