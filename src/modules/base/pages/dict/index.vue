<template>
  <div :class="prefix + '-main-wrapper'">
    <div class="dict-container">
      <dict-tree
        :data="dictData"
        :loading="dictLoading"
        :active-dict="activeDict"
        @search="fetchDicts"
        @select="selectDict"
      />
      <dict-item-table
        :active-dict="activeDict"
        :data="itemData"
        :pagination="itemPagination"
        :loading="itemLoading"
        @add="openItemForm()"
        @edit="openItemForm"
        @delete="handleDeleteItem"
        @search="searchItems"
        @page-change="onItemPageChange"
      />
    </div>
    <dict-item-form v-model:visible="itemFormVisible" :data="itemForm" @submit="handleSubmitItem" />
  </div>
</template>

<script setup>
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import { createItem, delItem, list, pageListItems, updateItem } from '@base/api/dict';
import { prefix } from '@framework/config/global';
import { normalizePage } from '@framework/utils/page';

import DictItemForm from './components/DictItemForm.vue';
import DictItemTable from './components/DictItemTable.vue';
import DictTree from './components/DictTree.vue';

const defaultPage = { current: 1, pageSize: 20, total: 0 };
const defaultItemForm = { code: '', label: '', value: '', group: '', sort: 0 };
const dictData = ref([]);
const dictLoading = ref(false);
const activeDict = ref();
const itemQuery = ref({ nameLike: '' });
const itemData = ref([]);
const itemPagination = ref({ ...defaultPage });
const itemLoading = ref(false);
const itemFormVisible = ref(false);
const itemForm = ref({ ...defaultItemForm });

/** 根据左侧筛选条件加载字典，并优先保留当前选中的字典。 */
const fetchDicts = async (query = {}) => {
  dictLoading.value = true;
  try {
    const selectedId = activeDict.value?.id;
    dictData.value = (await list(query)) || [];
    activeDict.value = dictData.value.find((item) => item.id === selectedId) || dictData.value[0];
    itemQuery.value = { nameLike: '' };
    itemPagination.value = { ...defaultPage };
    await fetchItems();
  } finally {
    dictLoading.value = false;
  }
};

/** 按当前字典和分页条件查询字典项。 */
const fetchItems = async () => {
  if (!activeDict.value) {
    itemData.value = [];
    itemPagination.value = { ...defaultPage };
    return;
  }
  itemLoading.value = true;
  try {
    const { current: page, pageSize: size } = itemPagination.value;
    const result = normalizePage(
      await pageListItems(
        { dictId: activeDict.value.id, nameLike: itemQuery.value.nameLike || undefined },
        { page, size },
      ),
    );
    itemData.value = result.rows;
    itemPagination.value = { ...itemPagination.value, total: result.total };
  } finally {
    itemLoading.value = false;
  }
};

const selectDict = (dict) => {
  activeDict.value = dict;
  itemQuery.value = { nameLike: '' };
  itemPagination.value = { ...defaultPage };
  fetchItems();
};
const searchItems = (nameLike) => {
  itemQuery.value = { nameLike };
  itemPagination.value = { ...defaultPage };
  fetchItems();
};
const onItemPageChange = (pageInfo) => {
  itemPagination.value = { ...itemPagination.value, current: pageInfo.current, pageSize: pageInfo.pageSize };
  fetchItems();
};
const openItemForm = (row) => {
  itemForm.value = row ? { ...row } : { ...defaultItemForm, dictId: activeDict.value.id };
  itemFormVisible.value = true;
};
const handleSubmitItem = async (form) => {
  const payload = { ...form, dictId: activeDict.value.id };
  if (payload.id) await updateItem(payload);
  else await createItem(payload);
  MessagePlugin.success('保存成功');
  itemFormVisible.value = false;
  fetchItems();
};
const handleDeleteItem = async (row) => {
  await delItem(row.id);
  MessagePlugin.success('删除成功');
  fetchItems();
};

onMounted(fetchDicts);
</script>

<style lang="less" scoped>
.dict-container {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
  background-color: var(--td-bg-color-container);
  border-radius: var(--td-radius-medium);
}
</style>
