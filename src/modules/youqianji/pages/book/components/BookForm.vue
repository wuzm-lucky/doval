<template>
  <t-dialog
    v-model:visible="formVisible"
    :header="formData.id ? '编辑账簿' : '新增账簿'"
    :width="680"
    :footer="false"
    destroy-on-close
  >
    <template #body>
      <t-form :data="formData" :rules="rules" :label-width="100" @submit="handleSubmit">
        <t-form-item label="账簿名称" name="name">
          <t-input v-model="formData.name" :maxlength="100" :style="fieldStyle" placeholder="请输入账簿名称" />
        </t-form-item>
        <t-form-item label="默认币种" name="currency">
          <t-select v-model="formData.currency" :options="currencyOptions" :style="fieldStyle" filterable />
        </t-form-item>
        <t-form-item label="账簿封面" name="cover">
          <div class="cover-field">
            <t-upload
              v-model="coverFiles"
              class="cover-upload"
              theme="custom"
              accept="image/*"
              :size-limit="{ size: 2, unit: 'MB', message: '图片大小不超过 {sizeLimit} MB' }"
              :request-method="uploadCover"
              :show-image-file-name="false"
            >
              <button class="cover-preview" type="button" aria-label="上传账簿封面">
                <img v-if="hasCover" :src="coverPreview" alt="账簿封面" @error="coverFailed = true" />
                <span v-else>点击上传封面</span>
              </button>
            </t-upload>
            <span class="cover-tip">支持 JPG、PNG 等图片，大小不超过 2 MB</span>
          </div>
        </t-form-item>
        <t-form-item label="账簿描述" name="desc">
          <t-textarea v-model="formData.desc" :maxlength="1000" :style="fieldStyle" placeholder="请输入账簿描述" />
        </t-form-item>
        <t-form-item class="form-actions">
          <t-button variant="outline" @click="closeForm">取消</t-button>
          <t-button theme="primary" type="submit">保存</t-button>
        </t-form-item>
      </t-form>
    </template>
  </t-dialog>
</template>

<script setup>
import { useDict } from '@framework/store';
import { computed, ref, watch } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';

import { downloadUrl, uploadFile } from '@framework/api/file';

/** 账簿公共资料编辑弹窗。 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  data: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:visible', 'submit']);
const rules = {
  name: [{ required: true, message: '请输入账簿名称', type: 'error' }],
  currency: [{ required: true, message: '请选择默认币种', type: 'error' }],
};
const fieldStyle = { width: '480px' };
// 按需读取共享币种字典，派生展示选项，不修改缓存中的字典项。
const currencyDict = useDict('youqianji.currency');
const currencyOptions = computed(() =>
  currencyDict.options.value.map((item) => ({ ...item, label: `${item.label}（${item.value}）` })),
);
const formVisible = computed({ get: () => props.visible, set: (visible) => emit('update:visible', visible) });
const formData = ref({});
const coverFiles = ref([]);
const coverFailed = ref(false);
const coverPreview = computed(() => {
  const uploadedCover = coverFiles.value[0]?.url || coverFiles.value[0]?.thumb;
  if (uploadedCover) return uploadedCover;
  const cover = formData.value.cover?.trim();
  if (!cover) return '';
  return /^https?:\/\//i.test(cover) ? cover : downloadUrl(cover, 'book-cover.png');
});
const hasCover = computed(() => Boolean(coverPreview.value) && !coverFailed.value);

const closeForm = () => {
  formVisible.value = false;
};
const handleSubmit = ({ validateResult }) => {
  if (validateResult === true) emit('submit', { ...formData.value });
};
const uploadCover = async (file) => {
  if (!file.raw?.type?.startsWith('image/')) {
    MessagePlugin.warning('只能上传图片文件');
    return { status: 'fail' };
  }
  try {
    const uploadedFile = await uploadFile(file.raw, file.name);
    const coverUrl = downloadUrl(uploadedFile.uuid, uploadedFile.name || file.name);
    formData.value.cover = uploadedFile.uuid;
    coverFiles.value = [{ name: uploadedFile.name || file.name, url: coverUrl, status: 'success' }];
    coverFailed.value = false;
    MessagePlugin.success('封面上传成功，点击保存后生效');
    return { status: 'success', response: { url: coverUrl } };
  } catch (error) {
    MessagePlugin.error('封面上传失败，请重试');
    throw error;
  }
};

watch(
  () => props.data,
  (data) => {
    // 使用副本编辑，取消时不改变列表中的原始账簿数据。
    formData.value = { ...data, currency: data.currency || 'CNY' };
    coverFiles.value = [];
    coverFailed.value = false;
  },
  { immediate: true },
);
</script>

<style lang="less" scoped>
.cover-field {
  display: flex;
  align-items: center;
  gap: var(--td-comp-margin-s);
}

.cover-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 86px;
  overflow: hidden;
  border: 0;
  border-radius: var(--td-radius-medium);
  background: var(--td-bg-color-container-hover);
  color: var(--td-text-color-placeholder);
  cursor: pointer;
  font-size: var(--td-font-size-body-small);
  padding: 0;

  &:hover {
    outline: 1px solid var(--td-brand-color);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.cover-tip {
  color: var(--td-text-color-placeholder);
  font-size: var(--td-font-size-body-small);
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
