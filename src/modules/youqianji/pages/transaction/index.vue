<template>
  <div class="page">
    <t-card title="已记账流水" :bordered="false"
      ><template #actions
        ><t-space><t-button @click="router.push('/youqianji/transaction/post')">收入/支出</t-button><t-button theme="primary" @click="router.push('/youqianji/transaction/create')">账户划转</t-button></t-space></template
      ><t-form layout="inline" @submit="load"
        ><t-form-item label="家庭 ID"><t-input v-model="familyId" /></t-form-item
        ><t-form-item label="开始日期"><t-date-picker v-model="startDate" /></t-form-item
        ><t-form-item label="结束日期"><t-date-picker v-model="endDate" /></t-form-item
        ><t-form-item
          ><t-button theme="primary" type="submit" :loading="loading">查询流水</t-button></t-form-item
        ></t-form
      ><t-table class="table" :data="rows" :columns="columns" :loading="loading" row-key="id" :pagination="pagination" @page-change="onPageChange"
        ><template #operation="{ row }"
          ><t-link theme="primary" @click="router.push(`/youqianji/transaction/${row.id}`)">详情</t-link></template
        ></t-table
      ></t-card
    >
  </div>
</template>
<script setup>
import dayjs from 'dayjs';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { youqianjiApi } from '@youqianji/api';
const router = useRouter();
const familyId = ref(localStorage.getItem('youqianji-family-id') || '');
const startDate = ref(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
const endDate = ref(dayjs().format('YYYY-MM-DD'));
const rows = ref([]);
const loading = ref(false);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const columns = [
  { colKey: 'occurredAt', title: '发生时间' },
  { colKey: 'type', title: '类型' },
  { colKey: 'postingCurrency', title: '记账币种' },
  { colKey: 'status', title: '状态' },
  { colKey: 'remark', title: '备注' },
  { colKey: 'operation', title: '操作' },
];
const load = async (resetPage = false) => {
  if (!familyId.value) return MessagePlugin.warning('请先输入家庭 ID');
  if (resetPage) pagination.value = { ...pagination.value, current: 1 };
  loading.value = true;
  try {
    localStorage.setItem('youqianji-family-id', familyId.value);
    const result = await youqianjiApi.pageTransactions({
      familyId: familyId.value,
      startDate: startDate.value,
      endDate: endDate.value,
      page: pagination.value.current,
      size: pagination.value.pageSize,
    });
    rows.value = result.rows;
    pagination.value = { ...pagination.value, current: result.page, pageSize: result.size, total: result.total };
  } catch (error) {
    MessagePlugin.error(error.message || '加载流水失败');
  } finally {
    loading.value = false;
  }
};
const onPageChange = (pageInfo) => {
  pagination.value = { ...pagination.value, current: pageInfo.current, pageSize: pageInfo.pageSize };
  load();
};
</script>
<style scoped lang="less">
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.table {
  margin-top: 16px;
}
</style>
