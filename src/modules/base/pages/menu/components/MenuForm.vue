<template>
  <t-dialog
    v-model:visible="formVisible"
    :header="formData.id ? '编辑菜单' : '新增菜单'"
    :width="680"
    :footer="false"
    destroy-on-close
  >
    <template #body>
      <t-form :data="formData" :rules="rules" :label-width="100" @submit="handleSubmit">
        <t-form-item label="名称" name="name">
          <t-input v-model="formData.name" :style="fieldStyle" />
        </t-form-item>
        <t-form-item label="标题" name="title">
          <div class="title-input-list">
            <t-input-adornment
              v-for="language in languages"
              :key="language.value"
              :prepend="language.content"
              :style="fieldStyle"
            >
              <t-input v-model="formData.title[language.value]" />
            </t-input-adornment>
          </div>
        </t-form-item>
        <t-form-item label="父级菜单" name="pid">
          <t-tree-select
            v-model="formData.pid"
            :data="parentMenuTree"
            :keys="{ label: 'label', value: 'id', children: 'children' }"
            clearable
            filterable
            :filter="filterParentMenu"
            placeholder="请输入名称、标题或地址筛选"
            :style="fieldStyle"
          />
        </t-form-item>
        <t-form-item label="图标" name="icon">
          <t-select
            v-model="formData.icon"
            clearable
            filterable
            placeholder="请选择图标"
            :style="fieldStyle"
            :popup-props="{
              overlayClassName: 'menu-icon-select-popup',
              overlayInnerClassName: 'menu-icon-select-content',
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
        <t-form-item label="访问路径" name="path">
          <t-input v-model="formData.path" :style="fieldStyle" />
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
import { manifest } from 'tdesign-icons-vue-next';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { languageList } from '@framework/locales';
import { useLocale } from '@framework/locales/useLocale';

/**
 * 菜单编辑弹窗。
 *
 * @author wuzm
 */
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  menuTree: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:visible', 'submit']);

const rules = {
  name: [{ required: true, message: '请输入名称', type: 'error' }],
};
const fieldStyle = { width: '480px' };
const ICON_BATCH_SIZE = 120;
const { locale } = useLocale();
const languages = computed(() => languageList.value);
const formVisible = ref(false);
const formData = ref({});
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

const removeIconScrollListener = () => {
  if (iconPopupContent) iconPopupContent.removeEventListener('scroll', loadMoreIcons);
  iconPopupContent = undefined;
};

const handleIconPopupVisibleChange = (visible) => {
  if (visible) {
    nextTick(() => {
      removeIconScrollListener();
      iconPopupContent = document.querySelector('.menu-icon-select-popup .menu-icon-select-content');
      iconPopupContent?.addEventListener('scroll', loadMoreIcons);
    });
    return;
  }
  removeIconScrollListener();
  iconKeyword.value = '';
  iconRenderLimit.value = ICON_BATCH_SIZE;
};

onBeforeUnmount(removeIconScrollListener);

/**
 * 将多语言标题补齐为当前系统已配置的语言键，保证提交为服务端要求的 JSON 对象。
 *
 * @author wuzm
 */
const createTitle = (title) => {
  return languages.value.reduce((result, language) => {
    result[language.value] = title?.[language.value] || '';
    return result;
  }, {});
};

const getMenuTitle = (title) => {
  if (typeof title === 'string') return title;
  return title?.[locale.value] || title?.zh_CN || '';
};

/**
 * 将两级菜单数据转换为 TreeSelect 所需结构，并禁止编辑菜单选择自身作为父级。
 *
 * @author wuzm
 */
const parentMenuTree = computed(() => {
  const convert = (menus) => {
    return (menus || []).map((menu) => ({
      ...menu,
      label: getMenuTitle(menu.title),
      disabled: menu.id === formData.value.id,
      children: convert(menu.children),
    }));
  };
  return convert(props.menuTree);
});

/**
 * 父级菜单支持按名称、任一语言标题及访问路径筛选。
 *
 * @author wuzm
 */
const filterParentMenu = (filterWords, option) => {
  const keyword = filterWords.trim().toLowerCase();
  if (!keyword) return true;
  const titleValues = Object.values(option.title || {});
  return [option.name, option.path, option.label, ...titleValues].some((value) =>
    String(value || '')
      .toLowerCase()
      .includes(keyword),
  );
};

const closeForm = () => {
  formVisible.value = false;
};

const handleSubmit = ({ validateResult }) => {
  if (validateResult === true) emit('submit', { ...formData.value });
};

watch(
  () => props.visible,
  (visible) => {
    formVisible.value = visible;
  },
  { immediate: true },
);

watch(formVisible, (visible) => {
  emit('update:visible', visible);
});

watch(
  () => props.data,
  (data) => {
    // 使用副本编辑，避免取消时直接修改父页面中的表格行数据。@author wuzm
    formData.value = { ...data, pid: data?.pid === 0 ? undefined : data?.pid, title: createTitle(data?.title) };
  },
  { immediate: true, deep: true },
);
</script>

<style lang="less" scoped>
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0;

  :deep(.t-form__controls) {
    display: flex;
    gap: var(--td-comp-margin-s);
  }
}

.title-input-list {
  display: flex;
  flex-direction: column;
  gap: var(--td-comp-margin-s);

  :deep(.t-input-adornment__prepend) {
    flex: 0 0 88px;
  }

  :deep(.t-input-adornment__text) {
    width: 100%;
    justify-content: center;
  }
}

:global(.menu-icon-select-popup .t-select__list) {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
}

:global(.menu-icon-select-popup .t-select-option) {
  display: flex;
  width: 36px;
  min-height: 36px;
  padding: 8px;
  justify-content: center;
  font-size: 20px;
}

:global(.menu-icon-select-popup .t-select-option + .t-select-option) {
  margin-top: 0;
}
</style>
