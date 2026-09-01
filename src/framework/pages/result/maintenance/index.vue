<template>
  <result :title="t('pages.result.maintenance.title')" :tip="t('pages.result.maintenance.subtitle')" type="maintenance">
    <t-button theme="primary" @click="() => router.push('/')">{{ t('pages.result.maintenance.back') }}</t-button>
  </result>
</template>
<script setup>
import { useRouter } from 'vue-router';

import Result from '@framework/components/result/index.vue';
import { t } from '@framework/locales';

defineOptions({
  name: 'ResultMaintenance',
});

const router = useRouter();
</script>
