<template>
  <t-card title="支出退款" :bordered="false" class="page"
    ><t-alert theme="info" message="退款必须关联已记账支出。后端会校验累计退款上限，并将金额抵减原支出分类。" /><t-form
      :data="form"
      label-width="120px"
      @submit="submit"
      ><t-form-item label="家庭 ID"><t-input v-model="form.familyId" /></t-form-item
      ><t-form-item label="原支出流水 ID"><t-input-number v-model="form.originalTransactionId" :min="1" /></t-form-item
      ><t-form-item label="到账账户 ID"><t-input-number v-model="form.targetAccountId" :min="1" /></t-form-item
      ><t-form-item label="退款金额"><t-input v-model="form.amount" /></t-form-item
      ><t-form-item label="资金归属主体 ID"><t-input-number v-model="form.subjectId" :min="1" /></t-form-item
      ><t-form-item
        ><t-button theme="primary" type="submit" :loading="submitting">确认退款</t-button></t-form-item
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
const form = reactive({
  familyId: localStorage.getItem('youqianji-family-id') || '',
  originalTransactionId: undefined,
  targetAccountId: undefined,
  amount: '',
  subjectId: undefined,
});
const submit = async () => {
  if (!form.familyId || !form.originalTransactionId || !form.targetAccountId || !form.amount)
    return MessagePlugin.warning('请完整填写退款信息');
  submitting.value = true;
  try {
    await youqianjiApi.refund({
      familyId: Number(form.familyId),
      originalTransactionId: form.originalTransactionId,
      targetAccountId: form.targetAccountId,
      amount: form.amount,
      occurredAt: new Date().toISOString().slice(0, 19),
      ownerships: form.subjectId ? [{ subjectId: form.subjectId, amount: form.amount }] : undefined,
    });
    MessagePlugin.success('退款已记账');
    router.push('/youqianji/transaction');
  } catch (error) {
    MessagePlugin.error(error.message || '退款失败');
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
