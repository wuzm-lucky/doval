<template>
  <div ref="containerRef" class="editable-table">
    <component
      :is="tableComponent"
      ref="tableRef"
      v-bind="{ ...$attrs, ...tableProps, rowAttributes }"
      :data="tableData"
      :columns="tableColumns"
      :row-key="rowKey"
      :loading="loading"
      :editable-row-keys="editableKeys"
      :max-height="maxHeight || availableHeight"
      :drag-sort="draggable ? 'row-handler' : undefined"
      :drag-sort-options="dragOptions"
      @row-edit="handleRowEdit"
      @drag-sort="handleDragSort"
    >
      <template v-for="name in forwardedSlots" :key="name" #[name]="scope">
        <slot :name="name" v-bind="slotContext(scope)" />
      </template>
      <template #drag="scope">
        <!-- 自定义插槽即使为空也应保持为空，避免子行的条件插槽触发默认手柄。 -->
        <slot v-if="slots.drag" name="drag" v-bind="slotContext(scope)" />
        <move-icon
          v-else
          :class="['editable-table__handle', { 'editable-table__handle--disabled': locked || !canDrag(scope.row) }]"
          size="20px"
          title="拖动排序"
        />
      </template>
      <template #op="scope">
        <slot name="op" v-bind="slotContext(scope)">
          <div class="editable-table__actions">
            <template v-if="isEditing(scope.row)">
              <t-link theme="primary" :disabled="loading || validating" @click="save">保存</t-link>
              <t-link :disabled="loading || validating" @click="cancel">取消</t-link></template
            >
            <template v-else>
              <t-link theme="primary" :disabled="locked || !canEdit(scope.row)" @click="startEdit(scope.row)">
                编辑
              </t-link>
              <slot name="row-actions" v-bind="slotContext(scope)" />
            </template>
          </div>
        </slot>
      </template>
    </component>
    <div v-if="error" class="editable-table__error" role="alert">{{ error }}</div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useSlots } from 'vue';
import lodash from 'lodash';
import { Table } from 'tdesign-vue-next';
import { MoveIcon } from 'tdesign-icons-vue-next';

const { cloneDeep, get, set } = lodash;

/** 普通表格只处理当前列表的副本替换与末行新增，不递归处理子数据。 */
function createTableData(data, draft, { rowKey = 'id', isNew = false } = {}) {
  const result = cloneDeep(data);
  if (!draft) return result;
  if (isNew) result.push(cloneDeep(draft));
  else {
    const index = result.findIndex((row) => String(get(row, rowKey)) === String(get(draft, rowKey)));
    if (index !== -1) result[index] = cloneDeep(draft);
  }
  return result;
}

defineOptions({ inheritAttrs: false });
/** 普通可编辑表格提供通用编辑能力，增强层可适配渲染组件和数据，不包含树形业务。 */
const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  loading: Boolean,
  disabled: Boolean,
  draggable: Boolean,
  tableComponent: { type: [Object, Function], default: () => Table },
  tableProps: { type: Object, default: () => ({}) },
  dataAdapter: Function,
  resolveRow: Function,
  maxHeight: [Number, String],
  canEdit: { type: Function, default: () => true },
  canDrag: { type: Function, default: () => true },
  beforeDragSort: Function,
  validate: Function,
});
const emit = defineEmits(['save', 'cancel', 'row-edit', 'drag-sort', 'validation-error']);
const editingRow = defineModel('editingRow', { default: null });
const slots = useSlots();
const attrs = useAttrs();
const tableRef = ref();
const containerRef = ref();
const availableHeight = ref(400);
const validating = ref(false);
const error = ref('');
const isNew = ref(false);
const original = ref(null);
let sequence = 0;
let observer;
let focusFrame;
let disposed = false;
const pending = computed(() => props.loading || validating.value);
const locked = computed(() => pending.value || props.disabled || !!editingRow.value);
const tableData = computed(() =>
  (props.dataAdapter || createTableData)(props.data, editingRow.value, { rowKey: props.rowKey, isNew: isNew.value }),
);
const editableKeys = computed(() => (editingRow.value ? [get(editingRow.value, props.rowKey)] : []));
const tableColumns = computed(() => {
  const columns = props.columns.map((column) => {
    if (!column.edit) return column;
    return {
      ...column,
      edit: {
        ...column.edit,
        props: (context) => {
          const editProps = typeof column.edit.props === 'function' ? column.edit.props(context) : column.edit.props;
          return { ...editProps, disabled: pending.value || !!editProps?.disabled };
        },
      },
    };
  });
  if (props.draggable && !columns.some((column) => column.colKey === 'drag'))
    columns.unshift({ title: '', colKey: 'drag', width: 48 });
  if (!columns.some((column) => column.colKey === 'op'))
    columns.push({ title: '操作', colKey: 'op', width: 160, fixed: 'right' });
  return columns;
});
const forwardedSlots = computed(() =>
  Object.keys(slots).filter((name) => !['drag', 'op', 'row-actions'].includes(name)),
);
const isEditing = (row) =>
  !!editingRow.value && String(get(row, props.rowKey)) === String(get(editingRow.value, props.rowKey));
