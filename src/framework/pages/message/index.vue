<template>
  <div :class="prefix + '-main-wrapper'">
    <div ref="containerRef" class="container">
      <t-row class="header" justify="end">
        <t-space>
          <t-select v-model="query.type" clearable placeholder="消息类型" :options="typeOptions" @change="onSearch" />
          <t-select v-model="query.read" clearable placeholder="阅读状态" :options="readOptions" @change="onSearch" />
          <t-button theme="primary" @click="onSearch">查询</t-button>
          <t-button theme="default" @click="onReset">重置</t-button>
        </t-space>
      </t-row>
      <t-table
        ref="tableRef"
        :max-height="tableMaxHeight || undefined"
        :data="data"
        :columns="columns"
        row-key="id"
        :pagination="pagination"
        :loading="loading"
        @page-change="onPageChange"
      >
        <template #type="{ row }"
          ><t-tag variant="light">{{ getTypeLabel(row.type) }}</t-tag></template
        >
        <template #title="{ row }">
          <t-link theme="primary" @click="openDetail(row)">{{ row.title }}</t-link>
        </template>
        <template #read="{ row }">
          <t-tag :theme="row.readTime ? 'success' : 'warning'" variant="light">{{
            row.readTime ? '已读' : '未读'
          }}</t-tag>
        </template>
        <template #top="{ row }"><t-tag v-if="row.topTime" theme="danger" variant="light">已置顶</t-tag></template>
        <template #op="{ row }">
          <t-space size="small">
            <t-link theme="primary" @click="openDetail(row)">详情</t-link>
            <t-link theme="primary" @click="toggleRead(row)">{{ row.readTime ? '设为未读' : '设为已读' }}</t-link>
            <t-link theme="primary" @click="toggleTop(row)">{{ row.topTime ? '取消置顶' : '置顶' }}</t-link>
            <t-popconfirm content="确定从我的消息中删除该消息吗？" @confirm="handleDelete(row)">
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
    </div>
    <t-dialog v-model:visible="detailVisible" header="消息详情" :footer="false" :width="680" destroy-on-close>
      <template #body>
        <div v-if="detail" class="message-detail">
          <div class="detail-title">{{ detail.title }}</div>
          <t-space class="detail-meta" size="small">
            <t-tag variant="light">{{ getTypeLabel(detail.type) }}</t-tag>
            <span>{{ detail.sender || '系统' }}</span>
            <span>{{ detail.createTime }}</span>
          </t-space>
          <!-- 服务端消息正文为富文本，按原样展示其结构。 -->
          <div class="detail-content" v-html="detail.content" />
        </div>
      </template>
    </t-dialog>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { MessagePlugin } from 'tdesign-vue-next';

import { cancelTop, deleteMessage, get, pageList, read, setTop, unread } from '@framework/api/message';
import { prefix } from '@framework/config/global';
import { normalizePage } from '@framework/utils/page';

const columns = [
  { title: '类型', colKey: 'type', width: 110 },
  { title: '标题', colKey: 'title', width: '28%', ellipsis: true },
  { title: '摘要', colKey: 'summary', width: '28%', ellipsis: true },
  { title: '发送人', colKey: 'sender', width: '12%', ellipsis: true },
  { title: '状态', colKey: 'read', width: 90 },
  { title: '置顶', colKey: 'top', width: 80 },
  { title: '发送时间', colKey: 'createTime', width: 180, ellipsis: true },
  { title: '操作', colKey: 'op', fixed: 'right', width: 270 },
];
const typeOptions = [
  { label: '系统公告', value: 'ANNOUNCEMENT' },
  { label: '提醒', value: 'REMINDER' },
  { label: '消息', value: 'MESSAGE' },
];
const readOptions = [
  { label: '未读', value: false },
  { label: '已读', value: true },
];
const typeLabels = Object.fromEntries(typeOptions.map((item) => [item.value, item.label]));
const defaultPage = { current: 1, pageSize: 20, total: 0 };
const route = useRoute();
const query = ref({ type: undefined, read: undefined });
const data = ref([]);
const pagination = ref({ ...defaultPage });
const loading = ref(false);
const detailVisible = ref(false);
const detail = ref();
const containerRef = ref();
const tableRef = ref();
const tableMaxHeight = ref(0);
let containerResizeObserver;

const getTypeLabel = (type) => typeLabels[type] || type || '消息';

/** 根据表格距视口底部的可用空间设置最大高度，使超长数据在表体内滚动。 */
const updateTableMaxHeight = () => {
  const tableElement = tableRef.value?.$el;
  if (!tableElement) return;
  tableMaxHeight.value = Math.max(window.innerHeight - tableElement.getBoundingClientRect().top - 24, 240);
};

const fetchData = async () => {
  loading.value = true;
  try {
    const { current: page, pageSize: size } = pagination.value;
    const result = normalizePage(await pageList({ ...query.value }, { page, size }));
    data.value = result.rows;
    pagination.value = { ...pagination.value, total: result.total };
  } finally {
    loading.value = false;
  }
};

const onPageChange = (pageInfo) => {
  pagination.value = { ...pagination.value, current: pageInfo.current, pageSize: pageInfo.pageSize };
  fetchData();
};

const onSearch = () => {
  pagination.value = { ...defaultPage };
  fetchData();
};

const onReset = () => {
  query.value = { type: undefined, read: undefined };
  onSearch();
};

/** 查询详情时由服务端同步已读状态，再刷新列表中的阅读状态。 */
const openDetail = async (row) => {
  detail.value = await get(row.id);
  detailVisible.value = true;
  if (!row.readTime) fetchData();
};

const toggleRead = async (row) => {
  if (row.readTime) await unread(row.id);
  else await read(row.id);
  await fetchData();
};

const toggleTop = async (row) => {
  if (row.topTime) await cancelTop(row.id);
  else await setTop(row.id, true);
  await fetchData();
};

/** 删除当前用户可见的消息；当前页仅剩一条时回退至上一页。 */
const handleDelete = async (row) => {
  await deleteMessage(row.id);
  if (data.value.length === 1 && pagination.value.current > 1) pagination.value.current -= 1;
  MessagePlugin.success('删除成功');
  await fetchData();
};

watch(
  () => route.query.id,
  (id) => {
    if (!id) return;
    const row = data.value.find((item) => String(item.id) === String(id));
    if (row) openDetail(row);
  },
);

onMounted(() => {
  fetchData().then(() => {
    const row = data.value.find((item) => String(item.id) === String(route.query.id));
    if (row) openDetail(row);
  });
  nextTick(() => {
    updateTableMaxHeight();
    containerResizeObserver = new ResizeObserver(updateTableMaxHeight);
    if (containerRef.value) containerResizeObserver.observe(containerRef.value);
  });
});

onBeforeUnmount(() => containerResizeObserver?.disconnect());
</script>

<style lang="less" scoped>
.container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: var(--td-comp-paddingTB-xl) var(--td-comp-paddingLR-xl);
}

.header {
  margin-bottom: var(--td-comp-margin-m);
}

.message-detail {
  min-height: 260px;
}

.detail-title {
  font: var(--td-font-title-large);
  color: var(--td-text-color-primary);
}

.detail-meta {
  margin-top: var(--td-comp-margin-m);
  color: var(--td-text-color-secondary);
}

.detail-content {
  margin-top: var(--td-comp-margin-xl);
  color: var(--td-text-color-primary);
  line-height: var(--td-line-height-body-medium);
  overflow-wrap: anywhere;
}
</style>
