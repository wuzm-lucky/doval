<template>
  <div :class="prefix + '-main-wrapper'">
    <div class="container">
      <t-row class="header" justify="space-between"
        ><t-button @click="openUpload">上传文件</t-button
        ><t-space
          ><t-input v-model="query.searchKey" placeholder="文件名" clearable
            ><template #suffix-icon><search-icon size="16px" /></template></t-input
          ><t-button theme="primary" @click="onSearch">查询</t-button
          ><t-button theme="default" @click="onReset">重置</t-button></t-space
        ></t-row
      ><t-table
        :data="data"
        :columns="columns"
        row-key="id"
        :pagination="pagination"
        :loading="loading"
        @page-change="onPageChange"
        ><template #size="{ row }">{{ formatSize(row.size) }}</template
        ><template #op="{ row }"
          ><t-link theme="primary" :href="downloadUrl(row.uuid, row.name)" target="_blank">下载</t-link></template
        ></t-table
      >
    </div>
    <t-dialog v-model:visible="uploadVisible" header="上传文件" :footer="false" :width="520" destroy-on-close
      ><t-form label-width="90px" @submit="handleUpload"
        ><t-form-item label="文件名"><t-input v-model="uploadName" placeholder="不填则使用原文件名" /></t-form-item
        ><t-form-item label="文件"><input type="file" @change="handleFileChange" /></t-form-item
        ><t-form-item
          ><t-space
            ><t-button theme="primary" type="submit" :loading="uploading">上传</t-button
            ><t-button theme="default" @click="uploadVisible = false">取消</t-button></t-space
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
import { downloadUrl, pageList, uploadFile } from '@base/api/file';
import { prefix } from '@framework/config/global';
import { normalizePage } from '@framework/utils/page';
const columns = [
  { title: '名称', colKey: 'name', ellipsis: true },
  { title: '后缀', colKey: 'suffix', width: 100 },
  { title: '类型', colKey: 'mime', width: 180 },
  { title: '大小', colKey: 'size', width: 120 },
  { title: '操作', colKey: 'op', fixed: 'right', width: 100 },
];
const defaultPage = { current: 1, pageSize: 20, total: 0 };
const query = ref({ searchKey: '' });
const data = ref([]);
const pagination = ref({ ...defaultPage });
const loading = ref(false);
const uploadVisible = ref(false);
const uploadName = ref('');
const uploadTarget = ref();
const uploading = ref(false);
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
const openUpload = () => {
  uploadName.value = '';
  uploadTarget.value = undefined;
  uploadVisible.value = true;
};
const handleFileChange = (event) => {
  uploadTarget.value = event.target.files?.[0];
};
const handleUpload = async () => {
  if (!uploadTarget.value) {
    MessagePlugin.warning('请选择文件');
    return;
  }
  uploading.value = true;
  try {
    await uploadFile(uploadTarget.value, uploadName.value || uploadTarget.value.name);
    MessagePlugin.success('上传成功');
    uploadVisible.value = false;
    fetchData();
  } finally {
    uploading.value = false;
  }
};
const formatSize = (size) => {
  if (!size) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
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
