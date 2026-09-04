<template>
  <t-dialog
    v-model:visible="formVisible"
    :header="formData.id ? '编辑用户' : '新增用户'"
    :width="680"
    :footer="false"
    destroy-on-close
  >
    <template #body>
      <t-form :data="formData" :rules="rules" :label-width="100" @submit="handleSubmit">
        <t-form-item label="用户名" name="username"
          ><t-input v-model="formData.username" :style="fieldStyle"
        /></t-form-item>
        <t-form-item label="昵称" name="nickname"
          ><t-input v-model="formData.nickname" :style="fieldStyle"
        /></t-form-item>
        <t-form-item label="手机号" name="phone"><t-input v-model="formData.phone" :style="fieldStyle" /></t-form-item>
        <t-form-item label="邮箱" name="email"><t-input v-model="formData.email" :style="fieldStyle" /></t-form-item>
        <t-form-item label="性别" name="gender">
          <t-select v-model="formData.gender" clearable :style="fieldStyle"
            ><t-option label="男" :value="1" /><t-option label="女" :value="2"
          /></t-select>
        </t-form-item>
        <t-form-item label="状态" name="status">
          <t-select v-model="formData.status" :style="fieldStyle"
            ><t-option label="启用" :value="1" /><t-option label="停用" :value="0"
          /></t-select>
        </t-form-item>
        <t-form-item class="form-actions"
          ><t-button variant="outline" @click="closeForm">取消</t-button
          ><t-button theme="primary" type="submit">保存</t-button></t-form-item
        >
      </t-form>
    </template>
  </t-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';

/** 用户编辑弹窗。 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  data: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:visible', 'submit']);
const rules = { username: [{ required: true, message: '请输入用户名', type: 'error' }] };
const fieldStyle = { width: '480px' };
const formVisible = ref(false);
const formData = ref({});
const closeForm = () => {
  formVisible.value = false;
};
const handleSubmit = ({ validateResult }) => {
  if (validateResult === true) emit('submit', { ...formData.value });
};

watch(
  () => props.visible,
  (visible) => {
    formVisible.value = visible;
  },
  { immediate: true },
);
watch(formVisible, (visible) => {
  emit('update:visible', visible);
});
watch(
  () => props.data,
  (data) => {
    // 使用副本编辑，取消时不会修改列表中的原始记录。
    formData.value = { ...data };
  },
  { immediate: true, deep: true },
);
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
