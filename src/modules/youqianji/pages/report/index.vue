<template>
  <t-card title="家庭报表" :bordered="false">
    <t-form layout="inline" @submit="load">
      <t-form-item label="家庭 ID"><t-input v-model="familyId" placeholder="请输入家庭 ID" /></t-form-item>
      <t-form-item label="估值币种"
        ><t-select v-model="currency" :options="currencyOptions" style="width: 100px"
      /></t-form-item>
      <t-form-item label="开始日期"><t-date-picker v-model="startDate" value-type="YYYY-MM-DD" /></t-form-item>
      <t-form-item label="结束日期"><t-date-picker v-model="endDate" value-type="YYYY-MM-DD" /></t-form-item>
      <t-form-item><t-button theme="primary" type="submit" :loading="loading">查询</t-button></t-form-item>
    </t-form>
    <t-tabs v-model="tab" class="result">
      <t-tab-panel value="asset" label="资产">
        <t-descriptions v-if="asset" :column="3" bordered>
          <t-descriptions-item label="资产">{{ formatAmount(asset.assetValue) }}</t-descriptions-item>
          <t-descriptions-item label="负债">{{ formatAmount(asset.liabilityValue) }}</t-descriptions-item>
          <t-descriptions-item label="净资产">{{ formatAmount(asset.netAssetValue) }}</t-descriptions-item>
        </t-descriptions>
      </t-tab-panel>
      <t-tab-panel value="incomeExpense" label="收支">
        <t-descriptions v-if="incomeExpense" :column="3" bordered>
          <t-descriptions-item label="收入">{{ formatAmount(incomeExpense.income) }}</t-descriptions-item>
          <t-descriptions-item label="支出">{{ formatAmount(incomeExpense.expense) }}</t-descriptions-item>
          <t-descriptions-item label="净结余">{{ formatAmount(incomeExpense.net) }}</t-descriptions-item>
        </t-descriptions>
      </t-tab-panel>
      <t-tab-panel value="receivablePayable" label="应收应付">
        <t-descriptions v-if="receivablePayable" :column="2" bordered>
          <t-descriptions-item label="应收">{{ formatAmount(receivablePayable.receivable) }}</t-descriptions-item>
          <t-descriptions-item label="应付">{{ formatAmount(receivablePayable.payable) }}</t-descriptions-item>
        </t-descriptions>
      </t-tab-panel>
      <t-tab-panel value="ownership" label="资金归属">
        <t-table
          :data="ownership.items || []"
          :columns="ownershipColumns"
          :loading="loading"
          row-key="subjectId"
          :pagination="false"
        />
      </t-tab-panel>
      <t-tab-panel value="trend" label="资产趋势">
        <t-table :data="trend" :columns="trendColumns" :loading="loading" row-key="date" :pagination="false" />
      </t-tab-panel>
    </t-tabs>
  </t-card>
</template>

<script setup>
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';
import { youqianjiApi } from '@youqianji/api';

const formatDate = (date) => date.toISOString().slice(0, 10);
const today = new Date();
const periodStart = new Date();
periodStart.setDate(today.getDate() - 29);
const familyId = ref(localStorage.getItem('youqianji-family-id') || '');
const currency = ref(localStorage.getItem('youqianji-currency') || 'CNY');
const startDate = ref(formatDate(periodStart));
const endDate = ref(formatDate(today));
const tab = ref('asset');
const asset = ref();
const incomeExpense = ref();
const receivablePayable = ref();
const ownership = ref({ items: [] });
const trend = ref([]);
const loading = ref(false);
const currencyOptions = ['CNY', 'USD', 'HKD', 'JPY'].map((value) => ({ label: value, value }));
const ownershipColumns = [
  { colKey: 'subjectId', title: '主体 ID' },
  { colKey: 'currencyBalances', title: '原币余额', cell: ({ row }) => JSON.stringify(row.currencyBalances || {}) },
  { colKey: 'targetValue', title: '估值金额', cell: ({ row }) => formatAmount(row.targetValue) },
  { colKey: 'valuationQuality', title: '估值质量' },
];
const trendColumns = [
  { colKey: 'date', title: '日期' },
  { colKey: 'assetValue', title: '资产', cell: ({ row }) => formatAmount(row.assetValue) },
  { colKey: 'liabilityValue', title: '负债', cell: ({ row }) => formatAmount(row.liabilityValue) },
  { colKey: 'netAssetValue', title: '净资产', cell: ({ row }) => formatAmount(row.netAssetValue) },
  { colKey: 'valuationQuality', title: '估值质量' },
];
const formatAmount = (value) => currency.value + ' ' + (value ?? '0');
const load = async () => {
  if (!familyId.value) {
    MessagePlugin.warning('请先输入家庭 ID');
    return;
  }
  if (startDate.value > endDate.value) {
    MessagePlugin.warning('开始日期不能晚于结束日期');
    return;
  }
  loading.value = true;
  try {
    localStorage.setItem('youqianji-family-id', familyId.value);
    localStorage.setItem('youqianji-currency', currency.value);
    const reportAt = new Date().toISOString().slice(0, 19);
    const currencyParams = { familyId: familyId.value, targetCurrency: currency.value };
    [asset.value, incomeExpense.value, receivablePayable.value, ownership.value, trend.value] = await Promise.all([
      youqianjiApi.getAssetReport({ ...currencyParams, at: reportAt }),
      youqianjiApi.getIncomeExpenseReport({ ...currencyParams, startDate: startDate.value, endDate: endDate.value }),
      youqianjiApi.getReceivablePayableReport({ familyId: familyId.value }),
      youqianjiApi.getOwnershipReport({ ...currencyParams, at: reportAt }),
      youqianjiApi.listAssetTrend({ ...currencyParams, startDate: startDate.value, endDate: endDate.value }),
    ]);
  } catch (error) {
    MessagePlugin.error(error.message || '加载报表失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.result {
  margin-top: 16px;
}
</style>
