<template>
  <t-card title="借入或借出" :bordered="false"
    ><t-alert theme="info" message="后端将原子创建应收应付、记账科目和正式流水。" /><t-form
      :data="form"
      label-width="120px"
      @submit="submit"
      ><t-form-item label="家庭 ID"><t-input v-model="form.familyId" /></t-form-item
      ><t-form-item label="方向"
        ><t-radio-group v-model="form.direction"
          ><t-radio value="RECEIVABLE">借出</t-radio><t-radio value="PAYABLE">借入</t-radio></t-radio-group
        ></t-form-item
      ><t-form-item label="对方主体 ID"><t-input-number v-model="form.subjectId" :min="1" /></t-form-item
      ><t-form-item label="账户 ID"><t-input-number v-model="form.accountId" :min="1" /></t-form-item
      ><t-form-item label="本金"><t-input v-model="form.principalAmount" /></t-form-item
      ><t-form-item><t-button theme="primary" type="submit" :loading="loading">确认记账</t-button></t-form-item></t-form
    ></t-card
  >
</template>
<script setup>
import { reactive, ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { youqianjiApi } from '@youqianji/api';
const loading = ref(false);
const form = reactive({
  familyId: localStorage.getItem('youqianji-family-id') || '',
  direction: 'RECEIVABLE',
  subjectId: undefined,
  accountId: undefined,
  principalAmount: '',
});
const submit = async () => {
  if (!form.familyId || !form.subjectId || !form.accountId || !form.principalAmount)
    return MessagePlugin.warning('请完整填写');
  loading.value = true;
  try {
    await youqianjiApi.createLoan({
      ...form,
      familyId: Number(form.familyId),
      currency: 'CNY',
      interestAmount: '0',
      feeAmount: '0',
      occurredAt: new Date().toISOString().slice(0, 19),
    });
    MessagePlugin.success('已记账');
  } catch (error) {
    MessagePlugin.error(error.message || '提交失败');
  } finally {
    loading.value = false;
  }
};
</script>
