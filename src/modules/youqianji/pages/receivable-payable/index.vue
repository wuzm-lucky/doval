<template>
  <t-card title="应收应付" :bordered="false"
    ><template #actions
      ><t-space
        ><t-button theme="primary" @click="router.push('/youqianji/receivable-payable/create')">新增借贷</t-button
        ><t-button variant="outline" @click="router.push('/youqianji/receivable-payable/settle')"
          >登记结算</t-button
        ></t-space
      ></template
    ><t-form layout="inline" @submit="load"
      ><t-form-item label="家庭 ID"><t-input v-model="familyId" /></t-form-item
      ><t-form-item><t-button theme="primary" type="submit" :loading="loading">查询</t-button></t-form-item></t-form
    ><t-table class="table" :data="rows" :loading="loading" :columns="columns" row-key="id" :pagination="false"
  /></t-card>
</template>
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { youqianjiApi } from '@youqianji/api';
const router = useRouter();
const familyId = ref(localStorage.getItem('youqianji-family-id') || '');
const rows = ref([]);
const loading = ref(false);
const columns = [
  { colKey: 'direction', title: '方向' },
  { colKey: 'currency', title: '币种' },
  { colKey: 'principalAmount', title: '本金' },
  { colKey: 'settledAmount', title: '已结算' },
  { colKey: 'dueAt', title: '到期时间' },
  { colKey: 'status', title: '状态' },
];
const load = async () => {
  if (!familyId.value) return;
  loading.value = true;
  try {
    rows.value = await youqianjiApi.listReceivablePayables(familyId.value);
  } finally {
    loading.value = false;
  }
};
</script>
<style scoped>
.table {
  margin-top: 16px;
}
</style>
