<template>
  <div :class="prefix + '-main-wrapper'">
    <div class="container">
      <t-row class="header" justify="space-between"
        ><t-button @click="openForm()">新增</t-button
        ><t-space
          ><t-input v-model="query.searchKey" placeholder="用户名/昵称/手机号" clearable
            ><template #suffix-icon><search-icon size="16px" /></template></t-input
          ><t-button theme="primary" @click="onSearch">查询</t-button
          ><t-button variant="base" theme="default" @click="onReset">重置</t-button></t-space
        ></t-row
      >
      <div class="body">
        <t-table
          :data="data"
          :columns="columns"
          row-key="id"
          :pagination="pagination"
          :loading="loading"
          @page-change="onPageChange"
          ><template #status="{ row }"
            ><t-tag :theme="row.status === 1 ? 'success' : 'default'" variant="light">{{
              row.status === 1 ? '启用' : '停用'
            }}</t-tag></template
          ><template #op="{ row }"
            ><t-space
              ><t-link theme="primary" @click="openForm(row)">编辑</t-link
              ><t-popconfirm content="确定删除该用户吗？" @confirm="handleDelete(row)"
                ><t-link theme="danger">删除</t-link></t-popconfirm
              ></t-space
            ></template
          ></t-table
        >
      </div>
    </div>
    <t-dialog
      v-model:visible="formVisible"
      :header="formData.id ? '编辑用户' : '新增用户'"
      :footer="false"
      :width="720"
      destroy-on-close
      ><t-form :data="formData" :rules="rules" label-width="100px" @submit="handleSubmit"
        ><t-row :gutter="[16, 0]"
          ><t-col :span="6"
            ><t-form-item label="用户名" name="username"><t-input v-model="formData.username" /></t-form-item></t-col
          ><t-col :span="6"
            ><t-form-item label="昵称" name="nickname"><t-input v-model="formData.nickname" /></t-form-item></t-col
          ><t-col :span="6"
            ><t-form-item label="手机号" name="phone"><t-input v-model="formData.phone" /></t-form-item></t-col
          ><t-col :span="6"
            ><t-form-item label="邮箱" name="email"><t-input v-model="formData.email" /></t-form-item></t-col
          ><t-col :span="6"
            ><t-form-item label="性别" name="gender"
              ><t-select v-model="formData.gender" clearable
                ><t-option label="男" :value="1" /><t-option label="女" :value="2" /></t-select></t-form-item></t-col
          ><t-col :span="6"
            ><t-form-item label="状态" name="status"
              ><t-select v-model="formData.status" clearable
                ><t-option label="启用" :value="1" /><t-option
                  label="停用"
                  :value="0" /></t-select></t-form-item></t-col></t-row
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
import { create, del, pageList, update } from '@base/api/user';
import { prefix } from '@framework/config/global';
import { normalizePage } from '@framework/utils/page';
const columns = [
  { title: '用户名', colKey: 'username', width: 140 },
  { title: '昵称', colKey: 'nickname', width: 140 },
  { title: '手机号', colKey: 'phone', width: 150 },
  { title: '邮箱', colKey: 'email', width: 180 },
  { title: '状态', colKey: 'status', width: 100 },
  { title: '操作', colKey: 'op', fixed: 'right', width: 140 },
];
const rules = { username: [{ required: true, message: '请输入用户名', type: 'error' }] };
const defaultPage = { current: 1, pageSize: 20, total: 0 };
const defaultForm = { username: '', nickname: '', phone: '', email: '', gender: undefined, status: 1 };
const query = ref({ searchKey: '' });
const data = ref([]);
const pagination = ref({ ...defaultPage });
const loading = ref(false);
const formVisible = ref(false);
const formData = ref({ ...defaultForm });
const fetchData = async () => {
  loading.value = true;
  try {
    const { current: page, pageSize: size } = pagination.value;
    const result = normalizePage(await pageList({ username: query.value.searchKey }, { page, size }));
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
const openForm = (row) => {
  formData.value = row ? { ...row } : { ...defaultForm };
  formVisible.value = true;
};
const handleSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return;
  if (formData.value.id) await update(formData.value);
  else await create(formData.value);
  MessagePlugin.success('保存成功');
  formVisible.value = false;
  fetchData();
};
const handleDelete = async (row) => {
  await del(row.id);
  MessagePlugin.success('删除成功');
  fetchData();
};
onMounted(fetchData);
</script>
<style lang="less" scoped>
.container {
  padding: var(--td-comp-paddingTB-xl) var(--td-comp-paddingLR-xl);
}
.header {
  margin-bottom: var(--td-comp-margin-m);
}
</style>
