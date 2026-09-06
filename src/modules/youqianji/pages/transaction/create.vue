<template>
  <t-card title="账户划转" :bordered="false" class="page">
    <t-alert theme="info" message="提交后由后端创建正式流水；已记账事实不能在页面直接编辑或删除。" />
    <t-form ref="formRef" :data="form" :rules="rules" label-width="110px" @submit="submit">
      <t-form-item label="家庭 ID" name="familyId"><t-input v-model="form.familyId" /></t-form-item>
      <t-form-item label="划出账户" name="sourceAccountId"
        ><t-select v-model="form.sourceAccountId" :options="accountOptions" filterable :loading="accountsLoading" placeholder="输入家庭 ID 后加载"
      /></t-form-item>
      <t-form-item label="转入账户" name="targetAccountId"
        ><t-select v-model="form.targetAccountId" :options="accountOptions" filterable :loading="accountsLoading" placeholder="输入家庭 ID 后加载"
      /></t-form-item>
      <t-form-item label="币种" name="currency"
        ><t-select v-model="form.currency" :options="currencyOptions"
      /></t-form-item>
      <t-form-item label="金额" name="amount"
        ><t-input v-model="form.amount" placeholder="以原币精确金额填写"
      /></t-form-item>
      <t-form-item label="资金归属主体" name="subjectId"
        ><t-select
          v-model="form.subjectId"
          :options="subjectOptions"
          filterable
          :loading="subjectsLoading"
          placeholder="输入家庭 ID 后加载"
      /></t-form-item>
      <t-form-item label="发生时间" name="occurredAt"
        ><t-date-picker v-model="form.occurredAt" enable-time-picker
      /></t-form-item>
      <t-form-item label="备注"><t-textarea v-model="form.remark" :maxlength="500" /></t-form-item>
      <t-form-item
        ><t-space
          ><t-button theme="primary" type="submit" :loading="submitting">确认划转</t-button
          ><t-button variant="outline" @click="router.back()">返回</t-button></t-space
        ></t-form-item
      >
    </t-form>
  </t-card>
</template>
<script setup>
import dayjs from 'dayjs';
import { MessagePlugin } from 'tdesign-vue-next';
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { youqianjiApi } from '@youqianji/api';
const router = useRouter();
const formRef = ref();
const submitting = ref(false);
const subjectsLoading = ref(false);
const accountsLoading = ref(false);
const subjectOptions = ref([]);
const accountOptions = ref([]);
const currencyOptions = ['CNY', 'USD', 'HKD', 'JPY'].map((value) => ({ label: value, value }));
const form = reactive({
  familyId: localStorage.getItem('youqianji-family-id') || '',
  sourceAccountId: undefined,
  targetAccountId: undefined,
  currency: localStorage.getItem('youqianji-currency') || 'CNY',
  amount: '',
  subjectId: undefined,
  occurredAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  remark: '',
});
const rules = {
  familyId: [{ required: true, message: '请输入家庭 ID' }],
  sourceAccountId: [{ required: true, message: '请输入划出账户' }],
  targetAccountId: [{ required: true, message: '请输入转入账户' }],
  amount: [{ required: true, message: '请输入金额' }],
  subjectId: [{ required: true, message: '请输入资金归属主体' }],
  occurredAt: [{ required: true, message: '请选择发生时间' }],
};
const loadSubjects = async (familyId) => {
  if (!familyId) {
    subjectOptions.value = [];
    return;
  }
  subjectsLoading.value = true;
  try {
    subjectOptions.value = (await youqianjiApi.listSubjects(familyId)).map((item) => ({
      label: `${item.name}（${item.type}）`,
      value: item.id,
    }));
  } catch (error) {
    subjectOptions.value = [];
    MessagePlugin.error(error.message || '加载主体失败');
  } finally {
    subjectsLoading.value = false;
  }
};
const loadAccounts = async (familyId) => {
  if (!familyId) {
    accountOptions.value = [];
    return;
  }
  accountsLoading.value = true;
  try {
    accountOptions.value = (await youqianjiApi.listAccounts(familyId)).map((item) => ({
      label: `${item.name}（${item.mode}）`,
      value: item.id,
    }));
  } catch (error) {
    accountOptions.value = [];
    MessagePlugin.error(error.message || '加载账户失败');
  } finally {
    accountsLoading.value = false;
  }
};
watch(
  () => form.familyId,
  (familyId) => {
    loadSubjects(familyId);
    loadAccounts(familyId);
  },
  { immediate: true },
);
const submit = async ({ validateResult }) => {
  if (validateResult !== true) return;
  if (form.sourceAccountId === form.targetAccountId) return MessagePlugin.warning('划出与转入账户不能相同');
  submitting.value = true;
  try {
    await youqianjiApi.transfer({
      familyId: Number(form.familyId),
      sourceAccountId: form.sourceAccountId,
      targetAccountId: form.targetAccountId,
      currency: form.currency,
      amount: form.amount,
      occurredAt: form.occurredAt,
      remark: form.remark || undefined,
      ownerships: [{ subjectId: form.subjectId, amount: form.amount }],
    });
    localStorage.setItem('youqianji-family-id', form.familyId);
    MessagePlugin.success('划转已记账');
    router.push('/youqianji/transaction');
  } catch (error) {
    MessagePlugin.error(error.message || '划转失败');
  } finally {
    submitting.value = false;
  }
};
</script>
<style scoped lang="less">
.page {
  max-width: 760px;
}
.page :deep(.t-alert) {
  margin-bottom: 20px;
}
</style>
