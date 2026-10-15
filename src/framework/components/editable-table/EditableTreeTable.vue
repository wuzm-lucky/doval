<template>
  <editable-table
    ref="editableRef"
    v-bind="$attrs"
    v-model:editing-row="draft"
    :data="data"
    :row-key="rowKey"
    :draggable="draggable"
    :table-component="EnhancedTable"
    :data-adapter="adaptTreeData"
    :resolve-row="findRow"
    :tree="treeConfig"
    :expanded-tree-nodes="expandedTreeNodes"
    :table-props="{ beforeDragSort: handleBeforeDragSort }"
    @expanded-tree-nodes-change="handleExpandedChange"
    @save="handleSave"
    @drag-sort="handleDragSort"
  >
    <template v-for="name in forwardedSlots" :key="name" #[name]="scope"><slot :name="name" v-bind="scope" /></template>
    <template #treeExpandAndFoldIcon="scope">
      <slot name="treeExpandAndFoldIcon" v-bind="scope">
        <minus-rectangle-icon v-if="scope.type === 'fold'" />
        <add-rectangle-icon v-else />
      </slot>
    </template>
  </editable-table>
</template>
<script setup>
import { computed, ref, useSlots } from 'vue';
import lodash from 'lodash';
import { EnhancedTable } from 'tdesign-vue-next';
import { AddRectangleIcon, MinusRectangleIcon } from 'tdesign-icons-vue-next';
import EditableTable from './EditableTable.vue';

const { cloneDeep, get } = lodash;
defineOptions({ inheritAttrs: false });
/** 树增强层负责嵌套数据、节点新增、展开状态和拖动适配，通用编辑交给普通组件。 */
const props = defineProps({
  data: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  draggable: Boolean,
  tree: { type: Object, default: () => ({ childrenKey: 'children' }) },
  expandedTreeNodes: { type: Array, default: () => [] },
  beforeDragSort: Function,
});
const emit = defineEmits(['save', 'drag-sort', 'update:expandedTreeNodes', 'expanded-tree-nodes-change']);
const draft = defineModel('editingRow', { default: null });
const editableRef = ref();
const parentKey = ref(null);
const slots = useSlots();
const childrenKey = computed(() => props.tree.childrenKey || 'children');
const treeConfig = computed(() => ({ treeNodeColumnIndex: props.draggable ? 1 : 0, ...props.tree }));
const forwardedSlots = computed(() => Object.keys(slots).filter((name) => name !== 'treeExpandAndFoldIcon'));
/** 树查找局限于增强层，支持调用方指定主键路径和子字段。 */
const findRow = (data, key) => {
  for (const row of data) {
    if (String(get(row, props.rowKey)) === String(key)) return row;
    const child = findRow(row[childrenKey.value] || [], key);
    if (child) return child;
  }
};
/** 将编辑副本适配为嵌套数据，父子新增均追加末尾且不改变受控源数据。 */
const adaptTreeData = (data, row, { isNew }) => {
  const result = cloneDeep(data);
  if (!row) return result;
  if (isNew) {
    const parent = parentKey.value == null ? null : findRow(result, parentKey.value);
    if (parentKey.value != null && !parent) return result;
    if (parent) (parent[childrenKey.value] ||= []).push(cloneDeep(row));
    else result.push(cloneDeep(row));
  } else {
    const target = findRow(result, get(row, props.rowKey));
    if (target) Object.assign(target, cloneDeep(row));
  }
  return result;
};
/** 子级新增时由增强层维护父级上下文并展开父级，校验及聚焦复用普通组件。 */
const addRow = (defaults = {}, parent = null) => {
  if (editableRef.value?.isPending() || draft.value || (parent != null && !findRow(props.data, parent))) return false;
  parentKey.value = parent;
  if (!editableRef.value?.addRow(defaults)) {
    parentKey.value = null;
    return false;
  }
  if (parent != null) emit('update:expandedTreeNodes', [...new Set([...props.expandedTreeNodes, parent])]);
  return true;
};
const startEdit = (row) => {
  if (draft.value || editableRef.value?.isPending()) return false;
  parentKey.value = null;
  return editableRef.value?.startEdit(row);
};
const handleSave = (context) => emit('save', { ...context, parentKey: context.isNew ? parentKey.value : null });
/** 保留 EnhancedTable 事件形状；受控模式阻止内部交换，等待业务持久化后回填。 */
const handleBeforeDragSort = (context) => {
  if (editableRef.value?.locked || props.beforeDragSort?.(context) === false) return false;
  emit('drag-sort', context);
  return false;
};
const handleDragSort = (context) => {
  if (context.sort === 'col') emit('drag-sort', context);
};
const handleExpandedChange = (keys, context) => {
  if (editableRef.value?.locked) return;
  emit('update:expandedTreeNodes', keys);
  emit('expanded-tree-nodes-change', keys, context);
};
// EnhancedTable 自行同步 data，外层禁止重复 resetData，避免异步展开覆盖可见子行。
defineExpose({
  startEdit,
  addRow,
  cancel: () => editableRef.value?.cancel(),
  finishEdit: () => editableRef.value?.finishEdit(),
  setError: (message) => editableRef.value?.setError(message),
  validate: () => editableRef.value?.validate(),
  save: () => editableRef.value?.save(),
  getTable: () => editableRef.value?.getTable(),
  isPending: () => !!editableRef.value?.isPending(),
});
</script>
