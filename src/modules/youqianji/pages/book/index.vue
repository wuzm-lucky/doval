<template>
  <div :class="prefix + '-main-wrapper'">
    <div ref="containerRef" class="container">
      <t-row class="header" justify="space-between">
        <t-button @click="openForm()">新增</t-button>
        <t-space>
          <t-input v-model="query.searchKey" placeholder="请输入关键词" clearable @enter="onSearch" @clear="onSearch">
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
        <template #cover="{ row }">
          <t-image v-if="row.cover" class="cover-image" :src="getCoverUrl(row.cover)" fit="cover" />
          <div v-else class="cover-placeholder">账簿</div>
        </template>
        <template #currency="{ row }">{{ getCurrencyLabel(row.currency) }}</template>
        <template #status="{ row }">
          <t-tag :theme="row.status === 'SHOW' ? 'success' : 'default'" variant="light">
            {{ row.status === 'SHOW' ? '显示' : '隐藏' }}
          </t-tag>
        </template>
        <template #op="{ row }">
          <t-space>
            <t-link theme="primary" @click="openForm(row)">编辑</t-link>
            <t-link theme="primary" @click="openSettings(row)">账簿设置</t-link>
            <t-link theme="primary" @click="toggleStatus(row)">{{ row.status === 'SHOW' ? '隐藏' : '显示' }}</t-link>
            <t-popconfirm content="确定删除该账簿吗？" @confirm="handleDelete(row)">
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
    </div>
    <book-settings-drawer v-model:visible="settingsVisible" :book="settingsBook" />
    <book-form v-model:visible="formVisible" :data="formData" @submit="handleSubmit" />
  </div>
</template>

<script setup>
import { SearchIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { deleteBook, getBook, hideBook, pageList, saveBook, showBook } from '@youqianji/api/book';
import { downloadUrl } from '@framework/api/file';
import { prefix } from '@framework/config/global';
import { normalizePage } from '@framework/utils/page';
import BookForm from './components/BookForm.vue';
import BookSettingsDrawer from './components/BookSettingsDrawer.vue';

const columns = [
  { title: '封面', colKey: 'cover', width: 80 },
  { title: '账簿名称', colKey: 'name', width: '28%', ellipsis: true },
  { title: '默认币种', colKey: 'currency', width: '20%', ellipsis: true },
  { title: '账簿描述', colKey: 'desc', width: '36%', ellipsis: true },
  { title: '显示状态', colKey: 'status', width: '16%' },
  { title: '操作', colKey: 'op', fixed: 'right', width: 280 },
];
const currencyLabels = {
  CNY: '人民币',
  HKD: '港币',
  USD: '美元',
  EUR: '欧元',
  GBP: '英镑',
  JPY: '日元',
  SGD: '新加坡元',
  AUD: '澳大利亚元',
  CAD: '加拿大元',
  CHF: '瑞士法郎',
  NZD: '新西兰元',
  MOP: '澳门元',
  TWD: '新台币',
  KRW: '韩元',
  THB: '泰铢',
  MYR: '马来西亚林吉特',
  IDR: '印度尼西亚卢比',
  PHP: '菲律宾比索',
  INR: '印度卢比',
  AED: '阿联酋迪拉姆',
};
const defaultPage = { current: 1, pageSize: 20, total: 0 };
const defaultForm = { name: '', cover: '', currency: 'CNY', desc: '', defaultAccountId: null };
const query = ref({ searchKey: '' });
const data = ref([]);
const pagination = ref({ ...defaultPage });
const loading = ref(false);
const formVisible = ref(false);
const settingsVisible = ref(false);
const settingsBook = ref({});
/** 以列表当前账簿作为设置上下文，所有维护接口固定使用该账簿主键。 @author wuzm */
const openSettings = (row) => {
  settingsBook.value = { id: row.id, name: row.name };
  settingsVisible.value = true;
};
const formData = ref({ ...defaultForm });
const containerRef = ref();
const tableRef = ref();
const tableMaxHeight = ref(0);
let containerResizeObserver;

/** 根据表格距离视口底部的空间设置最大高度，确保长列表仅在表体内滚动。 */
const updateTableMaxHeight = () => {
  const tableElement = tableRef.value?.$el;
  if (!tableElement) return;
  tableMaxHeight.value = Math.max(window.innerHeight - tableElement.getBoundingClientRect().top - 24, 240);
};
const getCurrencyLabel = (currency) => `${currencyLabels[currency] || currency}（${currency}）`;
const getCoverUrl = (cover) => (/^https?:\/\//i.test(cover) ? cover : downloadUrl(cover, 'book-cover.png'));
const fetchData = async () => {
  loading.value = true;
  try {
    const { current: page, pageSize: size } = pagination.value;
    const result = normalizePage(await pageList({ searchKey: query.value.searchKey.trim() }, { page, size }));
    data.value = result.rows;
    pagination.value = { ...pagination.value, total: result.total };
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '账簿列表加载失败');
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
const openForm = async (row) => {
  try {
    // 编辑前读取最新详情，保存时按请求字段白名单提交资料。
    formData.value = row ? await getBook(row.id) : { ...defaultForm };
    formVisible.value = true;
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '账簿详情加载失败');
  }
};
const handleSubmit = async (form) => {
  // 默认账户为空会被服务端清空，因此编辑其他资料时必须保留详情中的原值。
  const payload = {
    name: form.name.trim(),
    cover: form.cover || null,
    currency: form.currency,
    desc: form.desc || null,
    defaultAccountId: form.defaultAccountId ?? null,
  };
  if (form.id) payload.id = form.id;
  try {
    await saveBook(payload);
    formVisible.value = false;
    await fetchData();
    MessagePlugin.success('账簿保存成功');
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '账簿保存失败，请重试');
  }
};
const toggleStatus = async (row) => {
  try {
    // 显示状态由账簿接口独立更新，不再提交用户关联和排序信息。
    await (row.status === 'SHOW' ? hideBook(row.id) : showBook(row.id));
    await fetchData();
    MessagePlugin.success(row.status === 'SHOW' ? '账簿已隐藏' : '账簿已显示');
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '账簿状态保存失败，请重试');
  }
};
const handleDelete = async (row) => {
  try {
    await deleteBook(row.id);
    // 删除当前页最后一条后回到上一页，避免落在已不存在的空页。
    if (data.value.length === 1 && pagination.value.current > 1) pagination.value.current -= 1;
    await fetchData();
    MessagePlugin.success('账簿已删除');
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '账簿删除失败，请重试');
  }
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

.cover-image,
.cover-placeholder {
  width: 48px;
  height: 68px;
  border-radius: var(--td-radius-medium);
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--td-bg-color-container-hover);
  color: var(--td-text-color-placeholder);
  font-size: var(--td-font-size-body-small);
}
</style>
