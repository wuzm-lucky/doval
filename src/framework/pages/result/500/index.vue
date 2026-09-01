<template>
  <result title="500 Internal Server Error" type="500" :tip="t('pages.result.500.subtitle')">
    <t-button @click="() => router.push('/')">{{ t('pages.result.500.back') }}</t-button>
  </result>
</template>
<script setup>
import { useRouter } from 'vue-router';

import Result from '@framework/components/result/index.vue';
import { t } from '@framework/locales';

defineOptions({
  name: 'Result500',
});

const router = useRouter();
</script>
