<template>
  <result :title="t('pages.result.networkError.title')" :tip="t('pages.result.networkError.subtitle')" type="wifi">
    <div>
      <t-button theme="default" @click="() => router.push('/')">{{ t('pages.result.networkError.back') }}</t-button>
      <t-button @click="() => router.push('/')">{{ t('pages.result.networkError.reload') }}</t-button>
    </div>
  </result>
</template>
<script setup>
import { useRouter } from 'vue-router';

import Result from '@framework/components/result/index.vue';
import { t } from '@framework/locales';

defineOptions({
  name: 'ResultNetworkError',
});

const router = useRouter();
</script>
