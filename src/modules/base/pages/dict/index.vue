<template>
  <div :class="prefix + '-main-wrapper'">
    <div class="container">
      <t-row class="header" justify="space-between">
        <t-button @click="openDictForm()">新增</t-button>
        <t-space>
          <t-input v-model="query.searchKey" placeholder="名称/编码" clearable
            ><template #suffix-icon><search-icon size="16px" /></template
          ></t-input>
          <t-button theme="primary" @click="onSearch">查询</t-button
          ><t-button theme="default" @click="onReset">重置</t-button>
        </t-space>
      </t-row>
      <t-table
        :data="data"
        :columns="dictColumns"
        row-key="id"
        :pagination="pagination"
        :loading="loading"
        @page-change="onPageChange"
      >
        <template #digit="{ row }"
          ><t-tag variant="light">{{ row.digit ? '是' : '否' }}</t-tag></template
        >
        <template #op="{ row }"
          ><t-space
            ><t-link theme="primary" @click="openItems(row)">字典项</t-link
            ><t-link theme="primary" @click="openDictForm(row)">编辑</t-link
            ><t-popconfirm content="确定删除该字典吗？" @confirm="handleDeleteDict(row)"
              ><t-link theme="danger">删除</t-link></t-popconfirm
            ></t-space
          ></template
        >
      </t-table>
    </div>
    <t-dialog
      v-model:visible="dictFormVisible"
      :header="dictForm.id ? '编辑字典' : '新增字典'"
      :footer="false"
      :width="620"
      destroy-on-close
    >
      <t-form :data="dictForm" :rules="dictRules" label-width="90px" @submit="handleSubmitDict">
        <t-form-item label="名称" name="name"><t-input v-model="dictForm.name" /></t-form-item
        ><t-form-item label="编码" name="code"><t-input v-model="dictForm.code" /></t-form-item
        ><t-form-item label="描述" name="desc"><t-textarea v-model="dictForm.desc" /></t-form-item
        ><t-form-item label="是否数字" name="digit"><t-switch v-model="dictForm.digit" /></t-form-item>
        <t-form-item
          ><t-space
            ><t-button theme="primary" type="submit">保存</t-button
            ><t-button theme="default" @click="dictFormVisible = false">取消</t-button></t-space
          ></t-form-item
        >
      </t-form>
    </t-dialog>
    <t-drawer
      v-model:visible="itemDrawerVisible"
      :header="`${activeDict?.name || ''} 字典项`"
      size="720px"
      destroy-on-close
    >
      <t-row class="header" justify="space-between"><t-button @click="openItemForm()">新增字典项</t-button></t-row>
      <t-table :data="itemData" :columns="itemColumns" row-key="id"
        ><template #op="{ row }"
          ><t-space
            ><t-link theme="primary" @click="openItemForm(row)">编辑</t-link
            ><t-popconfirm content="确定删除该字典项吗？" @confirm="handleDeleteItem(row)"
              ><t-link theme="danger">删除</t-link></t-popconfirm
            ></t-space
          ></template
        ></t-table
      >
      <t-dialog
        v-model:visible="itemFormVisible"
        :header="itemForm.id ? '编辑字典项' : '新增字典项'"
        :footer="false"
        :width="520"
        destroy-on-close
      >
        <t-form :data="itemForm" :rules="itemRules" label-width="90px" @submit="handleSubmitItem"
          ><t-form-item label="标签" name="label"><t-input v-model="itemForm.label" /></t-form-item
          ><t-form-item label="值" name="value"><t-input v-model="itemForm.value" /></t-form-item
          ><t-form-item label="排序" name="sort"><t-input-number v-model="itemForm.sort" /></t-form-item
          ><t-form-item
            ><t-space
              ><t-button theme="primary" type="submit">保存</t-button
              ><t-button theme="default" @click="itemFormVisible = false">取消</t-button></t-space
            ></t-form-item
          ></t-form
        >
      </t-dialog>
    </t-drawer>
  </div>
</template>
<script setup>
import { SearchIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { create, createItem, del, delItem, listItems, pageList, update, updateItem } from '@base/api/dict';
import { prefix } from '@framework/config/global';
import { normalizePage } from '@framework/utils/page';

const dictColumns = [
  { title: '名称', colKey: 'name', width: 160 },
  { title: '编码', colKey: 'code', width: 160 },
  { title: '描述', colKey: 'desc', ellipsis: true },
  { title: '是否数字', colKey: 'digit', width: 100 },
  { title: '排序', colKey: 'sort', width: 100 },
  { title: '操作', colKey: 'op', fixed: 'right', width: 220 },
];
const itemColumns = [
  { title: '标签', colKey: 'label', width: 160 },
  { title: '值', colKey: 'value', width: 160 },
  { title: '排序', colKey: 'sort', width: 100 },
  { title: '操作', colKey: 'op', fixed: 'right', width: 140 },
];
const dictRules = {
  name: [{ required: true, message: '请输入名称', type: 'error' }],
  code: [{ required: true, message: '请输入编码', type: 'error' }],
};
const itemRules = {
  label: [{ required: true, message: '请输入标签', type: 'error' }],
  value: [{ required: true, message: '请输入值', type: 'error' }],
};
const defaultPage = { current: 1, pageSize: 20, total: 0 };
const defaultDictForm = { name: '', code: '', desc: '', digit: false };
const defaultItemForm = { label: '', value: '', sort: 0 };
const query = ref({ searchKey: '' });
const data = ref([]);
const pagination = ref({ ...defaultPage });
const loading = ref(false);
const dictFormVisible = ref(false);
const dictForm = ref({ ...defaultDictForm });
const itemDrawerVisible = ref(false);
const itemFormVisible = ref(false);
const activeDict = ref();
const itemData = ref([]);
const itemForm = ref({ ...defaultItemForm });
const fetchData = async () => {
  loading.value = true;
  try {
    const { current: page, pageSize: size } = pagination.value;
    const result = normalizePage(await pageList({ searchKey: query.value.searchKey, page, size }));
    data.value = result.rows;
    pagination.value = { ...pagination.value, total: result.total };
  } finally {
    loading.value = false;
  }
};
const fetchItems = async () => {
  itemData.value = await listItems({ dictId: activeDict.value.id });
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
const openDictForm = (row) => {
  dictForm.value = row ? { ...row } : { ...defaultDictForm };
  dictFormVisible.value = true;
};
const handleSubmitDict = async ({ validateResult }) => {
  if (validateResult !== true) return;
  if (dictForm.value.id) await update(dictForm.value);
  else await create(dictForm.value);
  MessagePlugin.success('保存成功');
  dictFormVisible.value = false;
  fetchData();
};
const handleDeleteDict = async (row) => {
  await del(row.id);
  MessagePlugin.success('删除成功');
  fetchData();
};
const openItems = async (row) => {
  activeDict.value = row;
  itemDrawerVisible.value = true;
  await fetchItems();
};
const openItemForm = (row) => {
  itemForm.value = row ? { ...row } : { ...defaultItemForm, dictId: activeDict.value.id };
  itemFormVisible.value = true;
};
const handleSubmitItem = async ({ validateResult }) => {
  if (validateResult !== true) return;
  const payload = { ...itemForm.value, dictId: activeDict.value.id };
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
