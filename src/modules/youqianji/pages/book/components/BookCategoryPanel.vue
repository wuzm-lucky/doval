<template>
  <div class="panel">
    <t-space>
      <t-radio-group :value="direction" variant="default-filled" :disabled="busy" @change="switchDirection">
        <t-radio-button v-for="option in directionOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </t-radio-button>
      </t-radio-group>
    </t-space>
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
    <editable-tree-table
      ref="tableRef"
      v-model:editing-row="draft"
      :data="treeData"
      :columns="columns"
      :loading="busy"
      :disabled="!loaded"
      :row-class-name="rowClassName"
      :validate="validateRow"
      draggable
      size="small"
      :tree="treeConfig"
      v-model:expanded-tree-nodes="expandedKeys"
      :before-drag-sort="canMove"
      :can-drag="canDrag"
      @save="saveRow"
      @drag-sort="moveRows"
    >
      <template #icon="{ row, draft, editing }">
        <t-select
          v-if="editing"
          v-model="draft.icon"
          clearable
          filterable
          :disabled="busy"
          placeholder="请选择图标"
          :popup-props="{
            overlayClassName: 'category-icon-select-popup',
            overlayInnerClassName: 'category-icon-select-content',
            overlayInnerStyle: { width: '480px' },
          }"
          @search="searchIcons"
          @popup-visible-change="handleIconPopupVisibleChange"
        >
          <t-option v-for="item in iconOptions" :key="item.stem" :value="item.stem" :label="item.stem">
            <t-icon :name="item.stem" />
          </t-option>
          <template #valueDisplay>
            <t-icon v-if="draft.icon" :name="draft.icon" />
            <span>{{ draft.icon }}</span>
          </template>
        </t-select>
        <t-tooltip v-else-if="row.icon" :content="row.icon"><t-icon :name="row.icon" size="20px" /> </t-tooltip>
        <span v-else>—</span>
      </template>
      <template #color="{ row, draft, editing }">
        <t-color-picker
          v-if="editing"
          v-model="draft.color"
          format="HEX"
          :color-modes="['monochrome']"
          :enable-alpha="false"
          :disabled="busy"
          clearable
          :input-props="{ placeholder: '默认颜色' }"
          :style="{ width: '100%' }"
          @clear="draft.color = ''"
        />
        <t-color-picker
          v-else
          class="readonly-color"
          :value="row.color || ''"
          format="HEX"
          :color-modes="['monochrome']"
          :enable-alpha="false"
          :clearable="false"
          borderless
          :input-props="{ readonly: true, placeholder: '默认颜色' }"
          :popup-props="{ visible: false }"
          :style="{ width: '100%' }"
        />
      </template>
      <template #status="{ row }">
        <t-tag :theme="row.status === 'ACTIVE' ? 'success' : 'default'" variant="light">{{
          row.status ? archiveStatus.getLabel(row.status) : '待保存'
        }}</t-tag>
      </template>
      <template #row-actions="{ row, locked }">
        <t-link
          v-if="String(row.pid) === '0'"
          theme="primary"
          :disabled="locked || row.status !== 'ACTIVE'"
          @click="addChild(row)"
          >添加子类别</t-link
        >
        <t-popconfirm
          v-if="row.status === 'ACTIVE'"
          content="归档当前类别及全部子类别，历史身份保留，确定归档吗？"
          @confirm="changeStatus('archive', row)"
        >
          <t-link theme="primary" :disabled="locked">归档</t-link>
        </t-popconfirm>
        <t-link
          v-else-if="row.status === 'ARCHIVED'"
          theme="primary"
          :disabled="locked || !canRestore(row)"
          @click="changeStatus('restore', row)"
          >恢复
        </t-link>
        <t-popconfirm content="确定永久删除吗？如需保留历史身份，请使用归档。" @confirm="changeStatus('delete', row)">
          <t-link theme="danger" :disabled="locked || hasChildren(row)">删除</t-link>
        </t-popconfirm>
      </template>
    </editable-tree-table>
    <div class="hint">
      新增一级类别或在一级类别后添加子类别；拖动手柄调整同级顺序。归档影响子树，恢复需先恢复父级，仅无子级类别可删除。
    </div>
  </div>
