<template>
  <t-card title="收入与支出记账" :bordered="false" class="page">
    <t-alert theme="info" message="提交后会形成不可直接修改的正式流水；如需修正，请使用冲正或退款流程。" />
    <t-form :data="form" label-width="110px" @submit="submit">
      <t-form-item label="家庭 ID" required><t-input v-model="form.familyId" /></t-form-item>
      <t-form-item label="类型"><t-radio-group v-model="form.type"><t-radio value="INCOME">收入</t-radio><t-radio value="EXPENSE">支出</t-radio></t-radio-group></t-form-item>
      <t-form-item label="资金账户" required><t-select v-model="form.accountId" :options="accountOptions" filterable :loading="loadingResources" /></t-form-item>
      <t-form-item label="收支分类" required><t-select v-model="form.categoryId" :options="categoryOptions" filterable :loading="loadingResources" /></t-form-item>
      <t-form-item label="业务主体" required><t-select v-model="form.businessSubjectId" :options="subjectOptions" filterable :loading="loadingResources" /></t-form-item>
      <t-form-item label="币种"><t-select v-model="form.currency" :options="currencies" /></t-form-item>
      <t-form-item label="金额" required><t-input v-model="form.amount" placeholder="例如 1234.56" /></t-form-item>
      <t-form-item label="发生时间" required><t-date-picker v-model="form.occurredAt" enable-time-picker format="YYYY-MM-DD HH:mm:ss" /></t-form-item>
      <t-form-item label="备注"><t-textarea v-model="form.remark" :maxlength="500" /></t-form-item>
      <t-form-item><t-space><t-button theme="primary" type="submit" :loading="submitting">确认记账</t-button><t-button variant="outline" @click="router.back()">返回</t-button></t-space></t-form-item>
    </t-form>
  </t-card>
</template>

<script setup>
import dayjs from 'dayjs';
import { computed, reactive, ref, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { useRouter } from 'vue-router';
import { youqianjiApi } from '@youqianji/api';

const router = useRouter();
const loadingResources = ref(false);
const submitting = ref(false);
const accounts = ref([]);
const accountPostingSubjects = ref([]);
const categories = ref([]);
const subjects = ref([]);
const currencies = ['CNY', 'USD', 'HKD', 'JPY'].map((value) => ({ label: value, value }));
const form = reactive({ familyId: localStorage.getItem('youqianji-family-id') || '', type: 'EXPENSE', accountId: undefined, categoryId: undefined, businessSubjectId: undefined, currency: 'CNY', amount: '', occurredAt: dayjs().format('YYYY-MM-DD HH:mm:ss'), remark: '', sourceKey: crypto.randomUUID() });
const accountOptions = computed(() => accounts.value.map((item) => ({ label: `${item.name}（${item.mode}）`, value: item.id })));
const subjectOptions = computed(() => subjects.value.map((item) => ({ label: `${item.name}（${item.type}）`, value: item.id })));
const categoryOptions = computed(() => categories.value.filter((item) => item.type === form.type).map((item) => ({ label: item.name, value: item.id })));
const selectedCategory = computed(() => categories.value.find((item) => item.id === form.categoryId));
const selectedAccount = computed(() => accounts.value.find((item) => item.id === form.accountId));
const selectedAccountPostingSubject = computed(() => accountPostingSubjects.value.find((item) => item.accountId === form.accountId));

const loadResources = async (familyId) => {
  if (!familyId) return;
  loadingResources.value = true;
  try {
    const normalizedFamilyId = Number(familyId);
    [accounts.value, accountPostingSubjects.value, categories.value, subjects.value] = await Promise.all([youqianjiApi.listAccounts(normalizedFamilyId), youqianjiApi.listAccountPostingSubjects(normalizedFamilyId), youqianjiApi.listCategories(normalizedFamilyId), youqianjiApi.listSubjects(normalizedFamilyId)]);
    localStorage.setItem('youqianji-family-id', String(normalizedFamilyId));
  } catch (error) {
    MessagePlugin.error(error.message || '加载记账资源失败');
  } finally {
    loadingResources.value = false;
  }
};
const submit = async () => {
  if (!form.familyId || !selectedAccount.value || !selectedAccountPostingSubject.value || !selectedCategory.value || !form.businessSubjectId || !form.amount || !form.occurredAt) return MessagePlugin.warning('请完整填写记账信息');
  submitting.value = true;
  try {
    const amount = form.amount;
    const accountDirection = form.type === 'INCOME' ? 'DEBIT' : 'CREDIT';
    const categoryDirection = form.type === 'INCOME' ? 'CREDIT' : 'DEBIT';
    await youqianjiApi.postTransaction({
      familyId: Number(form.familyId), type: form.type, postingCurrency: form.currency, occurredAt: dayjs(form.occurredAt).format('YYYY-MM-DDTHH:mm:ss'), categoryId: selectedCategory.value.id, businessSubjectId: form.businessSubjectId, businessAllocationAmount: amount, sourceKey: form.sourceKey, remark: form.remark || undefined,
      entries: [
        { postingSubjectId: selectedAccountPostingSubject.value.postingSubjectId, direction: accountDirection, originalCurrency: form.currency, originalAmount: amount, postingAmount: amount },
        { postingSubjectId: selectedCategory.value.postingSubjectId, direction: categoryDirection, originalCurrency: form.currency, originalAmount: amount, postingAmount: amount },
      ],
    });
    MessagePlugin.success('已完成正式记账');
    router.push('/youqianji/transaction');
  } catch (error) {
    MessagePlugin.error(error.message || '记账失败');
  } finally {
    submitting.value = false;
  }
};
watch(() => form.familyId, loadResources, { immediate: true });
watch(() => form.type, () => { form.categoryId = undefined; });
</script>

<style scoped lang="less">
.page { max-width: 760px; }
.page :deep(.t-alert) { margin-bottom: 20px; }
</style>
