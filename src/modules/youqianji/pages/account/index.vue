<template>
  <div class="page">
    <t-card title="账户列表" :bordered="false"
      ><t-form layout="inline" @submit="load"
        ><t-form-item label="家庭 ID"><t-input v-model="familyId" /></t-form-item
        ><t-form-item
          ><t-button theme="primary" type="submit" :loading="loading">查询账户</t-button></t-form-item
        ></t-form
      ><t-table class="table" :data="rows" :columns="columns" :loading="loading" row-key="id" :pagination="false"
        ><template #mode="{ row }"
          ><t-tag :theme="row.mode === 'SNAPSHOT' ? 'warning' : 'primary'">{{ row.mode }}</t-tag></template
        ><template #nature="{ row }"
          ><t-tag :theme="row.nature === 'ASSET' ? 'success' : 'danger'">{{ row.nature }}</t-tag></template
        ></t-table
      ></t-card
    >
  </div>
</template>
<script setup>
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';
import { youqianjiApi } from '@youqianji/api';
const familyId = ref(localStorage.getItem('youqianji-family-id') || '');
const rows = ref([]);
const loading = ref(false);
const columns = [
  { colKey: 'name', title: '账户' },
  { colKey: 'nature', title: '性质' },
  { colKey: 'mode', title: '模式' },
  { colKey: 'visibilityScope', title: '可见性' },
  { colKey: 'familyReportPolicy', title: '报表策略' },
  { colKey: 'status', title: '状态' },
];
const load = async () => {
  if (!familyId.value) return MessagePlugin.warning('请先输入家庭 ID');
  loading.value = true;
  try {
    localStorage.setItem('youqianji-family-id', familyId.value);
    rows.value = await youqianjiApi.listAccounts(familyId.value);
  } catch (error) {
    MessagePlugin.error(error.message || '加载账户失败');
  } finally {
    loading.value = false;
  }
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
