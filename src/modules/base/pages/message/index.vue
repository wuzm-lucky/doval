<template>
  <div :class="prefix + '-main-wrapper'">
    <div ref="containerRef" class="container">
      <t-row class="header" justify="space-between">
        <t-button @click="openCreate">发布消息</t-button>
        <t-space>
          <t-select v-model="query.type" clearable placeholder="消息类型" :options="typeOptions" />
          <t-input v-model="query.titleLike" clearable placeholder="消息标题">
            <template #suffix-icon><search-icon size="16px" /></template>
          </t-input>
          <t-button theme="primary" @click="onSearch">查询</t-button>
          <t-button theme="default" @click="onReset">重置</t-button>
        </t-space>
      </t-row>
      <t-table
        ref="tableRef"
        :max-height="tableMaxHeight || undefined"
        :data="data"
        :columns="columns"
        row-key="id"
        :pagination="pagination"
        :loading="loading"
        @page-change="onPageChange"
      >
        <template #type="{ row }"
          ><t-tag variant="light">{{ getTypeLabel(row.type) }}</t-tag></template
        >
        <template #op="{ row }">
          <t-space size="small">
            <t-link theme="primary" @click="openEdit(row)">编辑</t-link>
            <t-popconfirm content="确定删除该消息吗？" @confirm="handleDelete(row)">
              <t-link theme="danger">删除</t-link>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>
    </div>
    <t-dialog
      v-model:visible="formVisible"
      :header="form.id ? '编辑消息' : '发布消息'"
      :footer="false"
      :width="680"
      destroy-on-close
    >
      <template #body>
        <t-form :data="form" :rules="rules" :label-width="100" @submit="handleSubmit">
          <t-form-item label="消息类型" name="type">
            <t-select
              v-model="form.type"
              :options="typeOptions"
              :style="fieldStyle"
              :disabled="Boolean(form.id)"
              @change="handleTypeChange"
            />
          </t-form-item>
          <t-form-item label="消息标题" name="title"><t-input v-model="form.title" :style="fieldStyle" /></t-form-item>
          <t-form-item label="消息摘要" name="summary"
            ><t-textarea v-model="form.summary" :style="fieldStyle" :maxlength="500"
          /></t-form-item>
          <t-form-item label="消息正文" name="content"
            ><t-textarea v-model="form.content" :style="fieldStyle" :maxlength="65535"
          /></t-form-item>
          <t-form-item v-if="!form.id && form.type !== 'ANNOUNCEMENT'" label="接收用户" name="receiverIds">
            <t-select
              v-model="form.receiverIds"
              multiple
              filterable
              :options="userOptions"
              :style="fieldStyle"
              placeholder="请选择接收用户"
            />
          </t-form-item>
          <t-form-item class="form-actions">
            <t-button variant="outline" @click="formVisible = false">取消</t-button>
            <t-button theme="primary" type="submit" :loading="submitting">{{ form.id ? '保存' : '发布' }}</t-button>
          </t-form-item>
        </t-form>
      </template>
    </t-dialog>
  </div>
</template>

