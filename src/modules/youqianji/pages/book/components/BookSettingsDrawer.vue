<template>
  <t-drawer
    :visible="visible"
    :header="`账簿设置 · ${book.name || ''}`"
    size="min(1120px, 100vw)"
    :footer="false"
    destroy-on-close
    @close="requestClose"
  >
    <div class="settings">
      <t-tabs :value="activeTab" @change="switchTab"
        ><t-tab-panel v-for="tab in tabs" :key="tab.value" :value="tab.value" :label="tab.label"
      /></t-tabs>
      <component
        :is="panels[activeTab]"
        v-if="visible && book.id"
        ref="panelRef"
        :key="`${book.id}-${activeTab}`"
        :book-id="book.id"
      />
    </div>
  </t-drawer>
</template>

<script setup>
import { ref, watch } from 'vue';
import BookMemberPanel from './BookMemberPanel.vue';
import BookTagPanel from './BookTagPanel.vue';
import BookCategoryPanel from './BookCategoryPanel.vue';
import BookMerchantPanel from './BookMerchantPanel.vue';

/** 抽屉只负责账簿上下文、功能切换和关闭；具体业务由独立面板维护。 */
const props = defineProps({ visible: Boolean, book: { type: Object, default: () => ({}) } });
const emit = defineEmits(['update:visible']);
const activeTab = ref('member');
const panelRef = ref();
const tabs = [
  { value: 'member', label: '成员' },
  { value: 'tag', label: '标签' },
  { value: 'category', label: '类别' },
  { value: 'merchant', label: '商户' },
];
const panels = { member: BookMemberPanel, tag: BookTagPanel, category: BookCategoryPanel, merchant: BookMerchantPanel };
/** 离开前委托当前面板检查请求状态及未保存内容。 */
const guardLeave = (proceed) => {
  if (panelRef.value) panelRef.value.guardLeave(proceed);
  else proceed();
};
const switchTab = (value) => {
  if (value !== activeTab.value)
    guardLeave(() => {
      activeTab.value = value;
    });
};
const requestClose = () => guardLeave(() => emit('update:visible', false));
watch(
  () => [props.visible, props.book.id],
  () => {
    if (props.visible) activeTab.value = 'member';
  },
);
</script>

<style lang="less" scoped>
.settings {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 120px);
  gap: var(--td-comp-margin-m);
  min-height: 0;
}
</style>
