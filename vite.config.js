import fs from 'node:fs';
import path from 'node:path';

import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { loadEnv } from 'vite';
import svgLoader from 'vite-svg-loader';

const CWD = process.cwd();
const MODULES_DIRECTORY = path.resolve(CWD, 'src/modules');
const VIRTUAL_MODULE_ID = 'virtual:enabled-modules';
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;
const RESERVED_MODULE_NAMES = new Set(['framework']);

/**
 * 读取一级业务模块目录，并校验其不会覆盖框架保留别名。
 *
 * @author wuzm
 */
function getModuleNames() {
  if (!fs.existsSync(MODULES_DIRECTORY)) return [];
  const moduleNames = fs
    .readdirSync(MODULES_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  moduleNames.forEach((moduleName) => {
    if (RESERVED_MODULE_NAMES.has(moduleName))
      throw new Error(`module ${moduleName} conflicts with reserved alias @${moduleName}`);
  });
  return moduleNames;
}

/**
 * 解析命令行模块参数，并在 Vite 读取配置时完成目录合法性校验。
 *
 * @author wuzm
 */
function resolveEnabledModules(moduleNames) {
  const moduleArguments = process.argv.filter((argument) => argument.startsWith('--modules='));
  if (moduleArguments.length > 1) throw new Error('modules parameter can only be specified once');
  const modules = (moduleArguments[0]?.slice('--modules='.length) ?? 'base').split(',');
  if (modules.some((moduleName) => !moduleName)) throw new Error('module name cannot be empty');
  const duplicateModule = modules.find((moduleName, index) => modules.indexOf(moduleName) !== index);
  if (duplicateModule) throw new Error(`module ${duplicateModule} is duplicated`);
  modules.forEach((moduleName) => {
    if (!moduleNames.includes(moduleName)) throw new Error(`module ${moduleName} not exists`);
  });
  return modules;
}

/**
 * 递归读取模块目录中的指定扩展名文件，并生成稳定的相对路径顺序。
 *
 * @author wuzm
 */
function collectFiles(directory, extension) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectFiles(entryPath, extension);
      return entry.isFile() && entry.name.endsWith(extension) ? [entryPath] : [];
    })
    .sort();
}

/**
 * 为本次构建生成仅包含已启用模块的静态清单，避免未启用模块进入 Rollup 分析。
 *
 * @author wuzm
 */
function enabledModulesPlugin(enabledModules) {
  const imports = [];
  const declarations = enabledModules.map((moduleName, moduleIndex) => {
    const moduleDirectory = path.join(MODULES_DIRECTORY, moduleName);
    const routeFiles = collectFiles(path.join(moduleDirectory, 'router'), '.js');
    const localeFiles = collectFiles(path.join(moduleDirectory, 'locales'), '.json');
    const routeImports = routeFiles.map((filePath, fileIndex) => {
      const variable = `route${moduleIndex}_${fileIndex}`;
      imports.push(
        `import * as ${variable} from '@${moduleName}/${path.relative(moduleDirectory, filePath).replaceAll('\\', '/')}';`,
      );
      return variable;
    });
    const localeImports = localeFiles.map((filePath, fileIndex) => {
      const variable = `locale${moduleIndex}_${fileIndex}`;
      const locale = path.basename(filePath, '.json');
      imports.push(
        `import ${variable} from '@${moduleName}/${path.relative(moduleDirectory, filePath).replaceAll('\\', '/')}';`,
      );
      return `${JSON.stringify(locale)}: { ...${variable} }`;
    });
    const bootstrapPath = path.join(moduleDirectory, 'bootstrap.js');
    const bootstrapVariable = `bootstrap${moduleIndex}`;
    if (fs.existsSync(bootstrapPath))
      imports.push(`import * as ${bootstrapVariable} from '@${moduleName}/bootstrap.js';`);
    return `{ name: '${moduleName}', routeModules: [${routeImports.join(', ')}], messages: { ${localeImports.join(', ')} }, install: ${
      fs.existsSync(bootstrapPath) ? `${bootstrapVariable}.install` : 'undefined'
    } }`;
  });
  const source = `${imports.join('\n')}\n\nexport default [${declarations.join(', ')}];\n`;
  return {
    name: 'doval-enabled-modules',
    resolveId(id) {
      return id === VIRTUAL_MODULE_ID ? RESOLVED_VIRTUAL_MODULE_ID : null;
    },
    load(id) {
      return id === RESOLVED_VIRTUAL_MODULE_ID ? source : null;
    },
  };
}

// https://vitejs.dev/config/
export default ({ mode }) => {
  const moduleNames = getModuleNames();
  const enabledModules = resolveEnabledModules(moduleNames);
  const { VITE_API_URL, VITE_API_URL_PREFIX, VITE_BASE_URL } = loadEnv(mode, CWD);
  console.info(`[doval] 已启用模块：framework, ${enabledModules.join(', ')}`);
  console.info(`[doval] 模块目录：${enabledModules.map((moduleName) => `src/modules/${moduleName}/`).join(', ')}`);

  return {
    base: VITE_BASE_URL,
    resolve: {
      alias: {
        '@': path.resolve(CWD, './src'),
        '@framework': path.resolve(CWD, './src/framework'),
        ...Object.fromEntries(
          moduleNames.map((moduleName) => [`@${moduleName}`, path.join(MODULES_DIRECTORY, moduleName)]),
        ),
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          modifyVars: { hack: `true; @import (reference) "${path.resolve('src/framework/styles/variables.less')}";` },
          math: 'strict',
          javascriptEnabled: true,
        },
      },
    },
    plugins: [enabledModulesPlugin(enabledModules), vue(), vueJsx(), svgLoader()],
    server: {
      port: 1688,
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        [VITE_API_URL_PREFIX]: {
          target: VITE_API_URL,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(new RegExp(`^${VITE_API_URL_PREFIX}`), ''),
        },
      },
    },
    build: {
      rolldownOptions: {
        onLog(level, log, defaultHandler) {
          if (log.code === 'INVALID_ANNOTATION') return null;
          return defaultHandler(level, log);
        },
      },
    },
  };
};
