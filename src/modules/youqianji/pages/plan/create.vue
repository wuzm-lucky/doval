<template>
  <t-card title="创建收支计划" :bordered="false"
    ><t-form :data="form" label-width="110px" @submit="submit"
      ><t-form-item label="家庭 ID"><t-input v-model="form.familyId" /></t-form-item
      ><t-form-item label="类型"
        ><t-radio-group v-model="form.type"
          ><t-radio value="INCOME">收入</t-radio><t-radio value="EXPENSE">支出</t-radio></t-radio-group
        ></t-form-item
      ><t-form-item label="主体 ID"><t-input-number v-model="form.subjectId" :min="1" /></t-form-item
      ><t-form-item label="币种"><t-select v-model="form.currency" :options="currencies" /></t-form-item
      ><t-form-item label="计划金额"><t-input v-model="form.amount" /></t-form-item
      ><t-form-item label="周期"
        ><t-select
          v-model="form.recurrence"
          :options="[
            { label: '每月', value: 'MONTHLY' },
            { label: '每周', value: 'WEEKLY' },
          ]" /></t-form-item
      ><t-form-item label="开始日期"><t-date-picker v-model="form.startDate" /></t-form-item
      ><t-form-item><t-button theme="primary" type="submit" :loading="loading">创建计划</t-button></t-form-item></t-form
    ></t-card
  >
</template>
<script setup>
import { reactive, ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { youqianjiApi } from '@youqianji/api';
const loading = ref(false);
const currencies = ['CNY', 'USD', 'HKD', 'JPY'].map((value) => ({ label: value, value }));
const form = reactive({
  familyId: localStorage.getItem('youqianji-family-id') || '',
  type: 'EXPENSE',
  subjectId: undefined,
  currency: 'CNY',
  amount: '',
  recurrence: 'MONTHLY',
  startDate: '',
});
const submit = async () => {
  if (!form.familyId || !form.subjectId || !form.amount || !form.startDate)
    return MessagePlugin.warning('请完整填写计划');
  loading.value = true;
  try {
    await youqianjiApi.createPlanTemplate({ ...form, familyId: Number(form.familyId) });
    MessagePlugin.success('计划已创建');
  } catch (error) {
    MessagePlugin.error(error.message || '创建失败');
  } finally {
    loading.value = false;
  }
};
</script>
