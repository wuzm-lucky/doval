<template>
  <result title="403 Forbidden" :tip="t('pages.result.403.tips')">
    <t-button @click="() => router.push('/')">{{ t('pages.result.403.back') }}</t-button>
  </result>
</template>
<script setup>
import { useRouter } from 'vue-router';

import Result from '@framework/components/result/index.vue';
import { t } from '@framework/locales';

defineOptions({
  name: 'Result403',
});

const router = useRouter();
</script>