<script setup>
import { SearchIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { createMessage, deleteMessage, getMessage, managePageList, updateMessage } from '@base/api/message';
import { prefix } from '@framework/config/global';
import { normalizePage } from '@framework/utils/page';
import { list as listUsers } from '@base/api/user';

const columns = [
  { title: '类型', colKey: 'type', width: 110 },
  { title: '标题', colKey: 'title', width: '27%', ellipsis: true },
  { title: '摘要', colKey: 'summary', width: '31%', ellipsis: true },
  { title: '发送人', colKey: 'sender', width: '14%', ellipsis: true },
  { title: '创建时间', colKey: 'createTime', width: 180, ellipsis: true },
  { title: '操作', colKey: 'op', fixed: 'right', width: 140 },
];
const typeOptions = [
  { label: '系统公告', value: 'ANNOUNCEMENT' },
  { label: '提醒', value: 'REMINDER' },
  { label: '消息', value: 'MESSAGE' },
];
const typeLabels = Object.fromEntries(typeOptions.map((item) => [item.value, item.label]));
const defaultPage = { current: 1, pageSize: 20, total: 0 };
const defaultForm = () => ({ type: 'ANNOUNCEMENT', title: '', summary: '', content: '', receiverIds: [] });
const rules = {
  type: [{ required: true, message: '请选择消息类型', type: 'error' }],
  title: [{ required: true, message: '请输入消息标题', type: 'error' }],
  content: [{ required: true, message: '请输入消息正文', type: 'error' }],
  receiverIds: [{ required: true, message: '请选择接收用户', type: 'error' }],
};
const fieldStyle = { width: '480px' };
const query = ref({ type: undefined, titleLike: '' });
const data = ref([]);
const pagination = ref({ ...defaultPage });
const loading = ref(false);
const formVisible = ref(false);
const form = ref(defaultForm());
const userOptions = ref([]);
const submitting = ref(false);
const containerRef = ref();
const tableRef = ref();
const tableMaxHeight = ref(0);
let containerResizeObserver;

const getTypeLabel = (type) => typeLabels[type] || type || '消息';

/** 根据表格距视口底部的可用空间设置最大高度，使超长数据在表体内滚动。 */
const updateTableMaxHeight = () => {
  const tableElement = tableRef.value?.$el;
  if (!tableElement) return;
  tableMaxHeight.value = Math.max(window.innerHeight - tableElement.getBoundingClientRect().top - 24, 240);
};

const fetchData = async () => {
  loading.value = true;
  try {
    const { current: page, pageSize: size } = pagination.value;
    const result = normalizePage(
      await managePageList({ ...query.value, titleLike: query.value.titleLike.trim() }, { page, size }),
    );
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
  query.value = { type: undefined, titleLike: '' };
  onSearch();
};

/** 加载接收人候选项，系统公告不需要选择接收用户。 */
const loadUsers = async () => {
  const users = await listUsers({});
  userOptions.value = users.map((user) => ({ label: user.nickname || user.username, value: user.id }));
};

const openCreate = async () => {
  form.value = defaultForm();
  if (!userOptions.value.length) await loadUsers();
  formVisible.value = true;
};

/** 先查询管理端详情，确保编辑时能回填服务端返回的完整富文本正文。 */
const openEdit = async (row) => {
  const message = await getMessage(row.id);
  form.value = {
    id: message.id,
    type: message.type,
    title: message.title,
    summary: message.summary || '',
    content: message.content || '',
    receiverIds: [],
  };
  formVisible.value = true;
};

const handleTypeChange = () => {
  if (form.value.type === 'ANNOUNCEMENT') form.value.receiverIds = [];
};

/** 删除当前页最后一条消息时回退至上一页，避免展示空分页。 */
const handleDelete = async (row) => {
  await deleteMessage(row.id);
  if (data.value.length === 1 && pagination.value.current > 1) pagination.value.current -= 1;
  MessagePlugin.success('删除成功');
  await fetchData();
};

const handleSubmit = async ({ validateResult }) => {
  if (validateResult !== true) return;
  submitting.value = true;
  try {
    if (form.value.id) {
      await updateMessage({
        id: form.value.id,
        title: form.value.title,
        summary: form.value.summary,
        content: form.value.content,
      });
      MessagePlugin.success('保存成功');
    } else {
      await createMessage({
        ...form.value,
        receiverIds: form.value.type === 'ANNOUNCEMENT' ? [] : form.value.receiverIds,
      });
      MessagePlugin.success('发布成功');
    }
    formVisible.value = false;
    fetchData();
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  fetchData();
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0;

  :deep(.t-form__controls) {
    display: flex;
    gap: var(--td-comp-margin-s);
  }
}
</style>
