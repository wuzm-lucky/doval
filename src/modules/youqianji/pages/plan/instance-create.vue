<template>
  <t-card title="创建计划周期" :bordered="false"
    ><t-form :data="form" label-width="120px" @submit="submit"
      ><t-form-item label="计划模板 ID"><t-input-number v-model="form.templateId" :min="1" /></t-form-item
      ><t-form-item label="周期开始"><t-date-picker v-model="form.periodStart" /></t-form-item
      ><t-form-item label="周期结束"><t-date-picker v-model="form.periodEnd" /></t-form-item
      ><t-form-item label="截止时间"><t-date-picker v-model="form.dueAt" enable-time-picker /></t-form-item
      ><t-form-item><t-button theme="primary" type="submit" :loading="loading">创建周期</t-button></t-form-item></t-form
    ></t-card
  >
</template>
<script setup>
import { reactive, ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { youqianjiApi } from '@youqianji/api';
const loading = ref(false);
const form = reactive({ templateId: undefined, periodStart: '', periodEnd: '', dueAt: '' });
const submit = async () => {
  if (!form.templateId || !form.periodStart || !form.periodEnd) return MessagePlugin.warning('请完整填写周期');
  loading.value = true;
  try {
    await youqianjiApi.createPlanInstance({ ...form, dueAt: form.dueAt || undefined });
    MessagePlugin.success('计划周期已创建');
  } catch (error) {
    MessagePlugin.error(error.message || '创建失败');
  } finally {
    loading.value = false;
  }
};
</script>
