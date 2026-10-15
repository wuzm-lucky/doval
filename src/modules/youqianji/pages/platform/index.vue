<template>
  <div :class="prefix + '-main-wrapper'">
    <div ref="containerRef" class="container">
      <t-row class="header" justify="space-between">
        <t-button :disabled="busy" @click="openForm()">新增</t-button>
        <t-space>
          <t-select
            v-model="category"
            :options="categoryOptions"
            clearable
            placeholder="全部分类"
            :disabled="busy"
            style="width: 160px"
            @change="onSearch"
          />
          <t-input
            v-model="searchKey"
            clearable
            :disabled="busy"
            placeholder="请输入关键词"
            @enter="onSearch"
            @clear="onSearch"
          />
          <t-button :disabled="busy" @click="onSearch">查询</t-button>
          <t-button theme="default" :disabled="busy" @click="onReset">重置</t-button>
        </t-space>
      </t-row>
      <div ref="tableContainerRef" class="table-container">
        <t-enhanced-table
          v-model:expanded-tree-nodes="expandedKeys"
          :tree="treeConfig"
          :data="groupedRows"
          :row-attributes="rowAttributes"
          :row-class-name="rowClassName"
          :columns="columns"
          row-key="id"
          :loading="busy"
          :max-height="tableMaxHeight"
          drag-sort="row-handler"
          :drag-sort-options="dragOptions"
          :before-drag-sort="beforeDragSort"
        >
          <template #drag="{ row }">
            <t-tooltip
              v-if="!row.isGroup"
              :content="filtered ? '清空查询条件后可拖动排序' : '仅可拖动调整同分类平台顺序'"
            >
              <move-icon :class="['move-handle', { disabled: busy || !loaded || filtered }]" />
            </t-tooltip>
          </template>
          <template #name="{ row }">
            <span :class="{ 'group-name': row.isGroup }">{{ row.name }}</span>
            <span v-if="row.isGroup" class="group-count">（{{ row.children.length }}）</span>
          </template>
          <template #icon="{ row }"
            ><t-icon v-if="row.icon" :name="row.icon" size="24px" /><span v-else-if="!row.isGroup">—</span></template
          >
          <template #op="{ row }">
            <t-space v-if="!row.isGroup">
              <t-link theme="primary" :disabled="busy" @click="openForm(row)">编辑</t-link>
              <t-popconfirm content="确定删除该平台吗？" @confirm="handleDelete(row)"
                ><t-link theme="danger" :disabled="busy">删除</t-link></t-popconfirm
              >
            </t-space>
          </template>
        </t-enhanced-table>
      </div>
    </div>
    <platform-form v-model:visible="formVisible" :data="formData" :busy="busy" @submit="handleSubmit" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { MoveIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { useDict } from '@framework/store';
import { prefix } from '@framework/config/global';
import { listPlatform, getPlatform, savePlatform, deletePlatform, movePlatform } from '@youqianji/api/platform';

import PlatformForm from './components/PlatformForm.vue';
/** 按字典顺序生成非空分类节点，组内保持接口顺序，字典未加载时也保留全部平台。 @author wuzm */
function groupPlatforms(rows, options) {
  const groups = new Map(
    options.map(({ value, label }) => [
      value,
      { id: `category:${value}`, category: value, name: label, isGroup: true, children: [] },
    ]),
  );
  for (const row of rows) {
    if (!groups.has(row.category))
      groups.set(row.category, {
        id: `category:${row.category}`,
        category: row.category,
        name: row.category,
        isGroup: true,
        children: [],
      });
    groups.get(row.category).children.push(row);
  }
  return [...groups.values()].filter((group) => group.children.length);
}

/** 只允许真实平台在同一分类内相对移动，分类节点不能参与排序。 @author wuzm */
function canMovePlatform(current, target) {
  return !current.isGroup && !target.isGroup && current.id !== target.id && current.category === target.category;
}

/** 按目标前后位置更新完整平面数据，避免树表可见行遗漏收起分组。 @author wuzm */
function movePlatformRows(rows, current, target, where) {
  const result = [...rows];
  const [moved] = result.splice(
    result.findIndex((row) => row.id === current.id),
    1,
  );
  const targetIndex = result.findIndex((row) => row.id === target.id);
  result.splice(targetIndex + (where === -1 ? 1 : 0), 0, moved);
  return result;
}

// 使用服务端实际字典编码，分类名称与选项由共享字典提供。
const categoryDict = useDict('youqianji.platformcategory');
const categoryOptions = categoryDict.options;
const category = ref('');
const appliedCategory = ref('');
const filtered = computed(() => !!appliedSearchKey.value || !!appliedCategory.value);
const rows = ref([]);
const busy = ref(false);
const loaded = ref(false);
const searchKey = ref('');
const appliedSearchKey = ref('');
const formVisible = ref(false);
const formData = ref({ name: '', category: 'OTHER', icon: '', desc: '' });
const groupedRows = computed(() => groupPlatforms(rows.value, categoryOptions.value));
const collapsedKeys = ref([]);
// 以分类编码保存收起状态，排序和刷新列表不会重新展开用户已收起的分组。
const expandedKeys = computed({
  get: () => groupedRows.value.map((group) => group.id).filter((id) => !collapsedKeys.value.includes(id)),
  set: (keys) => {
    collapsedKeys.value = groupedRows.value.map((group) => group.id).filter((id) => !keys.includes(id));
  },
});
const treeConfig = { childrenKey: 'children', treeNodeColumnIndex: 1, defaultExpandAll: false };
/** 为拖动过滤器标记展示分组，分类节点不可作为拖动源。 @author wuzm */
const rowAttributes = ({ row }) => ({ 'data-platform-group': row.isGroup ? 'true' : 'false' });
/** 分类行使用独立背景和字重区分平台记录。 @author wuzm */
const rowClassName = ({ row }) => (row.isGroup ? 'platform-group-row' : '');
const columns = [
  { title: '排序', colKey: 'drag', width: 64 },
  { title: '平台名称', colKey: 'name', width: '40%', ellipsis: true },
  { title: '图标', colKey: 'icon', width: 100 },
  { title: '描述', colKey: 'desc', width: '60%', ellipsis: true },
  { title: '操作', colKey: 'op', width: 160, fixed: 'right' },
];
const dragOptions = {
  filter: (event) =>
    busy.value ||
    !loaded.value ||
    formVisible.value ||
    filtered.value ||
    event.target.closest('tr')?.dataset.platformGroup === 'true',
};
const containerRef = ref();
const tableContainerRef = ref();
const tableMaxHeight = ref(300);
let observer;
let disposed = false;

/** 查询服务端完整有序列表，失败时禁止基于旧数据排序。 */
const loadRows = async () => {
  loaded.value = false;
  try {
    const result = await listPlatform({
      searchKey: appliedSearchKey.value,
      category: appliedCategory.value || undefined,
    });
    if (!disposed) {
      rows.value = result;
      loaded.value = true;
    }
  } catch (error) {
    if (!disposed) MessagePlugin.error(error.message || '平台列表加载失败，请重新查询');
  }
};

/** 串行执行请求，统一反馈错误并在结束时解除操作锁。 */
const runOperation = async (operation) => {
  if (busy.value) return;
  busy.value = true;
  try {
    await operation();
  } catch (error) {
    if (!disposed) MessagePlugin.error(error.message || '操作失败，请重试');
  } finally {
    busy.value = false;
  }
};

/** 仅将已提交的条件用于查询和排序限制。 */
const onSearch = () =>
  runOperation(async () => {
    appliedSearchKey.value = searchKey.value.trim();
    appliedCategory.value = category.value;
    await loadRows();
    if (!disposed && loaded.value) collapsedKeys.value = [];
  });

/** 清空名称和分类筛选并重新加载完整列表。 @author wuzm */
const onReset = () => {
  searchKey.value = '';
  category.value = '';
  onSearch();
};

/** 编辑前读取最新详情，使用独立副本防止取消时改写列表。 */
const openForm = (row) =>
  runOperation(async () => {
    const detail = row ? await getPlatform(row.id) : { name: '', category: 'OTHER', icon: '', desc: '' };
    if (disposed) return;
    formData.value = { ...detail };
    formVisible.value = true;
  });

/** 按接口白名单保存；清空图标或描述时显式传 null。 @author wuzm */
const handleSubmit = (form) => {
  return runOperation(async () => {
    const payload = {
      name: form.name.trim(),
      category: form.category,
      icon: form.icon || null,
      desc: form.desc || null,
    };
    if (form.id != null) payload.id = form.id;
    await savePlatform(payload);
    if (disposed) return;
    formVisible.value = false;
    MessagePlugin.success('平台保存成功');
    await loadRows();
  });
};

/** 删除成功后重新查询，保留当前名称筛选。 */
const handleDelete = (row) =>
  runOperation(async () => {
    await deletePlatform(row.id);
    if (disposed) return;
    MessagePlugin.success('平台已删除');
    await loadRows();
  });

/** 在树表内部交换前拦截跨组移动，始终由接口成功后的完整数据驱动排序。 @author wuzm */
const beforeDragSort = (context) => {
  if (busy.value || !loaded.value || formVisible.value || filtered.value) return false;
  if (!canMovePlatform(context.current, context.target)) {
    MessagePlugin.warning('平台只能在同一分类内排序');
    return false;
  }
  moveRows(context);
  return false;
};

/** 只移动同组平台，成功后调整平面数据，失败保持顺序及折叠状态。 @author wuzm */
const moveRows = ({ current, target, currentIndex, targetIndex }) =>
  runOperation(async () => {
    const where = currentIndex > targetIndex ? 1 : -1;
    await movePlatform({ id: current.id, targetId: target.id, where });
    // 树表 newData 仅包含可见行，不能用它覆盖包含收起分类的完整列表。
    if (!disposed) rows.value = movePlatformRows(rows.value, current, target, where);
  });

onMounted(() => {
  onSearch();
  // 以实际承载区域作为表格高度，长列表只在表体内部滚动。
  observer = new ResizeObserver(() => {
    tableMaxHeight.value = tableContainerRef.value.clientHeight;
  });
  observer.observe(containerRef.value);
});
onBeforeUnmount(() => {
  disposed = true;
  observer?.disconnect();
});
</script>

<style lang="less" scoped>
.container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: var(--td-comp-paddingTB-xl) var(--td-comp-paddingLR-xl);
  gap: var(--td-comp-margin-m);
}
.header {
  align-items: center;
  gap: var(--td-comp-margin-m);
}
.table-container {
  flex: 1;
  min-height: 0;
}
.move-handle {
  cursor: move;
  color: var(--td-text-color-secondary);
}
.disabled {
  cursor: not-allowed;
  color: var(--td-text-color-disabled);
}
.group-name {
  font-weight: 600;
}
.group-count {
  color: var(--td-text-color-secondary);
}
:deep(.platform-group-row td) {
  background-color: var(--td-bg-color-secondarycontainer);
}
</style>
