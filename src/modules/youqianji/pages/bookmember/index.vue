<template>
  <div :class="prefix + '-main-wrapper'">
    <div ref="containerRef" class="container">
      <t-row class="header" justify="space-between">
        <t-button theme="primary" :disabled="!query.bookId" @click="openForm()">新增</t-button>
        <t-space>
          <t-select
            v-model="query.bookId"
            :options="bookOptions"
            :loading="bookLoading"
            :disabled="bookLoading || !bookOptions.length"
            placeholder="请选择账簿"
            style="width: 240px"
            @change="handleBookChange"
          />
          <t-input
            v-model="query.searchKey"
            clearable
            placeholder="成员名称"
            style="width: 200px"
            @enter="onSearch"
            @clear="onSearch"
          />
          <t-button theme="primary" :loading="loading" :disabled="!query.bookId" @click="onSearch">查询</t-button>
          <t-button theme="default" :disabled="loading" @click="onReset">重置</t-button>
        </t-space>
      </t-row>
      <t-table
        ref="tableRef"
        :max-height="tableMaxHeight || undefined"
        :data="data"
        :columns="columns"
        row-key="id"
        :loading="loading"
      >
        <template #op="{ row }">
          <t-space>
            <t-link theme="primary" @click="openForm(row)">编辑</t-link>
            <t-popconfirm content="确定删除该成员吗？" @confirm="handleDelete(row)">
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
    </div>
    <book-member-form v-model:visible="formVisible" :data="formData" @submit="handleSubmit" />
  </div>
</template>

<script setup>
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { deleteBookMember, listBook, listBookMember, saveBookMember } from '@youqianji/api/book';
import { prefix } from '@framework/config/global';
import BookMemberForm from './components/BookMemberForm.vue';

const columns = [
  { title: '成员名称', colKey: 'name', width: '55%', ellipsis: true },
  { title: '排序', colKey: 'sort', width: '25%' },
  { title: '操作', colKey: 'op', fixed: 'right', width: 140 },
];
const defaultForm = { id: undefined, bookId: undefined, name: '' };
const query = ref({ bookId: undefined, searchKey: '' });
const bookOptions = ref([]);
const data = ref([]);
const loading = ref(false);
const bookLoading = ref(false);
const formVisible = ref(false);
const formData = ref({ ...defaultForm });
const containerRef = ref();
const tableRef = ref();
const tableMaxHeight = ref(0);
let containerResizeObserver;

/** 依据实际可用视口高度限制表格，成员较多时仅滚动表体。 */
const updateTableMaxHeight = () => {
  const tableElement = tableRef.value?.$el;
  if (!tableElement) return;
  tableMaxHeight.value = Math.max(window.innerHeight - tableElement.getBoundingClientRect().top - 24, 240);
};
const fetchData = async () => {
  if (!query.value.bookId) {
    data.value = [];
    return;
  }
  loading.value = true;
  try {
    data.value = await listBookMember({ bookId: query.value.bookId, searchKey: query.value.searchKey.trim() });
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '成员列表加载失败');
  } finally {
    loading.value = false;
  }
};
/** 切换账簿后清空关键词并立即查询该账簿的有效成员。 */
const handleBookChange = () => {
  query.value.searchKey = '';
  fetchData();
};
const onSearch = () => fetchData();
const onReset = () => {
  query.value.searchKey = '';
  fetchData();
};
const loadBooks = async () => {
  bookLoading.value = true;
  try {
    // 仅展示非隐藏账簿；接口的排序结果决定默认选择的第一个账簿。
    const books = await listBook({ status: 'SHOW' });
    bookOptions.value = books.map((book) => ({ label: book.name, value: book.id }));
    query.value.bookId = bookOptions.value[0]?.value;
    await fetchData();
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '账簿列表加载失败');
  } finally {
    bookLoading.value = false;
  }
};
const openForm = (row) => {
  // 使用副本编辑，取消时不会改动表格中的原始成员数据。
  formData.value = row
    ? { id: row.id, bookId: query.value.bookId, name: row.name }
    : { ...defaultForm, bookId: query.value.bookId };
  formVisible.value = true;
};
const handleSubmit = async (form) => {
  try {
    await saveBookMember({ ...form, name: form.name.trim() });
    formVisible.value = false;
    await fetchData();
    MessagePlugin.success('成员保存成功');
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '成员保存失败，请重试');
  }
};
const handleDelete = async (row) => {
  try {
    await deleteBookMember(row.id);
    await fetchData();
    MessagePlugin.success('成员已删除');
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '成员删除失败，请重试');
  }
};

onMounted(() => {
  loadBooks();
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