</template>

<script setup>
import { useDict } from '@framework/store';
import { computed, onMounted, onBeforeUnmount, ref, nextTick, watch } from 'vue';
import { Input, MessagePlugin, DialogPlugin } from 'tdesign-vue-next';
import EditableTreeTable from '@framework/components/editable-table/EditableTreeTable.vue';
import { manifest } from 'tdesign-icons-vue-next';
import {
  listBookCategory,
  saveBookCategory,
  archiveBookCategory,
  restoreBookCategory,
  deleteBookCategory,
  moveBookCategory,
} from '@youqianji/api/bookcategory';

/** 当前业务面板负责查询、接口请求及字段转换，基础表格仅处理编辑交互。 */
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
// 收支方向由字典提供选项，树的展开状态继续按业务值独立保存。
const { options: directionOptions } = useDict('youqianji.bookcategorytype');
const direction = ref('EXPENSE');
const matchedIds = ref(new Set());
const expandedByType = ref({ EXPENSE: [], INCOME: [] });
const treeConfig = { childrenKey: 'children', treeNodeColumnIndex: 1, defaultExpandAll: false };
/** 串行加载已提交的检索条件，销毁后忽略响应。 @author wuzm */
const loadRows = async () => {
  if (busy.value || disposed) return;
  busy.value = true;
  loaded.value = false;
  try {
    const query = { bookId: props.bookId, searchKey: appliedSearchKey.value || undefined, type: direction.value };
    const [matched, all] = await Promise.all([
      listBookCategory(query),
      appliedSearchKey.value ? listBookCategory({ ...query, searchKey: undefined }) : Promise.resolve(null),
    ]);
    if (!disposed) {
      rows.value = all || matched;
      matchedIds.value = new Set(matched.map((row) => String(row.id)));
      loaded.value = true;
    }
  } catch (reason) {
    if (!disposed) MessagePlugin.error(reason.message || '列表加载失败，请重新查询');
  } finally {
    busy.value = false;
  }
};
/** 业务离开检查服务于查询、分组和外层抽屉关闭。 */
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
/** 外部新增按钮只提供业务默认字段，末行插入及输入聚焦交由表格完成。 */
const addRow = () => tableRef.value?.addRow({ name: '', pid: 0, type: direction.value, icon: '', color: '' });
/** 业务校验保持后端字段约定，组件不包含名称或颜色等专有字段。 */
const validateRow = (row) => (row.color && !/^#[0-9a-fA-F]{6}$/.test(row.color) ? '颜色必须为 #RRGGBB 格式' : '');
/** 保存仅提交白名单字段；成功后退出编辑，失败保留输入。 */
const saveRow = async ({ row, isNew }) => {
  const payload = {
    bookId: props.bookId,
    name: row.name.trim(),
    pid: row.pid,
    type: row.type,
    icon: row.icon?.trim() || null,
    color: row.color?.trim().toUpperCase() || null,
  };
  if (!isNew) payload.id = row.id;
  busy.value = true;
  try {
    await saveBookCategory(payload);
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
/** 归档、恢复、删除仍由业务页选择独立接口，不进入基础组件。 */
const changeStatus = async (action, row) => {
  if (locked.value) return;
  busy.value = true;
  try {
    await { archive: archiveBookCategory, restore: restoreBookCategory, delete: deleteBookCategory }[action](row.id);
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
/** 保存同级类别移动位置，更新平面业务数据以保留完整子树。 @author wuzm */
const moveRows = async ({ current, target, currentIndex, targetIndex }) => {
  busy.value = true;
  try {
    await moveBookCategory({ id: current.id, targetId: target.id, where: currentIndex > targetIndex ? 1 : -1 });
    if (disposed) return;
    // 基础树表已校验同父级移动，仅调整节点顺序，父级关联及子树保持不变。
    const ordered = [...rows.value];
    const sourceIndex = ordered.findIndex((row) => String(row.id) === String(current.id));
    const [moved] = ordered.splice(sourceIndex, 1);
    const destinationIndex = ordered.findIndex((row) => String(row.id) === String(target.id));
    ordered.splice(destinationIndex + (currentIndex > targetIndex ? 0 : 1), 0, moved);
    rows.value = ordered;
  } catch (reason) {
    if (!disposed) MessagePlugin.error(reason.message || '排序失败，请重试');
  } finally {
    busy.value = false;
  }
};
/** 构建嵌套数据交给 EnhancedTable，检索时保留匹配节点的祖先。 */
const treeData = computed(() => {
  const visible = new Set(matchedIds.value);
  if (appliedSearchKey.value)
    for (const id of matchedIds.value) {
      let row = rows.value.find((item) => String(item.id) === id);
      while (row && String(row.pid) !== '0') {
        visible.add(String(row.pid));
        row = rows.value.find((item) => String(item.id) === String(row.pid));
      }
    }
  const build = (pid) =>
    rows.value
      .filter((row) => String(row.pid) === String(pid) && (!appliedSearchKey.value || visible.has(String(row.id))))
      .map((row) => ({ ...row, children: build(row.id) }));
  return build(0);
});
const expandedKeys = computed({
  get: () =>
    appliedSearchKey.value
      ? rows.value.filter(hasChildren).map((row) => row.id)
      : expandedByType.value[direction.value],
  set: (keys) => {
    expandedByType.value[direction.value] = keys;
  },
});
const hasChildren = (row) => rows.value.some((item) => String(item.pid) === String(row.id));
/** 父级状态及子级存在性始终依据完整数据，不能依据过滤后的树判断。 */
const canRestore = (row) => {
  let pid = row.pid;
  while (pid && String(pid) !== '0') {
    const parent = rows.value.find((item) => String(item.id) === String(pid));
    if (!parent || parent.status !== 'ACTIVE') return false;
    pid = parent.pid;
  }
  return true;
};
const canDrag = (row) => !appliedSearchKey.value && canRestore(row);
const canMove = ({ current, target }) =>
  !appliedSearchKey.value && String(current.pid) === String(target.pid) && canRestore(current);
const addChild = (row) => {
  if (locked.value || String(row.pid) !== '0' || row.status !== 'ACTIVE') return;
  tableRef.value?.addRow({ name: '', pid: row.id, type: direction.value, icon: '', color: '' }, row.id);
};
const switchDirection = (value) => {
  if (value !== direction.value)
    guardLeave(() => {
      direction.value = value;
      rows.value = [];
      loadRows();
    });
};
// 沿用菜单图标清单和分批渲染方式，避免一次创建全部选项。
const ICON_BATCH_SIZE = 120;
const iconKeyword = ref('');
const iconRenderLimit = ref(ICON_BATCH_SIZE);
let iconPopupContent;
const matchedIconOptions = computed(() => {
  const keyword = iconKeyword.value.trim().toLowerCase();
  return keyword ? manifest.filter((item) => item.stem.toLowerCase().includes(keyword)) : manifest;
});
const iconOptions = computed(() => {
  const visibleOptions = matchedIconOptions.value.slice(0, iconRenderLimit.value);
  const selectedIcon = manifest.find((item) => item.stem === draft.value?.icon);
  if (selectedIcon && !visibleOptions.some((item) => item.stem === selectedIcon.stem))
    visibleOptions.unshift(selectedIcon);
  return visibleOptions;
});
/**
 * 根据输入内容筛选图标，限制渲染数量以避免展开下拉框时创建大量节点。
 */
const searchIcons = (keyword) => {
  iconKeyword.value = keyword;
  iconRenderLimit.value = ICON_BATCH_SIZE;
};

/**
 * 图标下拉层滚动到底部时分批加载，避免首次展开创建完整图标清单的节点。
 */
const loadMoreIcons = () => {
  if (!iconPopupContent || iconRenderLimit.value >= matchedIconOptions.value.length) return;
  const { scrollTop, clientHeight, scrollHeight } = iconPopupContent;
  if (scrollTop + clientHeight >= scrollHeight - 48) iconRenderLimit.value += ICON_BATCH_SIZE;
};

const removeIconScrollListener = () => {
  if (iconPopupContent) iconPopupContent.removeEventListener('scroll', loadMoreIcons);
  iconPopupContent = undefined;
};

const handleIconPopupVisibleChange = (visible) => {
  if (visible) {
    nextTick(() => {
      removeIconScrollListener();
      iconPopupContent = document.querySelector('.category-icon-select-popup .category-icon-select-content');
      iconPopupContent?.addEventListener('scroll', loadMoreIcons);
    });
    return;
  }
  removeIconScrollListener();
  iconKeyword.value = '';
  iconRenderLimit.value = ICON_BATCH_SIZE;
};

onBeforeUnmount(removeIconScrollListener);
// 编辑行关闭后清理弹层监听及搜索状态，避免下一行继承筛选。
watch(
  () => draft.value?.id,
  () => handleIconPopupVisibleChange(false),
);

const columns = [
  {
    title: '名称',
    colKey: 'name',
    width: 240,
    edit: {
      showEditIcon: false,
      component: Input,
      props: { maxlength: 100, placeholder: '请输入名称' },
      rules: [{ validator: (value) => !!value?.trim(), message: '请输入名称' }],
    },
  },
  { title: '图标', colKey: 'icon', width: 150 },
  { title: '颜色', colKey: 'color', width: 160 },
  { title: '状态', colKey: 'status', width: 90 },
  { title: '操作', colKey: 'op', width: 280, fixed: 'right' },
];
onMounted(loadRows);
onBeforeUnmount(() => {
  disposed = true;
});
defineExpose({ guardLeave });
</script>
<style lang="less" scoped>
/* 面板布局与工具栏对齐由各业务页面维护。@author wuzm */
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
/* 仅灰化归档内容，操作入口和编辑控件保持可读。@author wuzm */
:deep(.archived-row td:not(:last-child)),
:deep(.archived-row td:not(:last-child) .t-tag) {
  color: var(--td-text-color-disabled);
}

/* 只读颜色选择器的编码随归档行灰化，色块保留真实颜色。 */
:deep(.archived-row .t-color-picker__trigger .t-input__inner) {
  color: var(--td-text-color-disabled);
}

/* 只读颜色展示不响应鼠标交互，悬浮及聚焦均无边框、阴影或置灰背景。 */
.readonly-color {
  pointer-events: none;
}
:deep(.readonly-color .t-input),
:deep(.readonly-color .t-input:hover),
:deep(.readonly-color .t-input:focus-within),
:deep(.readonly-color .t-input.t-is-focused) {
  border-color: transparent;
  background-color: transparent;
  box-shadow: none;
}
:deep(.readonly-color .t-input__inner) {
  cursor: default;
}

/* 去掉只读颜色组件的左侧内边距和透明边框，使色块与颜色表头左边缘对齐。 */
:deep(.readonly-color .t-input) {
  padding-left: 0;
  border-left-width: 0;
}

.hint {
  color: var(--td-text-color-secondary);
  font-size: var(--td-font-size-body-small);
}

/* 图标选择网格沿用菜单样式，弹层独立命名避免影响菜单。 */
:global(.category-icon-select-popup .t-select__list) {
  display: flex;
  flex-wrap: wrap;
  gap: var(--td-comp-margin-xs);
  padding: var(--td-comp-paddingTB-xs);
}
:global(.category-icon-select-popup .t-select-option) {
  display: flex;
  width: 36px;
  min-height: 36px;
  padding: var(--td-comp-paddingTB-xs);
  justify-content: center;
  font-size: 20px;
}
:global(.category-icon-select-popup .t-select-option + .t-select-option) {
  margin-top: 0;
}
</style>
