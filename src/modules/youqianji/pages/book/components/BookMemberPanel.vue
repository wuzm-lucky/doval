<template>
  <div class="panel">
    <t-row class="toolbar" justify="space-between">
      <t-button :disabled="locked" @click="addRow()">新增</t-button>
      <t-space>
        <t-input
          v-model="searchKey"
          clearable
          :maxlength="100"
          placeholder="请输入关键词"
          :disabled="busy"
          style="width: 200px"
          @enter="onSearch"
          @clear="onSearch"
        />
        <t-button theme="primary" :disabled="busy" @click="onSearch">查询</t-button>
        <t-button variant="outline" :disabled="busy" @click="onReset">重置</t-button>
      </t-space>
    </t-row>
    <editable-table
      ref="tableRef"
      v-model:editing-row="draft"
      :data="rows"
      :columns="columns"
      :loading="busy"
      :disabled="!loaded"
      :row-class-name="rowClassName"
      draggable
      size="small"
      @save="saveRow"
      @drag-sort="moveRows"
    >
      <template #status="{ row }">
        <t-tag :theme="row.status === 'ACTIVE' ? 'success' : 'default'" variant="light">
          {{ row.status ? archiveStatus.getLabel(row.status) : '待保存' }}
        </t-tag>
      </template>
      <template #row-actions="{ row, locked }">
        <t-popconfirm
          v-if="row.status === 'ACTIVE'"
          content="归档后停止新增选择，历史身份保留，确定归档吗？"
          @confirm="changeStatus('archive', row)"
        >
          <t-link theme="primary" :disabled="locked">归档 </t-link>
        </t-popconfirm>
        <t-link
          v-else-if="row.status === 'ARCHIVED'"
          theme="primary"
          :disabled="locked"
          @click="changeStatus('restore', row)"
          >恢复
        </t-link>
        <t-popconfirm content="确定永久删除吗？如需保留历史身份，请使用归档。" @confirm="changeStatus('delete', row)">
          <t-link theme="danger" :disabled="locked">删除</t-link>
        </t-popconfirm>
      </template>
    </editable-table>
  </div>
</template>

<script setup>
import { useDict } from '@framework/store';
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { Input, MessagePlugin, DialogPlugin } from 'tdesign-vue-next';
import EditableTable from '@framework/components/editable-table/EditableTable.vue';
import {
  listBookMember,
  saveBookMember,
  archiveBookMember,
  restoreBookMember,
  deleteBookMember,
  moveBookMember,
} from '@youqianji/api/bookmember';

/** 当前业务面板负责查询、接口请求及字段转换，基础表格仅处理编辑交互。  */
// 归档状态来自共享字典，未保存行保留页面临时状态。
const archiveStatus = useDict('youqianji.archivestatus');
const props = defineProps({ bookId: { type: [Number, String], required: true } });
const tableRef = ref();
const rows = ref([]);
const draft = ref(null);
const busy = ref(false);
const loaded = ref(false);
const searchKey = ref('');
const appliedSearchKey = ref('');
const locked = computed(() => busy.value || !loaded.value || !!draft.value);
let disposed = false;
const rowClassName = ({ row }) => (row.status === 'ARCHIVED' ? 'archived-row' : '');
/** 串行加载已提交的检索条件，销毁后忽略响应。 @author wuzm */
const loadRows = async () => {
  if (busy.value || disposed) return;
  busy.value = true;
  loaded.value = false;
  try {
    const query = { bookId: props.bookId, searchKey: appliedSearchKey.value || undefined };
    const result = await listBookMember(query);
    if (!disposed) {
      rows.value = result;
      loaded.value = true;
    }
  } catch (reason) {
    if (!disposed) MessagePlugin.error(reason.message || '列表加载失败，请重新查询');
  } finally {
    busy.value = false;
  }
};
/** 业务离开检查服务于查询、分组和外层抽屉关闭。  */
const guardLeave = (proceed) => {
  if (tableRef.value?.isPending()) return;
  if (!draft.value) {
    proceed();
    return;
  }
  const dialog = DialogPlugin.confirm({
    header: '存在未保存修改',
    body: '是否放弃当前行的修改？',
    confirmBtn: '放弃修改',
    cancelBtn: '继续编辑',
    onConfirm: () => {
      dialog.destroy();
      if (!disposed) {
        tableRef.value?.cancel();
        proceed();
      }
    },
  });
};
const onSearch = () =>
  guardLeave(() => {
    appliedSearchKey.value = searchKey.value.trim();
    loadRows();
  });
const onReset = () =>
  guardLeave(() => {
    searchKey.value = '';
    appliedSearchKey.value = '';
    loadRows();
  });
/** 外部新增按钮只提供业务默认字段，末行插入及输入聚焦交由表格完成。  */
const addRow = () => tableRef.value?.addRow({ name: '' });
/** 保存仅提交白名单字段；成功后退出编辑，失败保留输入。  */
const saveRow = async ({ row, isNew }) => {
  const payload = { bookId: props.bookId, name: row.name.trim() };
  if (!isNew) payload.id = row.id;
  busy.value = true;
  try {
    await saveBookMember(payload);
    if (disposed) return;
    tableRef.value?.finishEdit();
    MessagePlugin.success('保存成功');
    busy.value = false;
    await loadRows();
  } catch (reason) {
    if (!disposed) tableRef.value?.setError(reason.message || '保存失败，请重试');
  } finally {
    busy.value = false;
  }
};
/** 归档、恢复、删除仍由业务页选择独立接口，不进入基础组件。  */
const changeStatus = async (action, row) => {
  if (locked.value) return;
  busy.value = true;
  try {
    await { archive: archiveBookMember, restore: restoreBookMember, delete: deleteBookMember }[action](row.id);
    if (disposed) return;
    MessagePlugin.success({ archive: '已归档', restore: '已恢复', delete: '已删除' }[action]);
    busy.value = false;
    await loadRows();
  } catch (reason) {
    if (!disposed) MessagePlugin.error(reason.message || '操作失败，请重试');
  } finally {
    busy.value = false;
  }
};
/** 保存相对移动位置，成功后直接采用 TDesign 的拖动结果。 @author wuzm */
const moveRows = async ({ current, target, currentIndex, targetIndex, newData }) => {
  busy.value = true;
  try {
    await moveBookMember({ id: current.id, targetId: target.id, where: currentIndex > targetIndex ? 1 : -1 });
    if (disposed) return;
    rows.value = newData;
  } catch (reason) {
    if (!disposed) MessagePlugin.error(reason.message || '排序失败，请重试');
  } finally {
    busy.value = false;
  }
};
const columns = [
  {
    title: '名称',
    colKey: 'name',
    width: 200,
    edit: {
      showEditIcon: false,
      component: Input,
      props: { maxlength: 100, placeholder: '请输入名称' },
      rules: [{ validator: (value) => !!value?.trim(), message: '请输入名称' }],
    },
  },
  { title: '状态', colKey: 'status', width: 90 },
  { title: '操作', colKey: 'op', width: 210, fixed: 'right' },
];
onMounted(loadRows);
onBeforeUnmount(() => {
  disposed = true;
});
defineExpose({ guardLeave });
</script>
<style lang="less" scoped>
/* 面板布局与工具栏对齐由各业务页面维护。 */
.panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: var(--td-comp-margin-m);
}
.toolbar {
  align-items: center;
}
/* 仅灰化归档内容，操作入口和编辑控件保持可读。 */
:deep(.archived-row td:not(:last-child)),
:deep(.archived-row td:not(:last-child) .t-tag) {
  color: var(--td-text-color-disabled);
}
</style>
