<template>
  <result title="404 Not Found" :tip="t('pages.result.404.subtitle')" type="404">
    <t-button @click="() => router.push('/')">{{ t('pages.result.404.back') }}</t-button>
  </result>
</template>
<script setup>
import { useRouter } from 'vue-router';

import Result from '@framework/components/result/index.vue';
import { t } from '@framework/locales';

defineOptions({
  name: 'Result404',
});

const router = useRouter();
</script>
