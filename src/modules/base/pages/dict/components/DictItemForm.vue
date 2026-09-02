<template>
  <t-dialog
    v-model:visible="formVisible"
    :header="formData.id ? '编辑字典项' : '新增'"
    :footer="false"
    :width="680"
    destroy-on-close
  >
    <t-form :data="formData" :rules="rules" :label-width="100" @submit="handleSubmit">
      <t-form-item label="识别码" name="code"><t-input v-model="formData.code" :style="fieldStyle" /></t-form-item>
      <t-form-item label="名称" name="label"><t-input v-model="formData.label" :style="fieldStyle" /></t-form-item>
      <t-form-item label="常量值" name="value"><t-input v-model="formData.value" :style="fieldStyle" /></t-form-item>
      <t-form-item label="分组" name="group"><t-input v-model="formData.group" :style="fieldStyle" /></t-form-item>
      <t-form-item label="排序" name="sort"><t-input-number v-model="formData.sort" :style="fieldStyle" /></t-form-item>
      <t-form-item class="form-actions"
        ><t-space
          ><t-button theme="primary" type="submit">保存</t-button
          ><t-button theme="default" @click="formVisible = false">取消</t-button></t-space
        ></t-form-item
      >
    </t-form>
  </t-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
/** 字典项编辑表单。 */
const props = defineProps({ visible: { type: Boolean, default: false }, data: { type: Object, default: () => ({}) } });
const emit = defineEmits(['update:visible', 'submit']);
const rules = {
  code: [{ required: true, message: '请输入识别码', type: 'error' }],
  label: [{ required: true, message: '请输入名称', type: 'error' }],
  value: [{ required: true, message: '请输入常量值', type: 'error' }],
};
const fieldStyle = { width: '480px' };
const formVisible = ref(false);
const formData = ref({});
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
watch(formVisible, (visible) => emit('update:visible', visible));
watch(
  () => props.data,
  (data) => {
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
