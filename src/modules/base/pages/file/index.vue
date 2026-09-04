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
        ><template #name="{ row }"
          ><t-space align="center" size="small" class="file-name"
            ><component :is="getFileIcon(row)" size="18px" /><span class="file-name-text">{{ row.name }}</span></t-space
          ></template
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
import {
  FileCodeIcon,
  FileCsvIcon,
  FileExcelIcon,
  FileIcon,
  FileImageIcon,
  FileJsonIcon,
  FileMarkdownIcon,
  FileMusicIcon,
  FilePdfIcon,
  FilePowerpointIcon,
  FileTxtIcon,
  FileWordIcon,
  FileYamlIcon,
  FileZipIcon,
  SearchIcon,
} from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';
import { downloadUrl, pageList, uploadFile } from '@base/api/file';
import { prefix } from '@framework/config/global';
import { normalizePage } from '@framework/utils/page';
const columns = [
  { title: 'UUID', colKey: 'uuid', width: '20%', ellipsis: true },
  { title: '名称', colKey: 'name', width: '20%', ellipsis: true },
  { title: '后缀', colKey: 'suffix', width: '10%', ellipsis: true },
  { title: '类型', colKey: 'mime', width: '15%', ellipsis: true },
  { title: '创建时间', colKey: 'createTime', width: '15%', ellipsis: true },
  { title: '大小', colKey: 'size', width: '10%' },
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
const fileIconBySuffix = {
  doc: FileWordIcon,
  docx: FileWordIcon,
  xls: FileExcelIcon,
  xlsx: FileExcelIcon,
  csv: FileCsvIcon,
  ppt: FilePowerpointIcon,
  pptx: FilePowerpointIcon,
  pdf: FilePdfIcon,
  zip: FileZipIcon,
  rar: FileZipIcon,
  '7z': FileZipIcon,
  tar: FileZipIcon,
  gz: FileZipIcon,
  jpg: FileImageIcon,
  jpeg: FileImageIcon,
  png: FileImageIcon,
  gif: FileImageIcon,
  webp: FileImageIcon,
  svg: FileImageIcon,
  bmp: FileImageIcon,
  mp3: FileMusicIcon,
  wav: FileMusicIcon,
  flac: FileMusicIcon,
  aac: FileMusicIcon,
  ogg: FileMusicIcon,
  js: FileCodeIcon,
  ts: FileCodeIcon,
  vue: FileCodeIcon,
  html: FileCodeIcon,
  css: FileCodeIcon,
  less: FileCodeIcon,
  scss: FileCodeIcon,
  java: FileCodeIcon,
  py: FileCodeIcon,
  json: FileJsonIcon,
  yaml: FileYamlIcon,
  yml: FileYamlIcon,
  md: FileMarkdownIcon,
  txt: FileTxtIcon,
};
const getFileIcon = (row) => {
  const suffix = (row.suffix || row.name?.split('.').pop() || '').replace(/^\./, '').toLowerCase();
  return fileIconBySuffix[suffix] || FileIcon;
};
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
.file-name {
  max-width: 100%;
}
.file-name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
