<template>
  <t-card title="跨币种换汇" :bordered="false" class="page"
    ><t-alert theme="info" message="实际成交汇率由两端原币金额决定，后端负责将其写入正式流水并校验账户权限。" /><t-form
      :data="form"
      label-width="120px"
      @submit="submit"
      ><t-form-item label="家庭 ID"><t-input v-model="form.familyId" /></t-form-item
      ><t-form-item label="划出账户 ID"><t-input-number v-model="form.sourceAccountId" :min="1" /></t-form-item
      ><t-form-item label="转入账户 ID"><t-input-number v-model="form.targetAccountId" :min="1" /></t-form-item
      ><t-form-item label="划出币种"><t-select v-model="form.sourceCurrency" :options="currencies" /></t-form-item
      ><t-form-item label="划出金额"><t-input v-model="form.sourceAmount" /></t-form-item
      ><t-form-item label="到账币种"><t-select v-model="form.targetCurrency" :options="currencies" /></t-form-item
      ><t-form-item label="到账金额"><t-input v-model="form.targetAmount" /></t-form-item
      ><t-form-item label="归属主体 ID"><t-input-number v-model="form.subjectId" :min="1" /></t-form-item
      ><t-form-item
        ><t-button theme="primary" type="submit" :loading="submitting">确认换汇</t-button></t-form-item
      ></t-form
    ></t-card
  >
</template>
<script setup>
import { reactive, ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { useRouter } from 'vue-router';
import { youqianjiApi } from '@youqianji/api';
const router = useRouter();
const submitting = ref(false);
const currencies = ['CNY', 'USD', 'HKD', 'JPY'].map((value) => ({ label: value, value }));
const form = reactive({
  familyId: localStorage.getItem('youqianji-family-id') || '',
  sourceAccountId: undefined,
  targetAccountId: undefined,
  sourceCurrency: 'CNY',
  sourceAmount: '',
  targetCurrency: 'USD',
  targetAmount: '',
  subjectId: undefined,
});
const submit = async () => {
  if (
    !form.familyId ||
    !form.sourceAccountId ||
    !form.targetAccountId ||
    !form.sourceAmount ||
    !form.targetAmount ||
    !form.subjectId
  )
    return MessagePlugin.warning('请完整填写换汇信息');
  if (form.sourceCurrency === form.targetCurrency) return MessagePlugin.warning('换汇两端币种不能相同');
  submitting.value = true;
  try {
    await youqianjiApi.exchange({
      ...form,
      familyId: Number(form.familyId),
      occurredAt: new Date().toISOString().slice(0, 19),
      sourceOwnerships: [{ subjectId: form.subjectId, amount: form.sourceAmount }],
      targetOwnerships: [{ subjectId: form.subjectId, amount: form.targetAmount }],
    });
    MessagePlugin.success('换汇已记账');
    router.push('/youqianji/transaction');
  } catch (error) {
    MessagePlugin.error(error.message || '换汇失败');
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
