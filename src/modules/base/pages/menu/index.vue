<template>
  <div :class="prefix + '-main-wrapper'">
    <div class="container">
      <t-row class="header" justify="space-between"
        ><t-button @click="openForm()">新增</t-button
        ><t-space
          ><t-input v-model="query.searchKey" placeholder="名称/标题/地址" clearable
            ><template #suffix-icon><search-icon size="16px" /></template></t-input
          ><t-button theme="primary" @click="onSearch">查询</t-button
          ><t-button theme="default" @click="onReset">重置</t-button></t-space
        ></t-row
      ><t-enhanced-table
        :data="data"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        :tree="treeConfig"
        @page-change="onPageChange"
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
    <t-dialog
      v-model:visible="formVisible"
      :header="formData.id ? '编辑菜单' : '新增菜单'"
      :footer="false"
      :width="720"
      destroy-on-close
      ><t-form :data="formData" :rules="rules" label-width="100px" @submit="handleSubmit"
        ><t-row :gutter="[16, 0]"
          ><t-col :span="6"
            ><t-form-item label="名称" name="name"><t-input v-model="formData.name" /></t-form-item></t-col
          ><t-col :span="6"
            ><t-form-item label="标题" name="title"><t-input v-model="formData.title" /></t-form-item></t-col
          ><t-col :span="6"
            ><t-form-item label="父级菜单" name="pid"
              ><t-tree-select
                v-model="formData.pid"
                :data="menuTree"
                clearable
                :keys="{ label: 'title', value: 'id', children: 'children' }" /></t-form-item></t-col
          ><t-col :span="6"
            ><t-form-item label="图标" name="icon"><t-input v-model="formData.icon" /></t-form-item></t-col
          ><t-col :span="6"
            ><t-form-item label="组件类型" name="component"
              ><t-select v-model="formData.component"
                ><t-option label="Layout" value="Layout" /><t-option
                  label="IFrame"
                  value="IFrame" /></t-select></t-form-item></t-col
          ><t-col :span="6"
            ><t-form-item label="组件地址" name="uri"><t-input v-model="formData.uri" /></t-form-item></t-col></t-row
        ><t-form-item
          ><t-space
            ><t-button theme="primary" type="submit">保存</t-button
            ><t-button theme="default" @click="formVisible = false">取消</t-button></t-space
          ></t-form-item
        ></t-form
      ></t-dialog
    >
  </div>
</template>
<script setup>
import { SearchIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { create, del, pageList, treeList, update } from '@base/api/menu';
import { prefix } from '@framework/config/global';
import { normalizePage } from '@framework/utils/page';
const columns = [
  { title: '名称', colKey: 'name', width: 160 },
  { title: '标题', colKey: 'title', width: 180 },
  { title: '父级', colKey: 'pid', width: 100 },
  { title: '组件类型', colKey: 'component', width: 120 },
  { title: '组件地址', colKey: 'uri', ellipsis: true },
  { title: '图标', colKey: 'icon', width: 120 },
  { title: '操作', colKey: 'op', fixed: 'right', width: 220 },
];
const treeConfig = { childrenKey: 'children', defaultExpandAll: false, treeNodeColumnIndex: 0 };
const rules = {
  name: [{ required: true, message: '请输入名称', type: 'error' }],
  component: [{ required: true, message: '请选择组件类型', type: 'error' }],
  uri: [{ required: true, message: '请输入组件地址', type: 'error' }],
};
const defaultPage = { current: 1, pageSize: 20, total: 0 };
const defaultForm = { name: '', title: '', pid: undefined, icon: '', component: 'Layout', uri: '' };
const query = ref({ searchKey: '' });
const data = ref([]);
const menuTree = ref([]);
const pagination = ref({ ...defaultPage });
const loading = ref(false);
const formVisible = ref(false);
const formData = ref({ ...defaultForm });
const fetchTree = async () => {
  menuTree.value = await treeList();
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
const handleSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return;
  const payload = { ...formData.value };
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
});
</script>
<style lang="less" scoped>
.container {
  padding: var(--td-comp-paddingTB-xl) var(--td-comp-paddingLR-xl);
}
.header {
  margin-bottom: var(--td-comp-margin-m);
}
</style>
