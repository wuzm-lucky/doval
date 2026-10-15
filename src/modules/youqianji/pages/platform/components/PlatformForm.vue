<template>
  <t-dialog
    v-model:visible="formVisible"
    :header="formData.id == null ? '新增平台' : '编辑平台'"
    :width="680"
    :footer="false"
    destroy-on-close
    :close-on-overlay-click="false"
    :close-on-esc-keydown="!busy"
    :close-btn="!busy"
    @close="closeForm"
  >
    <template #body>
      <t-form :data="formData" :rules="rules" :label-width="100" :disabled="busy" @submit="handleSubmit">
        <t-form-item label="平台名称" name="name"
          ><t-input v-model="formData.name" :maxlength="100" placeholder="请输入平台名称" :style="fieldStyle"
        /></t-form-item>
        <t-form-item label="平台分类" name="category">
          <t-select
            v-model="formData.category"
            :options="categoryOptions"
            :style="fieldStyle"
            placeholder="请选择平台分类"
          />
        </t-form-item>
        <t-form-item label="平台图标" name="icon">
          <t-select
            v-model="formData.icon"
            clearable
            filterable
            placeholder="请选择图标"
            :style="fieldStyle"
            :popup-props="{
              overlayClassName: 'platform-icon-select-popup',
              overlayInnerClassName: 'platform-icon-select-content',
              overlayInnerStyle: { width: '480px' },
            }"
            @search="searchIcons"
            @popup-visible-change="handleIconPopupVisibleChange"
          >
            <t-option
              v-for="item in iconOptions"
              :key="item.stem"
              :value="item.stem"
              :label="item.stem"
              class="overlay-options"
            >
              <t-icon :name="item.stem" />
            </t-option>
            <template #valueDisplay>
              <t-icon v-if="formData.icon" :name="formData.icon" :style="{ marginRight: '8px' }" />{{ formData.icon }}
            </template>
          </t-select>
        </t-form-item>
        <t-form-item label="描述" name="desc">
          <t-textarea
            v-model="formData.desc"
            :maxlength="500"
            :style="fieldStyle"
            placeholder="请输入平台描述（选填）"
          />
        </t-form-item>
        <t-form-item class="form-actions"
          ><t-button theme="default" :disabled="busy" @click="closeForm">取消</t-button
          ><t-button type="submit" :loading="busy">保存</t-button></t-form-item
        >
      </t-form>
    </template>
  </t-dialog>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useDict } from '@framework/store';
import { manifest } from 'tdesign-icons-vue-next';

/** 平台新增、编辑表单，接口提交由父页面处理。 @author wuzm */
const props = defineProps({
  visible: { type: Boolean, default: false },
  data: { type: Object, default: () => ({}) },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['update:visible', 'submit']);
const formVisible = computed({
  get: () => props.visible,
  set: (visible) => {
    if (!props.busy) emit('update:visible', visible);
  },
});
const formData = ref({});
// 分类选项沿用服务端字典，不在页面维护常量标签。
const categoryDict = useDict('youqianji.platformcategory');
const categoryOptions = categoryDict.options;
const fieldStyle = { width: '480px' };
const ICON_BATCH_SIZE = 120;
const iconKeyword = ref('');
const iconRenderLimit = ref(ICON_BATCH_SIZE);
let iconPopupContent;
const matchedIconOptions = computed(() => {
  const keyword = iconKeyword.value.trim().toLowerCase();
  return keyword ? manifest.filter((item) => item.stem.toLowerCase().includes(keyword)) : manifest;
});
const iconOptions = computed(() => {
  const visibleOptions = matchedIconOptions.value.slice(0, iconRenderLimit.value);
  const selectedIcon = manifest.find((item) => item.stem === formData.value.icon);
  if (selectedIcon && !visibleOptions.some((item) => item.stem === selectedIcon.stem))
    visibleOptions.unshift(selectedIcon);
  return visibleOptions;
});
/**
 * 根据输入内容筛选图标，限制渲染数量以避免展开下拉框时创建大量节点。
 *
 * @author wuzm
 */
const searchIcons = (keyword) => {
  iconKeyword.value = keyword;
  iconRenderLimit.value = ICON_BATCH_SIZE;
};

/**
 * 图标下拉层滚动到底部时分批加载，避免首次展开创建完整图标清单的节点。
 *
 * @author wuzm
 */
const loadMoreIcons = () => {
  if (!iconPopupContent || iconRenderLimit.value >= matchedIconOptions.value.length) return;
  const { scrollTop, clientHeight, scrollHeight } = iconPopupContent;
  if (scrollTop + clientHeight >= scrollHeight - 48) iconRenderLimit.value += ICON_BATCH_SIZE;
};

/** 移除下拉层滚动监听，避免关闭后保留引用。 @author wuzm */
const removeIconScrollListener = () => {
  if (iconPopupContent) iconPopupContent.removeEventListener('scroll', loadMoreIcons);
  iconPopupContent = undefined;
};

/** 展开时绑定分批加载，关闭时还原图标筛选。 @author wuzm */
const handleIconPopupVisibleChange = (visible) => {
  if (visible) {
    nextTick(() => {
      if (!props.visible) return;
      removeIconScrollListener();
      iconPopupContent = document.querySelector('.platform-icon-select-popup .platform-icon-select-content');
      iconPopupContent?.addEventListener('scroll', loadMoreIcons);
    });
    return;
  }
  removeIconScrollListener();
  iconKeyword.value = '';
  iconRenderLimit.value = ICON_BATCH_SIZE;
};

onBeforeUnmount(removeIconScrollListener);

watch(
  () => props.visible,
  (visible) => {
    if (!visible) handleIconPopupVisibleChange(false);
  },
);

const rules = {
  name: [{ validator: (value) => !!value?.trim(), message: '请输入平台名称', type: 'error' }],
  category: [{ required: true, message: '请选择平台分类', type: 'error' }],
};

/** 保存期间禁止关闭，保留正在提交的表单内容。 @author wuzm */
const closeForm = () => {
  formVisible.value = false;
};

/** 校验通过后提交副本，父页面负责字段整理和持久化。 @author wuzm */
const handleSubmit = ({ validateResult }) => {
  if (validateResult === true) emit('submit', { ...formData.value });
};

watch(
  () => props.data,
  (data) => {
    // 独立副本用于编辑，取消时不会修改父页面或列表数据。
    formData.value = { ...data, category: data.category || 'OTHER' };
  },
  { immediate: true },
);
</script>

<style lang="less" scoped>
.form-actions {
  margin-bottom: 0;
  :deep(.t-form__controls) {
    display: flex;
    justify-content: flex-end;
    gap: var(--td-comp-margin-s);
  }
}

:global(.platform-icon-select-popup .t-select__list) {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
}

:global(.platform-icon-select-popup .t-select-option) {
  display: flex;
  width: 36px;
  min-height: 36px;
  padding: 8px;
  justify-content: center;
  font-size: 20px;
}

:global(.platform-icon-select-popup .t-select-option + .t-select-option) {
  margin-top: 0;
}
</style>
