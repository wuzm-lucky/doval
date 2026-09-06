<template>
  <t-card title="收支计划" :bordered="false"
    ><template #actions
      ><t-space
        ><t-button theme="primary" @click="router.push('/youqianji/plan/create')">新增模板</t-button
        ><t-button variant="outline" @click="router.push('/youqianji/plan/instance/create')">生成实例</t-button
        ><t-button variant="outline" @click="router.push('/youqianji/plan/match')">关联流水</t-button></t-space
      ></template
    ><t-form layout="inline" @submit="load"
      ><t-form-item label="家庭 ID"><t-input v-model="familyId" /></t-form-item
      ><t-form-item><t-button theme="primary" type="submit" :loading="loading">查询</t-button></t-form-item></t-form
    ><t-tabs
      ><t-tab-panel label="计划模板"
        ><t-table
          :data="templates"
          :loading="loading"
          :columns="templateColumns"
          row-key="id"
          :pagination="false" /></t-tab-panel
      ><t-tab-panel label="计划实例"
        ><t-table
          :data="instances"
          :loading="loading"
          :columns="instanceColumns"
          row-key="id"
          :pagination="false" /></t-tab-panel></t-tabs
  ></t-card>
</template>
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { youqianjiApi } from '@youqianji/api';
const router = useRouter();
const familyId = ref(localStorage.getItem('youqianji-family-id') || '');
const templates = ref([]),
  instances = ref([]),
  loading = ref(false);
const templateColumns = [
  { colKey: 'type', title: '类型' },
  { colKey: 'currency', title: '币种' },
  { colKey: 'amount', title: '计划金额' },
  { colKey: 'recurrence', title: '周期' },
  { colKey: 'status', title: '状态' },
];
const instanceColumns = [
  { colKey: 'periodStart', title: '周期开始' },
  { colKey: 'periodEnd', title: '周期结束' },
  { colKey: 'plannedAmount', title: '计划金额' },
  { colKey: 'completedAmount', title: '完成金额' },
  { colKey: 'status', title: '状态' },
];
const load = async () => {
  if (!familyId.value) return;
  loading.value = true;
  try {
    [templates.value, instances.value] = await Promise.all([
      youqianjiApi.listPlanTemplates(familyId.value),
      youqianjiApi.listPlanInstances(familyId.value),
    ]);
  } finally {
    loading.value = false;
  }
};
</script>
