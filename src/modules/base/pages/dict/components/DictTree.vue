<template>
  <aside class="dict-tree-panel">
    <t-input-adornment class="dict-search">
      <template #prepend>
        <t-tree-select
          v-model="query.codeRLike"
          :data="codeGroupTree"
          :keys="treeKeys"
          clearable
          filterable
          placeholder="编码目录"
          class="code-group-select"
          @change="onSearch"
        />
      </template>
      <t-input v-model="query.nameLike" clearable placeholder="请输入字典名称" @clear="onSearch" @enter="onSearch" />
      <template #append>
        <t-button theme="primary" class="dict-search-button" @click="onSearch"><search-icon size="16px" /></t-button>
      </template>
    </t-input-adornment>
    <t-tree
      :actived="activeDict ? [activeDict.id] : []"
      :data="dictTreeData"
      :keys="treeKeys"
      :label="renderTreeLabel"
      activable
      hover
      expand-on-click-node
      :expand-level="2"
      :empty="loading ? '字典加载中...' : '暂无字典数据'"
      @active="onActive"
    />
  </aside>
</template>

<script setup>
import { SearchIcon } from 'tdesign-icons-vue-next';
import { computed, ref } from 'vue';

/**
 * 字典树：负责按编码层级展示字典，并向父组件提交筛选与选中结果。
 *
 * @author wuzm
 */
const props = defineProps({
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  activeDict: { type: Object, default: undefined },
});
const emit = defineEmits(['search', 'select']);

const treeKeys = { label: 'label', value: 'value', children: 'children' };
const query = ref({ codeRLike: undefined, nameLike: '' });

/** 使用树组件的标签渲染函数，确保节点文本与悬浮提示同时稳定输出。 */
const renderTreeLabel = (createElement, node) => {
  const tooltip = node.data?.dict?.desc || node.data?.dict?.name || node.label;
  return createElement('span', { title: tooltip }, node.label);
};

/** 将字典编码的父级片段转换为可筛选的树形下拉选项。 */
const codeGroupTree = computed(() => {
  const root = [];
  const nodeMap = new Map();
  props.data.forEach((dict) => {
    const parts = String(dict.code || '')
      .split('.')
      .filter(Boolean);
    parts.slice(0, -1).forEach((_part, index) => {
      const value = parts.slice(0, index + 1).join('.');
      if (nodeMap.has(value)) return;
      const node = { label: value, value, children: [] };
      nodeMap.set(value, node);
      const parent = index ? nodeMap.get(parts.slice(0, index).join('.')) : undefined;
      (parent?.children || root).push(node);
    });
  });
  return root;
});

/** 按编码父级组织左侧字典树，只有末级字典节点可被选中。 */
const dictTreeData = computed(() => {
  const root = [];
  const nodeMap = new Map();
  props.data.forEach((dict) => {
    const parts = String(dict.code || '')
      .split('.')
      .filter(Boolean);
    const groupParts = parts.slice(0, -1);
    groupParts.forEach((_part, index) => {
      const value = `group:${parts.slice(0, index + 1).join('.')}`;
      if (nodeMap.has(value)) return;
      const node = { label: parts.slice(0, index + 1).join('.'), value, children: [] };
      nodeMap.set(value, node);
      const parent = index ? nodeMap.get(`group:${parts.slice(0, index).join('.')}`) : undefined;
      (parent?.children || root).push(node);
    });
    const parent = groupParts.length ? nodeMap.get(`group:${groupParts.join('.')}`) : undefined;
    (parent?.children || root).push({ label: dict.name, value: dict.id, dict });
  });
  return root;
});

const onSearch = () => {
  // 空目录不提交空字符串，确保服务端按无编码条件查询。
  emit('search', { codeRLike: query.value.codeRLike || undefined, nameLike: query.value.nameLike || undefined });
};
const onActive = (_value, context) => {
  const dict = context.node?.data?.dict;
  if (dict) emit('select', dict);
};
</script>

<style lang="less" scoped>
.dict-tree-panel {
  display: flex;
  flex: 0 0 330px;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-xxl);
}
.dict-search {
  width: 100%;
}
.code-group-select {
  width: 100%;
}
.dict-search-button {
  width: 100%;
  border-radius: 0 var(--td-radius-default) var(--td-radius-default) 0;
}
.dict-search :deep(.t-input-adornment__prepend) {
  flex: 0 0 40%;
}
.dict-search :deep(.t-input-adornment__append) {
  flex: 0 0 52px;
}
.dict-search :deep(.t-input) {
  flex: 1;
  min-width: 0;
}
.dict-tree-panel :deep(.t-tree) {
  flex: 1;
  min-height: 0;
  margin-top: var(--td-comp-margin-xl);
  overflow-y: auto;
}
</style>
