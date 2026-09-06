<template>
  <t-card title="匹配计划实际流水" :bordered="false"
    ><t-alert theme="info" message="仅可匹配后端已记账流水，完成金额与状态由后端重算。" /><t-form
      :data="form"
      label-width="120px"
      @submit="submit"
      ><t-form-item label="计划实例 ID"><t-input-number v-model="form.instanceId" :min="1" /></t-form-item
      ><t-form-item label="流水 ID"><t-input-number v-model="form.transactionId" :min="1" /></t-form-item
      ><t-form-item label="匹配金额"><t-input v-model="form.amount" /></t-form-item
      ><t-form-item><t-button theme="primary" type="submit" :loading="loading">确认匹配</t-button></t-form-item></t-form
    ></t-card
  >
</template>
<script setup>
import { reactive, ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { youqianjiApi } from '@youqianji/api';
const loading = ref(false);
const form = reactive({ instanceId: undefined, transactionId: undefined, amount: '' });
const submit = async () => {
  if (!form.instanceId || !form.transactionId || !form.amount) return MessagePlugin.warning('请完整填写匹配信息');
  loading.value = true;
  try {
    await youqianjiApi.matchPlan(form.instanceId, { transactionId: form.transactionId, amount: form.amount });
    MessagePlugin.success('计划已匹配');
  } catch (error) {
    MessagePlugin.error(error.message || '匹配失败');
  } finally {
    loading.value = false;
  }
};
</script>
