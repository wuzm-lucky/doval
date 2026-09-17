<template>
  <div :class="prefix + '-main-wrapper'">
    <div class="container">
      <t-row class="header" justify="end">
        <t-space v-if="editing">
          <t-button theme="primary" :loading="saving" @click="save">保存</t-button>
          <t-button variant="outline" :disabled="saving" @click="cancelEdit">取消</t-button>
        </t-space>
        <t-button v-else :disabled="loading" @click="startEdit">编辑</t-button>
      </t-row>
      <t-loading :loading="loading" size="small">
        <div class="body">
          <t-row class="config_row" justify="space-between">
            <div class="config_info">
              <div class="config_label">币种</div>
              <div class="config_description">用于资产、账单等页面的金额展示。</div>
            </div>
            <t-select
              v-model="form.currency"
              class="config_select"
              :options="currencyOptions"
              :disabled="!editing || saving"
              clearable
              filterable
              placeholder="默认币种"
            />
          </t-row>
        </div>
      </t-loading>
    </div>
  </div>
</template>

<script setup>
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, reactive, ref } from 'vue';

import { prefix } from '@framework/config/global';
import { getUserConfig, saveUserConfig } from '@youqianji/api/userconfig';

const currencyOptions = [
  ['CNY', '人民币'],
  ['HKD', '港币'],
  ['USD', '美元'],
  ['EUR', '欧元'],
  ['GBP', '英镑'],
  ['JPY', '日元'],
  ['SGD', '新加坡元'],
  ['AUD', '澳大利亚元'],
  ['CAD', '加拿大元'],
  ['CHF', '瑞士法郎'],
  ['NZD', '新西兰元'],
  ['MOP', '澳门元'],
  ['TWD', '新台币'],
  ['KRW', '韩元'],
  ['THB', '泰铢'],
  ['MYR', '马来西亚林吉特'],
  ['IDR', '印度尼西亚卢比'],
  ['PHP', '菲律宾比索'],
  ['INR', '印度卢比'],
  ['AED', '阿联酋迪拉姆'],
].map(([value, label]) => ({ value, label: `${label}（${value}）` }));

const form = reactive({ currency: '' });
const savedCurrency = ref('');
const loading = ref(false);
const saving = ref(false);
const editing = ref(false);

function resetForm() {
  form.currency = savedCurrency.value;
}

function startEdit() {
  resetForm();
  editing.value = true;
}

function cancelEdit() {
  resetForm();
  editing.value = false;
}

async function load() {
  loading.value = true;
  try {
    const config = await getUserConfig();
    // 未保存配置或恢复默认后，页面统一按人民币展示。
    savedCurrency.value = config?.currency || 'CNY';
    resetForm();
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '个人配置加载失败');
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (saving.value) return;
  saving.value = true;
  try {
    const currency = form.currency || null;
    await saveUserConfig({ currency });
    savedCurrency.value = currency || 'CNY';
    editing.value = false;
    MessagePlugin.success('个人配置保存成功');
  } catch (requestError) {
    MessagePlugin.error(requestError.message || '个人配置保存失败，请重试');
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style lang="less" scoped>
.container {
  padding: var(--td-comp-paddingTB-xl) var(--td-comp-paddingLR-xl);
  .header {
    margin-bottom: var(--td-comp-margin-l);
  }

  .body {
    align-items: flex-start;
    width: 100%;
    .config_row {
      gap: var(--td-comp-margin-xxl);
      padding: var(--td-comp-paddingTB-l) 0;
      .config_info {
        min-width: 0;
      }

      .config_label {
        color: var(--td-text-color-primary);
        font: var(--td-font-body-large);
      }

      .config_description {
        margin-top: var(--td-comp-margin-xs);
        color: var(--td-text-color-placeholder);
        font: var(--td-font-body-small);
      }

      .config_select {
        width: 320px;
        flex: none;
        margin-left: auto;
      }
    }
    .config_row + .config_row {
      border-top: 1px solid var(--td-text-color-placeholder);
    }
  }
}
</style>
