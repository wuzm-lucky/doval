<template>
  <div class="overview-page">
    <t-card title="有钱记资产概览" :bordered="false">
      <t-form layout="inline" @submit="loadData">
        <t-form-item label="家庭 ID"><t-input v-model="familyId" placeholder="请输入家庭 ID" /></t-form-item>
        <t-form-item label="估值币种"
          ><t-select v-model="currency" :options="currencyOptions" style="width: 110px"
        /></t-form-item>
        <t-form-item><t-button theme="primary" type="submit" :loading="loading">刷新数据</t-button></t-form-item>
      </t-form>
    </t-card>

    <t-row v-if="report" :gutter="[16, 16]" class="summary-row">
      <t-col :xs="12" :md="4"
        ><t-card title="资产"
          ><strong>{{ formatAmount(report.assetValue) }}</strong></t-card
        ></t-col
      >
      <t-col :xs="12" :md="4"
        ><t-card title="负债"
          ><strong>{{ formatAmount(report.liabilityValue) }}</strong></t-card
        ></t-col
      >
      <t-col :xs="12" :md="4"
        ><t-card title="净资产"
          ><strong>{{ formatAmount(report.netAssetValue) }}</strong></t-card
        ></t-col
      >
    </t-row>

    <t-card title="可见账户" :bordered="false" class="section-card">
      <t-table :data="accounts" :columns="accountColumns" row-key="id" :loading="loading" :pagination="false" />
    </t-card>
    <t-card title="估值质量说明" :bordered="false" class="section-card"
      ><t-alert theme="info" :message="qualityMessage"
    /></t-card>
  </div>
</template>

<script setup>
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref } from 'vue';
import { youqianjiApi } from '@youqianji/api';

const familyId = ref(localStorage.getItem('youqianji-family-id') || '');
const currency = ref(localStorage.getItem('youqianji-currency') || 'CNY');
const report = ref();
const accounts = ref([]);
const loading = ref(false);
const currencyOptions = ['CNY', 'USD', 'HKD', 'JPY'].map((value) => ({ label: value, value }));
const accountColumns = [
  { colKey: 'name', title: '账户' },
  { colKey: 'nature', title: '性质' },
  { colKey: 'mode', title: '模式' },
  { colKey: 'visibilityScope', title: '可见性' },
  { colKey: 'status', title: '状态' },
];
const qualityMessage = computed(() =>
  report.value?.accounts?.some((item) => item.valuationQuality === 'HISTORICAL_FALLBACK')
    ? '部分账户使用了查询时点之前最近可用的历史汇率。'
    : '当前估值使用精确或人工维护的汇率。',
);
const formatAmount = (value) => `${currency.value} ${value ?? '0'}`;
const loadData = async () => {
  if (!familyId.value) {
    MessagePlugin.warning('请先输入家庭 ID');
    return;
  }
  loading.value = true;
  try {
    localStorage.setItem('youqianji-family-id', familyId.value);
    localStorage.setItem('youqianji-currency', currency.value);
    const at = new Date().toISOString().slice(0, 19);
    [report.value, accounts.value] = await Promise.all([
      youqianjiApi.getAssetReport({ familyId: familyId.value, targetCurrency: currency.value, at }),
      youqianjiApi.listAccounts(familyId.value),
    ]);
  } catch (error) {
    MessagePlugin.error(error.message || '加载有钱记数据失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="less">
.overview-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.summary-row strong {
  font-size: 26px;
  color: var(--td-text-color-primary);
}
.section-card {
  margin-top: 0;
}
</style>