const slotContext = (scope) => ({
  ...scope,
  draft: editingRow.value,
  editing: isEditing(scope.row),
  locked: locked.value,
  startEdit,
  save,
  cancel,
});
/** 新增和编辑统一复制数据；嵌套字段取消编辑后也不会污染原记录。 */
const startEdit = (row) => {
  if (locked.value || !props.canEdit(row)) return false;
  original.value = cloneDeep(row);
  isNew.value = false;
  error.value = '';
  editingRow.value = cloneDeep(row);
  return true;
};
const addRow = (defaults = {}) => {
  if (locked.value) return false;
  isNew.value = true;
  original.value = null;
  error.value = '';
  const row = cloneDeep(defaults);
  set(row, props.rowKey, `__editable_new_${++sequence}`);
  editingRow.value = row;
  nextTick(() => {
    if (!containerRef.value || disposed) return;
    // 等待底层组件的异步渲染，再滚动并聚焦新增编辑行。
    focusFrame = requestAnimationFrame(() => {
      if (disposed) return;
      const input = containerRef.value?.querySelector('input:not([readonly])');
      input?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      input?.focus({ preventScroll: true });
    });
  });
  return true;
};
/** 原生列编辑事件只更新副本，业务保存时获得完整记录。 */
const handleRowEdit = (context) => {
  if (pending.value || !isEditing(context.row)) return;
  set(editingRow.value, context.col.colKey, context.value);
  emit('row-edit', { ...context, editedRow: cloneDeep(editingRow.value) });
};
/** 先执行 TDesign 行校验再执行扩展校验，组件仅发出保存事件，由业务决定提交结果。 */
const validateRow = async () => {
  if (!editingRow.value) return false;
  const result = await tableRef.value?.validateRowData?.(get(editingRow.value, props.rowKey));
  if (result?.result?.some((item) => item.errorList?.length)) return false;
  const message = await props.validate?.(cloneDeep(editingRow.value));
  error.value = typeof message === 'string' ? message : '';
  return message !== false && !error.value;
};
const save = async () => {
  if (!editingRow.value || pending.value) return;
  validating.value = true;
  try {
    if (!(await validateRow())) {
      emit('validation-error', { error: error.value });
      return;
    }
    if (!disposed)
      emit('save', {
        row: cloneDeep(editingRow.value),
        original: cloneDeep(original.value),
        isNew: isNew.value,
      });
  } catch (reason) {
    if (!disposed) error.value = reason.message || '校验失败';
  } finally {
    if (!disposed) validating.value = false;
  }
};
/** 业务确认提交成功后主动结束编辑，失败时仅设置错误保留输入。 */
const finishEdit = () => {
  editingRow.value = null;
  original.value = null;
  isNew.value = false;
  error.value = '';
  tableRef.value?.clearValidateData?.();
};
const cancel = () => {
  if (pending.value) return;
  finishEdit();
  emit('cancel');
};
const setError = (message) => {
  error.value = message;
};
/** 拖动只从手柄触发，不修改受控 data；增强层自行适配特殊数据及事件。 */
const dragOptions = {
  filter: (event) => {
    if (locked.value) return true;
    const key = event.target.closest('tr')?.dataset.editableKey;
    const row = props.resolveRow
      ? props.resolveRow(tableData.value, key)
      : tableData.value.find((item) => String(get(item, props.rowKey)) === key);
    return !row || !props.canDrag(row);
  },
};
const handleDragSort = (context) => {
  if (locked.value || props.beforeDragSort?.(context) === false) return;
  emit('drag-sort', context);
};
/** 保留原生 rowAttributes，内部仅追加手柄定位所需的主键。 */
const rowAttributes = (context) => {
  const source = attrs.rowAttributes || attrs['row-attributes'];
  const values = (Array.isArray(source) ? source : [source]).map((item) =>
    typeof item === 'function' ? item(context) : item || {},
  );
  return Object.assign({}, ...values, { 'data-editable-key': String(get(context.row, props.rowKey)) });
};
/** 表格高度跟随容器，基础组件不包含业务页头或任何查询控件。 */
onMounted(() => {
  observer = new ResizeObserver(() => {
    availableHeight.value = Math.max(containerRef.value?.clientHeight || 0, 180);
  });
  observer.observe(containerRef.value);
});
onBeforeUnmount(() => {
  disposed = true;
  observer?.disconnect();
  if (focusFrame != null) cancelAnimationFrame(focusFrame);
});
defineExpose({
  startEdit,
  addRow,
  cancel,
  finishEdit,
  setError,
  validate: validateRow,
  save,
  tableRef,
  getTable: () => tableRef.value,
  isPending: () => pending.value,
  editingRow,
  locked,
  pending,
});
</script>

<style lang="less" scoped>
.editable-table {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.editable-table__actions {
  display: flex;
  align-items: center;
  gap: var(--td-comp-margin-s);
  white-space: nowrap;
}
.editable-table__handle {
  cursor: grab;
  color: var(--td-text-color-secondary);
  vertical-align: middle;
}
.editable-table__handle--disabled {
  cursor: not-allowed;
  color: var(--td-text-color-disabled);
}
.editable-table__error {
  color: var(--td-error-color);
  padding: var(--td-comp-paddingTB-xs);
}
</style>
