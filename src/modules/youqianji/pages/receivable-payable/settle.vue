<template>
  <t-card title="收款或还款" :bordered="false"
    ><t-form :data="form" label-width="110px" @submit="submit"
      ><t-form-item label="应收应付 ID"><t-input-number v-model="form.receivablePayableId" :min="1" /></t-form-item
      ><t-form-item label="资金账户 ID"><t-input-number v-model="form.accountId" :min="1" /></t-form-item
      ><t-form-item label="本金"><t-input v-model="form.principalAmount" /></t-form-item
      ><t-form-item label="利息"><t-input v-model="form.interestAmount" /></t-form-item
      ><t-form-item label="费用"><t-input v-model="form.feeAmount" /></t-form-item
      ><t-form-item><t-button theme="primary" type="submit" :loading="loading">确认结算</t-button></t-form-item></t-form
    ></t-card
  >
</template>
<script setup>
import { reactive, ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { youqianjiApi } from '@youqianji/api';
const loading = ref(false);
const form = reactive({
  receivablePayableId: undefined,
  accountId: undefined,
  principalAmount: '',
  interestAmount: '0',
  feeAmount: '0',
});
const submit = async () => {
  if (!form.receivablePayableId || !form.accountId || !form.principalAmount)
    return MessagePlugin.warning('请完整填写结算信息');
  loading.value = true;
  try {
    await youqianjiApi.postLoanSettlement({ ...form, occurredAt: new Date().toISOString().slice(0, 19) });
    MessagePlugin.success('结算已记账');
  } catch (error) {
    MessagePlugin.error(error.message || '结算失败');
  } finally {
    loading.value = false;
  }
};
</script>
