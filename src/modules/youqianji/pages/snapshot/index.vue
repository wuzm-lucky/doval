<template>
  <div class="page">
    <t-card title="账户快照历史" :bordered="false">
      <template #actions><t-button theme="primary" @click="openDialog">录入快照</t-button></template>
      <t-form layout="inline" @submit="load">
        <t-form-item label="家庭 ID"><t-input v-model="familyId" @blur="loadResources" /></t-form-item>
        <t-form-item label="账户"><t-select v-model="accountId" :options="accountOptions" filterable clearable /></t-form-item>
        <t-form-item><t-button theme="primary" type="submit" :loading="loading">查询快照</t-button></t-form-item>
      </t-form>
      <t-table class="table" :data="rows" :loading="loading" :columns="columns" row-key="id" :pagination="false" />
      <t-alert theme="info" message="快照是版本化事实；更正会创建新版本，页面不提供直接编辑。" />
    </t-card>

    <t-dialog v-model:visible="visible" header="录入账户快照" width="780px" :confirm-loading="submitting" @confirm="post">
      <t-form :data="form" label-width="90px">
        <t-form-item label="账户" required><t-select v-model="form.accountId" :options="accountOptions" filterable /></t-form-item>
        <t-form-item label="生效时间" required><t-date-picker v-model="form.effectiveAt" enable-time-picker format="YYYY-MM-DD HH:mm:ss" /></t-form-item>
        <t-form-item label="说明"><t-input v-model="form.reason" maxlength="200" /></t-form-item>
      </t-form>
      <div v-for="(balance, balanceIndex) in form.balances" :key="balance.key" class="balance-card">
        <div class="balance-header">
          <span>余额项 {{ balanceIndex + 1 }}</span>
          <t-button v-if="form.balances.length > 1" variant="text" theme="danger" @click="removeBalance(balanceIndex)">删除余额项</t-button>
        </div>
        <t-form label-width="90px">
          <t-form-item label="币种" required><t-select v-model="balance.currency" :options="currencies" /></t-form-item>
          <t-form-item label="余额" required><t-input v-model="balance.amount" placeholder="例如 1234.56" /></t-form-item>
        </t-form>
        <div v-for="(ownership, ownershipIndex) in balance.ownerships" :key="ownership.key" class="ownership-row">
          <t-select v-model="ownership.subjectId" :options="subjectOptions" filterable placeholder="归属主体" />
          <t-input v-model="ownership.amount" placeholder="归属金额" />
          <t-input v-model="ownership.changeReason" placeholder="变动说明（可选）" />
          <t-button v-if="balance.ownerships.length > 1" variant="text" theme="danger" @click="removeOwnership(balance, ownershipIndex)">删除</t-button>
        </div>
        <t-button variant="dashed" @click="addOwnership(balance)">新增归属拆分</t-button>
      </div>
      <t-button variant="dashed" block @click="addBalance">新增币种余额</t-button>
    </t-dialog>
  </div>
</template>

<script setup>
import dayjs from 'dayjs';
import { computed, onMounted, reactive, ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { youqianjiApi } from '@youqianji/api';

const familyId = ref(localStorage.getItem('youqianji-family-id') || '');
const accountId = ref();
const accounts = ref([]);
const subjects = ref([]);
const rows = ref([]);
const loading = ref(false);
const resourceLoading = ref(false);
const visible = ref(false);
const submitting = ref(false);
const currencies = ['CNY', 'USD', 'HKD', 'JPY'].map((value) => ({ label: value, value }));
const accountOptions = computed(() => accounts.value.map((item) => ({ label: `${item.name}（${item.id}）`, value: item.id })));
const subjectOptions = computed(() => subjects.value.map((item) => ({ label: `${item.name}（${item.id}）`, value: item.id })));
const createOwnership = () => ({ key: crypto.randomUUID(), subjectId: undefined, amount: '', changeReason: '' });
const createBalance = () => ({ key: crypto.randomUUID(), currency: 'CNY', amount: '', ownerships: [createOwnership()] });
const form = reactive({ accountId: undefined, effectiveAt: dayjs().format('YYYY-MM-DD HH:mm:ss'), reason: '', balances: [createBalance()] });
const columns = [
  { colKey: 'effectiveAt', title: '生效时间' },
  { colKey: 'versionNo', title: '版本' },
  { colKey: 'source', title: '来源' },
  { colKey: 'status', title: '状态' },
  { colKey: 'reason', title: '原因' },
];

const loadResources = async () => {
  if (!familyId.value || resourceLoading.value) return;
  resourceLoading.value = true;
  try {
    const normalizedFamilyId = Number(familyId.value);
    [accounts.value, subjects.value] = await Promise.all([youqianjiApi.listAccounts(normalizedFamilyId), youqianjiApi.listSubjects(normalizedFamilyId)]);
    localStorage.setItem('youqianji-family-id', String(normalizedFamilyId));
  } catch (error) {
    MessagePlugin.error(error.message || '加载账户和主体失败');
  } finally {
    resourceLoading.value = false;
  }
};
const load = async () => {
  if (!accountId.value) return MessagePlugin.warning('请选择账户');
  loading.value = true;
  try {
    rows.value = await youqianjiApi.listSnapshots({ accountId: accountId.value, at: dayjs().format('YYYY-MM-DDTHH:mm:ss') });
  } catch (error) {
    MessagePlugin.error(error.message || '加载快照失败');
  } finally {
    loading.value = false;
  }
};
const openDialog = async () => {
  await loadResources();
  if (!accountOptions.value.length || !subjectOptions.value.length) return MessagePlugin.warning('请先填写家庭 ID，并确保存在可见账户和主体');
  form.accountId = accountId.value || accountOptions.value[0].value;
  visible.value = true;
};
const addBalance = () => form.balances.push(createBalance());
const removeBalance = (balanceIndex) => form.balances.splice(balanceIndex, 1);
const addOwnership = (balance) => balance.ownerships.push(createOwnership());
const removeOwnership = (balance, ownershipIndex) => balance.ownerships.splice(ownershipIndex, 1);
const validBalances = () => form.balances.every((balance) => balance.currency && balance.amount && balance.ownerships.length && balance.ownerships.every((ownership) => ownership.subjectId && ownership.amount));
const post = async () => {
  if (!form.accountId || !form.effectiveAt || !validBalances()) return MessagePlugin.warning('请完整填写每个币种余额及归属拆分');
  submitting.value = true;
  try {
    await youqianjiApi.postSnapshot({
      accountId: form.accountId,
      effectiveAt: dayjs(form.effectiveAt).format('YYYY-MM-DDTHH:mm:ss'),
      reason: form.reason || undefined,
      balances: form.balances.map(({ currency, amount, ownerships }) => ({
        currency,
        amount,
        ownerships: ownerships.map(({ subjectId, amount: ownershipAmount, changeReason }) => ({ subjectId, amount: ownershipAmount, changeReason: changeReason || undefined })),
      })),
    });
    MessagePlugin.success('快照已提交');
    visible.value = false;
    accountId.value = form.accountId;
    load();
  } catch (error) {
    MessagePlugin.error(error.message || '提交快照失败');
  } finally {
    submitting.value = false;
  }
};

onMounted(loadResources);
</script>

<style scoped lang="less">
.page { display: flex; flex-direction: column; gap: 16px; }
.table { margin: 16px 0; }
.balance-card { margin: 12px 0; padding: 16px; border: 1px solid var(--td-component-stroke); border-radius: var(--td-radius-medium); }
.balance-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-weight: 600; }
.ownership-row { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 8px; margin: 8px 0; }
</style>
