import path from 'node:path';

import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { loadEnv } from 'vite';
import svgLoader from 'vite-svg-loader';

const CWD = process.cwd();

// https://vitejs.dev/config/
export default ({ mode }) => {
  const { VITE_API_URL, VITE_API_URL_PREFIX, VITE_BASE_URL } = loadEnv(mode, CWD);
  return {
    base: VITE_BASE_URL,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    css: {
      preprocessorOptions: {
        less: {
          modifyVars: {
            hack: `true; @import (reference) "${path.resolve('src/style/variables.less')}";`,
          },
          math: 'strict',
          javascriptEnabled: true,
        },
      },
    },

    plugins: [vue(), vueJsx(), svgLoader()],

    server: {
      port: 1688,
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        [VITE_API_URL_PREFIX]: {
          target: VITE_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${VITE_API_URL_PREFIX}`), ''),
        },
      },
    },

    // https://github.com/vueuse/vueuse/issues/5387#issuecomment-4734186040
    build: {
      rolldownOptions: {
        onLog(level, log, defaultHandler) {
          if (log.code === 'INVALID_ANNOTATION') return null;
          else defaultHandler(level, log);
        },
      },
    },
  };
};
