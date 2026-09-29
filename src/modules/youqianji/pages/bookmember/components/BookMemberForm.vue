<template>
  <t-dialog
    v-model:visible="dialogVisible"
    :header="formData.id ? '编辑成员' : '新增成员'"
    :width="680"
    :footer="false"
    destroy-on-close
  >
    <t-form :data="formData" :rules="rules" :label-width="100" @submit="handleSubmit">
      <t-form-item label="成员名称" name="name">
        <t-input v-model="formData.name" :maxlength="100" :style="fieldStyle" placeholder="请输入成员名称" />
      </t-form-item>
      <t-form-item class="form-actions">
        <t-button variant="outline" @click="dialogVisible = false">取消</t-button>
        <t-button theme="primary" type="submit">保存</t-button>
      </t-form-item>
    </t-form>
  </t-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';

/** 账簿成员编辑弹窗，账簿主键由成员管理页面在新增时传入。 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  data: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:visible', 'submit']);
const rules = { name: [{ required: true, message: '请输入成员名称', type: 'error' }] };
const fieldStyle = { width: '480px' };
const dialogVisible = ref(false);
const formData = ref({});

watch(
  () => props.visible,
  (visible) => {
    dialogVisible.value = visible;
    if (visible) formData.value = { ...props.data };
  },
);
watch(dialogVisible, (visible) => emit('update:visible', visible));
const handleSubmit = ({ validateResult }) => {
  if (validateResult === true) emit('submit', { ...formData.value });
};
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
