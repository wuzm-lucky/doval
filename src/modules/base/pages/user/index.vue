<template>
  <div :class="prefix + '-main-wrapper'">
    <div ref="containerRef" class="container">
      <t-row class="header" justify="space-between">
        <t-button @click="openForm()">新增</t-button>
        <t-space>
          <t-input v-model="query.searchKey" placeholder="用户名/昵称/手机号" clearable>
            <template #suffix-icon><search-icon size="16px" /></template>
          </t-input>
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
        <template #status="{ row }">
          <t-tag :theme="row.status === 1 ? 'success' : 'default'" variant="light">
            {{ row.status === 1 ? '启用' : '停用' }}
          </t-tag>
        </template>
        <template #op="{ row }">
          <t-space>
            <t-link theme="primary" @click="openForm(row)">编辑</t-link>
            <t-popconfirm content="确定删除该用户吗？" @confirm="handleDelete(row)">
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
    </div>
    <user-form v-model:visible="formVisible" :data="formData" @submit="handleSubmit" />
  </div>
</template>

<script setup>
import { SearchIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { create, del, pageList, update } from '@base/api/user';
import { prefix } from '@framework/config/global';
import { normalizePage } from '@framework/utils/page';
import UserForm from './components/UserForm.vue';

const columns = [
  { title: '用户名', colKey: 'username', width: '15%', ellipsis: true },
  { title: '昵称', colKey: 'nickname', width: '15%', ellipsis: true },
  { title: '手机号', colKey: 'phone', width: '20%', ellipsis: true },
  { title: '邮箱', colKey: 'email', width: '25%', ellipsis: true },
  { title: '状态', colKey: 'status', width: '10%' },
  { title: '操作', colKey: 'op', fixed: 'right', width: 140 },
];
const defaultPage = { current: 1, pageSize: 20, total: 0 };
const defaultForm = { username: '', nickname: '', phone: '', email: '', gender: undefined, status: 1 };
const query = ref({ searchKey: '' });
const data = ref([]);
const pagination = ref({ ...defaultPage });
const loading = ref(false);
const formVisible = ref(false);
const formData = ref({ ...defaultForm });
const containerRef = ref();
const tableRef = ref();
const tableMaxHeight = ref(0);
let containerResizeObserver;

/** 根据表格距视口底部的可用空间设置最大高度，使超长数据在表体内滚动。 */
const updateTableMaxHeight = () => {
  const tableElement = tableRef.value?.$el;
  if (!tableElement) return;
  const tableTop = tableElement.getBoundingClientRect().top;
  tableMaxHeight.value = Math.max(window.innerHeight - tableTop - 24, 240);
};

const fetchData = async () => {
  loading.value = true;
  try {
    const { current: page, pageSize: size } = pagination.value;
    const result = normalizePage(await pageList({ searchKey: query.value.searchKey.trim() }, { page, size }));
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
  query.value = { searchKey: '' };
  onSearch();
};

const openForm = (row) => {
  formData.value = row ? { ...row } : { ...defaultForm };
  formVisible.value = true;
};

const handleSubmit = async (form) => {
  if (form.id) await update(form);
  else await create(form);
  MessagePlugin.success('保存成功');
  formVisible.value = false;
  fetchData();
};

const handleDelete = async (row) => {
  await del(row.id);
  MessagePlugin.success('删除成功');
  fetchData();
};

onMounted(() => {
  fetchData();
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
</style>
