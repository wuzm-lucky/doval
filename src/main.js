import { createApp } from 'vue';
import TDesign from 'tdesign-vue-next';

import App from './App.vue';
import { installModules } from '@framework/bootstrap/modules.js';
import router from '@framework/router/index.js';
import { store } from '@framework/store/index.js';
import i18n from '@framework/locales/index.js';

import 'tdesign-vue-next/es/style/index.css';
import '@framework/styles/index.less';
import '@framework/router/permission.js';

const app = createApp(App);

app.use(TDesign);
app.use(store);
app.use(router);
app.use(i18n);
installModules(app, { router, store, i18n });

app.mount('#app');
