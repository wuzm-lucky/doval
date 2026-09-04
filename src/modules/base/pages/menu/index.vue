<template>
  <div :class="prefix + '-main-wrapper'">
    <div ref="containerRef" class="container">
      <t-row class="header" justify="space-between"
        ><t-button @click="openForm()">新增</t-button
        ><t-space
          ><t-input v-model="query.searchKey" placeholder="名称/标题/地址" clearable
            ><template #suffix-icon><search-icon size="16px" /></template></t-input
          ><t-button theme="primary" @click="onSearch">查询</t-button
          ><t-button theme="default" @click="onReset">重置</t-button></t-space
        ></t-row
      ><t-enhanced-table
        ref="tableRef"
        :max-height="tableMaxHeight || undefined"
        :data="data"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        :tree="treeConfig"
        @page-change="onPageChange"
        ><template #menuTitle="{ row }">{{ getMenuTitle(row.title) }}</template
        ><template #icon="{ row }"
          ><t-tooltip v-if="row.icon" :content="row.icon"><t-icon :name="row.icon" size="18px" /></t-tooltip></template
        ><template #op="{ row }"
          ><t-space
            ><t-link theme="primary" @click="openChildForm(row)">添加子菜单</t-link
            ><t-link theme="primary" @click="openForm(row)">编辑</t-link
            ><t-popconfirm content="确定删除该菜单吗？" @confirm="handleDelete(row)"
              ><t-link theme="danger">删除</t-link></t-popconfirm
            ></t-space
          ></template
        ></t-enhanced-table
      >
    </div>
    <menu-form v-model:visible="formVisible" :data="formData" :menu-tree="menuTree" @submit="handleSubmit" />
  </div>
</template>
<script setup>
import { SearchIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { create, del, listTopTowLevel, pageList, update } from '@base/api/menu';
import { prefix } from '@framework/config/global';
import { useLocale } from '@framework/locales/useLocale';
import { normalizePage } from '@framework/utils/page';
import MenuForm from './components/MenuForm.vue';
const columns = [
  { title: '名称', colKey: 'name', width: '15%', ellipsis: true },
  { title: '标题', colKey: 'menuTitle', width: '20%', ellipsis: true },
  { title: '地址', colKey: 'path', width: '40%', ellipsis: true },
  { title: '图标', colKey: 'icon', width: '10%' },
  { title: '操作', colKey: 'op', fixed: 'right', width: 220 },
];
const { locale } = useLocale();
const treeConfig = { childrenKey: 'children', defaultExpandAll: false, treeNodeColumnIndex: 0 };
const defaultPage = { current: 1, pageSize: 20, total: 0 };
const defaultForm = { name: '', title: {}, pid: undefined, icon: '', path: '' };
const query = ref({ searchKey: '' });
const data = ref([]);
const menuTree = ref([]);
const pagination = ref({ ...defaultPage });
const loading = ref(false);
const formVisible = ref(false);
const formData = ref({ ...defaultForm });
const containerRef = ref();
const tableRef = ref();
const tableMaxHeight = ref(0);
let containerResizeObserver;

/** 根据表格距视口底部的可用空间设置最大高度，使超长数据在表体内滚动。 */
const updateTableMaxHeight = () => {
  const tableElement = tableRef.value?.$el;
  if (!tableElement) return;
  const tableTop = tableElement.getBoundingClientRect().top;
  tableMaxHeight.value = Math.max(window.innerHeight - tableTop - 24, 240);
};
/**
 * 根据当前语言读取菜单标题，缺少对应翻译时统一回退中文标题。
 *
 * @author wuzm
 */
const getMenuTitle = (title) => {
  if (typeof title === 'string') return title;
  return title?.[locale.value] || title?.zh_CN || '';
};
const fetchTree = async () => {
  menuTree.value = await listTopTowLevel();
};
const fetchData = async () => {
  loading.value = true;
  try {
    const { current: page, pageSize: size } = pagination.value;
    const result = normalizePage(await pageList({ searchKey: query.value.searchKey }, { page, size }));
    data.value = result.rows;
    pagination.value = { ...pagination.value, total: result.total };
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
  await fetchTree();
  formData.value = row ? { ...row, pid: row.pid === 0 ? undefined : row.pid } : { ...defaultForm };
  formVisible.value = true;
};
const openChildForm = async (row) => {
  await fetchTree();
  formData.value = { ...defaultForm, pid: row.id };
  formVisible.value = true;
};
const handleSubmit = async (form) => {
  // 按 MenuDto 组装提交数据，避免将列表树的 children、索引等展示字段提交到服务端。@author wuzm
  const payload = {
    name: form.name,
    pid: form.pid,
    icon: form.icon,
    path: form.path,
    title: form.title,
  };
  if (form.id) payload.id = form.id;
  if (!payload.pid) delete payload.pid;
  if (payload.id) await update(payload);
  else await create(payload);
  MessagePlugin.success('保存成功');
  formVisible.value = false;
  fetchData();
  fetchTree();
};
const handleDelete = async (row) => {
  await del(row.id);
  MessagePlugin.success('删除成功');
  fetchData();
  fetchTree();
};
onMounted(() => {
  fetchData();
  fetchTree();
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
</style>
