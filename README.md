# Doval · 笃为

基于 Vue 3、Vite 和 TDesign Vue Next 构建的后台管理前端项目。项目内置登录、首页、个人中心、结果页、多语言、主题配置、路由权限和请求封装等通用能力，可作为业务管理系统的前端基础。

## 技术栈

- Vue 3：界面开发框架
- Vite：本地开发与生产构建工具
- TDesign Vue Next：组件库与设计规范
- Vue Router：前端路由管理
- Pinia：状态管理与持久化
- Vue I18n：中文、英文国际化
- Axios：HTTP 请求封装
- ECharts：数据图表展示
- Less：样式预处理

## 环境要求

- Node.js：建议使用当前 LTS 版本
- npm：随 Node.js 安装

## 快速开始

安装依赖：

```bash
npm install
```

启动本地开发服务。服务默认监听 `1688` 端口，并会自动打开浏览器：

```bash
npm run dev
```

## 常用命令

| 命令                   | 说明                                   |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | 以开发环境启动 Vite 服务               |
| `npm run build`        | 使用 `release` 模式构建生产文件        |
| `npm run preview`      | 本地预览已构建的 `dist` 文件           |
| `npm run format`       | 使用 Prettier 格式化项目文件           |
| `npm run format:check` | 检查项目文件是否符合 Prettier 格式规范 |

## 环境变量

项目通过 Vite 环境文件管理部署差异。开发环境配置位于 `.env.development`，通用配置位于 `.env`。

| 变量                    | 说明                 |
| ----------------------- | -------------------- |
| `VITE_BASE_URL`         | 应用部署基础路径     |
| `VITE_IS_REQUEST_PROXY` | 是否启用本地接口代理 |
| `VITE_API_URL`          | 后端服务地址         |
| `VITE_API_URL_PREFIX`   | 前端请求接口前缀     |

开发服务器会将以 `VITE_API_URL_PREFIX` 开头的请求转发至 `VITE_API_URL`，并移除该请求前缀。修改接口地址或代理规则后，请重启开发服务。

> 环境文件可能包含部署地址等环境信息，请按实际运行环境配置，避免将敏感信息提交到版本库。

## 项目结构

```text
doval/
├── public/                 # 无需构建处理的静态资源
├── src/
│   ├── framework/          # 框架能力：启动、布局、路由、状态、国际化与通用资源
│   ├── modules/            # 可选业务模块
│   │   ├── base/           # 默认启用的基础业务模块
│   │   └── web3/           # Web3 业务模块示例
│   ├── App.vue             # 根组件
│   └── main.js             # 应用入口
├── .env                    # 通用环境变量
├── .env.development        # 开发环境变量
├── vite.config.js          # Vite 配置
└── package.json            # 依赖与脚本配置
```

## 页面与路由

项目已提供以下基础页面：

- 登录与注册：`/login`
- 首页：`/home/index`
- 个人中心：`/user/index`
- 结果页：成功、失败、网络异常、403、404、500、浏览器不兼容和系统维护等页面

框架固定路由位于 `src/framework/router/modules/`。业务路由由已启用模块的入口声明，后端菜单指向未启用模块页面时会沿用既有 404 兜底行为。

## 开发说明

### 路径别名

`@` 指向 `src` 目录，`@framework` 指向框架能力。Vite 会根据 `src/modules/` 下的一级目录生成模块别名，例如 `@base`、`@web3`：

```js
import { request } from '@framework/utils/request';
```

### 接口调用

接口请求统一通过 `src/framework/utils/request/` 中的封装发起，框架接口集中在 `src/framework/api/`。业务模块专属接口应放在自身 `api/` 目录中。

### 国际化

框架语言包位于 `src/framework/locales/lang/`，当前提供简体中文与英文。模块语言包由模块入口的 `messages` 声明合并；业务文案必须使用模块名命名空间，例如 `web3.wallet.connect`。

### 业务模块开发

每个业务模块位于 `src/modules/<模块名>/`，目录名即模块名称。模块可按需要维护 `api`、`assets`、`components`、`locales`、`pages`、`router`、`store`、`utils` 和 `bootstrap.js`；不使用 `index.js`、`module.config.js`、模块依赖声明或额外公开接口文件。

```js
export function install(app, { registerGlobalComponent }) {
  // 注册模块全局组件或执行模块初始化。
}
```

模块启用范围完全由 `--modules` 决定，构建不补齐依赖也不做模块依赖校验。`framework` 不能导入业务模块；业务模块可直接引用其他模块的实际文件路径，例如 `@base/components/UserSelector.vue`。`bootstrap.js` 可选导出 `install`，多个模块按命令参数顺序初始化。模块注册的全局组件必须以模块名前缀命名，例如 `web3-wallet-widget`。模块目录名不可与保留别名 `@`、`@framework` 冲突。

默认只启用 `base`：

```bash
npm run dev
npm run build
```

启用多个模块时使用英文逗号分隔：

```bash
npm run dev -- --modules=base,web3
npm run build -- --modules=base,web3
```

空模块名、重复模块名或未知模块名会使启动和构建失败。遗漏业务模块导致运行时组件不可用时，请人工将所需模块加入 `--modules` 后重新构建。

### 代码格式

提交前建议执行：

```bash
npm run format:check
```

如需自动修复格式，可执行：

```bash
npm run format
```

## 构建与部署

执行以下命令生成生产构建产物：

```bash
npm run build
```

构建结果输出到 `dist/` 目录。部署时将该目录中的静态文件发布至 Web 服务器，并确保服务器对前端路由配置了回退规则，以支持直接访问非首页路由。

## 浏览器支持

建议使用近两年发布的 Chrome、Edge、Firefox 或 Safari 浏览器访问，以获得完整的现代 Web 能力与最佳体验。
