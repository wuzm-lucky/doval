<template>
  <div :class="prefix + '-main-wrapper'">
    <div ref="containerRef" class="container">
      <t-row class="header" justify="space-between">
        <t-button :disabled="moving" @click="openForm()">新增</t-button>
        <t-space>
          <t-input
            v-model="query.searchKey"
            :disabled="moving"
            placeholder="请输入关键词"
            clearable
            @enter="onSearch"
            @clear="onSearch"
          >
            <template #suffix-icon><search-icon size="16px" /></template>
          </t-input>
          <t-button theme="primary" :disabled="moving" @click="onSearch">查询</t-button>
          <t-button theme="default" :disabled="moving" @click="onReset">重置</t-button>
        </t-space>
      </t-row>
      <t-table
        ref="tableRef"
        :max-height="tableMaxHeight || undefined"
        :data="data"
        :columns="columns"
        row-key="id"
        :pagination="pagination"
        :loading="loading || moving"
        drag-sort="row-handler"
        :drag-sort-options="dragOptions"
        @drag-sort="moveRows"
        @page-change="onPageChange"
      >
        <template #drag>
          <t-tooltip :content="query.searchKey.trim() ? '清空关键词后可拖动排序' : '拖动调整当前页账簿顺序'">
            <move-icon
              :class="['move-handle', { 'move-handle--disabled': loading || moving || !!query.searchKey.trim() }]"
            />
          </t-tooltip>
        </template>
        <template #cover="{ row }">
          <t-image v-if="row.cover" class="cover-image" :src="getCoverUrl(row.cover)" fit="cover" />
          <div v-else class="cover-placeholder">账簿</div>
        </template>
        <template #currency="{ row }">{{ getCurrencyLabel(row.currency) }}</template>
        <template #status="{ row }">
          <t-tag :theme="row.status === 'SHOW' ? 'success' : 'default'" variant="light">
            {{ displayStatus.getLabel(row.status) }}
          </t-tag>
        </template>
        <template #op="{ row }">
          <t-space>
            <t-link theme="primary" :disabled="moving" @click="openForm(row)">编辑</t-link>
            <t-link theme="primary" @click="openSettings(row)">设置</t-link>
            <t-link theme="primary" :disabled="moving" @click="toggleStatus(row)">{{
              displayStatus.getLabel(row.status === 'SHOW' ? 'HIDE' : 'SHOW')
            }}</t-link>
            <t-popconfirm content="确定删除该账簿吗？" @confirm="handleDelete(row)">
              <t-link theme="danger" :disabled="moving">删除</t-link>
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
import { MoveIcon, SearchIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { deleteBook, getBook, hideBook, pageList, saveBook, showBook, moveBook } from '@youqianji/api/book';
import { downloadUrl } from '@framework/api/file';
import { prefix } from '@framework/config/global';
import { useDict } from '@framework/store';
import { normalizePage } from '@framework/utils/page';
import BookForm from './components/BookForm.vue';
import BookSettingsDrawer from './components/BookSettingsDrawer.vue';

const columns = [
  { title: '排序', colKey: 'drag', width: 64 },
  { title: '封面', colKey: 'cover', width: 80 },
  { title: '账簿名称', colKey: 'name', width: '28%', ellipsis: true },
  { title: '默认币种', colKey: 'currency', width: '20%', ellipsis: true },
  { title: '账簿描述', colKey: 'desc', width: '36%', ellipsis: true },
  { title: '显示状态', colKey: 'status', width: '16%' },
  { title: '操作', colKey: 'op', fixed: 'right', width: 280 },
];
// 页面按需加载币种与显示状态，单元格渲染只查询响应式内存缓存。
const currencyDict = useDict('youqianji.currency');
const displayStatus = useDict('youqianji.displaystatus');
const defaultPage = { current: 1, pageSize: 20, total: 0 };
const defaultForm = { name: '', cover: '', currency: 'CNY', desc: '', defaultAccountId: null };
const query = ref({ searchKey: '' });
const data = ref([]);
const pagination = ref({ ...defaultPage });
const loading = ref(false);
const moving = ref(false);
// 筛选期间或请求未完成时阻止启动拖动，避免相对移动依据过期列表。
const dragOptions = { filter: () => loading.value || moving.value || !!query.value.searchKey.trim() };
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
/** 从币种字典获取名称并保留编码，缓存更新后自动刷新列表展示。 @author wuzm */
const getCurrencyLabel = (currency) => `${currencyDict.getLabel(currency)}（${currency}）`;
const getCoverUrl = (cover) => (/^https?:\/\//i.test(cover) ? cover : downloadUrl(cover, 'book-cover.png'));
const fetchData = async () => {
  loading.value = true;
  try {
    const { current: page, pageSize: size } = pagination.value;
    // 分页查询显式按服务端排序值升序，确保保存后刷新仍展示实际顺序。
    const result = normalizePage(
      await pageList({ searchKey: query.value.searchKey.trim() }, { page, size, sort: 'sort,asc' }),
    );
    data.value = result.rows;
    pagination.value = { ...pagination.value, total: result.total };
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '账簿列表加载失败');
  } finally {
    loading.value = false;
  }
};
const onPageChange = (pageInfo) => {
  if (moving.value) return;
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
/** 将当前页拖动转换为相对位置请求，保存成功后直接采用拖动结果，无需重新查询。 @author wuzm */
const moveRows = async ({ current, target, currentIndex, targetIndex, newData }) => {
  moving.value = true;
  try {
    // 向上拖动插入目标之前，向下拖动插入目标之后，不使用页内索引作为排序值。
    await moveBook({ id: current.id, targetId: target.id, where: currentIndex > targetIndex ? 1 : -1 });
    data.value = newData;
    MessagePlugin.success('账簿排序已保存');
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '账簿排序失败，请重试');
  } finally {
    moving.value = false;
  }
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
  if (moving.value) return;
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

.move-handle {
  cursor: move;
  color: var(--td-text-color-secondary);
}

.move-handle--disabled {
  cursor: not-allowed;
  color: var(--td-text-color-disabled);
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
