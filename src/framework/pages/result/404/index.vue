<template>
  <result title="404 Not Found" :tip="t('pages.result.404.subtitle')" type="404">
    <t-button @click="() => router.push(HOME_ROUTE_PATH)">{{ t('pages.result.404.back') }}</t-button>
  </result>
</template>
<script setup>
import { useRouter } from 'vue-router';

import Result from '@framework/components/result/index.vue';
import { t } from '@framework/locales';
import { HOME_ROUTE_PATH } from '@framework/utils/route/constant';

defineOptions({
  name: 'Result404',
});

const router = useRouter();
</script>
