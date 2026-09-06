<template>
  <div class="page">
    <t-card title="已记账流水详情" :bordered="false" :loading="loading"
      ><template #actions
        ><t-space
          ><t-button theme="danger" variant="outline" @click="visible = true">冲正流水</t-button
          ><t-button variant="outline" @click="router.back()">返回</t-button></t-space
        ></template
      ><t-descriptions v-if="item" :column="2" bordered
        ><t-descriptions-item label="流水 ID">{{ item.id }}</t-descriptions-item
        ><t-descriptions-item label="状态">{{ item.status }}</t-descriptions-item
        ><t-descriptions-item label="类型">{{ item.type }}</t-descriptions-item
        ><t-descriptions-item label="发生时间">{{ item.occurredAt }}</t-descriptions-item
        ><t-descriptions-item label="记账币种">{{ item.postingCurrency }}</t-descriptions-item
        ><t-descriptions-item label="备注">{{ item.remark || '-' }}</t-descriptions-item></t-descriptions
      ><t-empty v-else description="未找到可查看的流水" /></t-card
    ><t-dialog
      v-model:visible="visible"
      header="确认冲正"
      confirm-btn="创建冲正流水"
      :confirm-loading="submitting"
      @confirm="reverse"
      ><p>冲正会创建一笔完整反向分录，原流水不会被修改或删除。</p></t-dialog
    >
  </div>
</template>
<script setup>
import dayjs from 'dayjs';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { youqianjiApi } from '@youqianji/api';
const route = useRoute();
const router = useRouter();
const item = ref();
const loading = ref(false);
const visible = ref(false);
const submitting = ref(false);
const load = async () => {
  loading.value = true;
  try {
    item.value = await youqianjiApi.getTransaction(route.params.id);
  } catch (error) {
    MessagePlugin.error(error.message || '加载流水详情失败');
  } finally {
    loading.value = false;
  }
};
const reverse = async () => {
  if (!item.value) return;
  submitting.value = true;
  try {
    await youqianjiApi.reversal({
      familyId: item.value.familyId,
      originalTransactionId: item.value.id,
      occurredAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      remark: `冲正流水 ${item.value.id}`,
    });
    MessagePlugin.success('冲正流水已记账');
    visible.value = false;
    router.push('/youqianji/transaction');
  } catch (error) {
    MessagePlugin.error(error.message || '冲正失败');
  } finally {
    submitting.value = false;
  }
};
onMounted(load);
</script>
<style scoped lang="less">
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
