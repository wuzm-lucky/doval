<template>
  <section class="dict-item-panel">
    <t-row class="header" justify="space-between">
      <t-button theme="primary" :disabled="!activeDict" @click="$emit('add')">新增</t-button>
      <t-space>
        <t-input v-model="query.nameLike" clearable placeholder="请输入字典项名称" :disabled="!activeDict">
          <template #suffix-icon><search-icon size="16px" /></template>
        </t-input>
        <t-button theme="primary" :disabled="!activeDict" @click="onSearch">查询</t-button>
        <t-button theme="default" :disabled="!activeDict" @click="onReset">重置</t-button>
      </t-space>
    </t-row>
    <div ref="tableWrapperRef" class="dict-table-wrapper">
      <t-table
        :max-height="tableMaxHeight || undefined"
        :data="data"
        :columns="columns"
        row-key="id"
        :pagination="pagination"
        :loading="loading"
        :empty="activeDict ? '暂无字典项数据' : '请先从左侧选择字典'"
        @page-change="$emit('page-change', $event)"
      >
        <template #op="{ row }"
          ><t-space
            ><t-link theme="primary" @click="$emit('edit', row)">编辑</t-link
            ><t-popconfirm content="确定删除该字典项吗？" @confirm="$emit('delete', row)"
              ><t-link theme="danger">删除</t-link></t-popconfirm
            ></t-space
          ></template
        >
      </t-table>
    </div>
  </section>
</template>

<script setup>
import { SearchIcon } from 'tdesign-icons-vue-next';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

/** 字典项列表：采用菜单页同款的“新增 + 查询/重置”头部布局。 */
const props = defineProps({
  activeDict: { type: Object, default: undefined },
  data: { type: Array, default: () => [] },
  pagination: { type: Object, required: true },
  loading: { type: Boolean, default: false },
});
const emit = defineEmits(['add', 'edit', 'delete', 'search', 'page-change']);
const columns = [
  { title: '识别码', colKey: 'code', width: 160 },
  { title: '名称', colKey: 'label', width: 160 },
  { title: '常量值', colKey: 'value', width: 160 },
  { title: '分组', colKey: 'group', width: 140 },
  { title: '排序', colKey: 'sort', width: 100 },
  { title: '操作', colKey: 'op', fixed: 'right', width: 140 },
];
const query = ref({ nameLike: '' });
const tableWrapperRef = ref();
const tableMaxHeight = ref(0);
let tableResizeObserver;

/** 根据右侧可用空间计算表格最大高度，触发表体内部滚动。 */
const updateTableMaxHeight = () => {
  tableMaxHeight.value = tableWrapperRef.value?.clientHeight || 0;
};

onMounted(() => {
  nextTick(() => {
    updateTableMaxHeight();
    tableResizeObserver = new ResizeObserver(updateTableMaxHeight);
    if (tableWrapperRef.value) tableResizeObserver.observe(tableWrapperRef.value);
  });
});
onBeforeUnmount(() => tableResizeObserver?.disconnect());

const onSearch = () => emit('search', query.value.nameLike);
const onReset = () => {
  query.value.nameLike = '';
  onSearch();
};
watch(
  () => props.activeDict?.id,
  () => {
    query.value.nameLike = '';
  },
);
</script>

<style lang="less" scoped>
.dict-item-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-xxl);
  border-left: 1px solid var(--td-border-level-1-color);
}
.header {
  flex: none;
  margin-bottom: var(--td-comp-margin-m);
}
.dict-table-wrapper {
  flex: 1;
  height: 0;
  min-height: 0;
}
</style>
