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
- 个人中心：`/profile/index`
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

### 登录接口约定

- 密码登录调用 `POST /auth/login`，传递 `authType`、`identifier`、`credential` 和行为验证结果 `captchaVerification`。当前账号登录页使用 `ACCOUNT`。
- 短信验证码登录调用 `POST /auth/login/code`，传递 `authType: 'PHONE'`、`identifier` 和 `code`，不再使用 `PHONECODE` 或 `credential`；邮箱验证码登录尚未开放。
- 登录短信仍调用 `POST /auth/verification/message/send`，使用 `authType: 'PHONE'` 和 `scene: 'login'`，发送前按现有配置完成行为验证，登录提交时不重复验证。
- 两种登录方式由 `src/framework/pages/login/auth.js` 共用会话初始化流程，成功后由页面跳转；`userStore` 只管理用户资料，不保存令牌或登录状态。
- 接口拆分时应同时核对后端 DTO、前端请求方法、会话服务和页面字段，避免只修改地址而遗漏认证类型或验证码字段。

### 无 Cookie 会话管理

登录成功后，可在浏览器开发者工具的 Application → Session Storage → 当前站点 → `doval.session` 查看认证信息；长期客户端标识位于 Local Storage 的 `doval.clientId`。

用户资料和菜单分别通过 Pinia 持久化插件写入 Session Storage 的 `doval.user`（`userInfo`）和 `doval.menu`（`menuList`），便于查看具体内容。加载标记不持久化，刷新页面后仍重新请求最新资料和菜单；退出、会话失效或切换账号时，已有清理方法会将对应缓存重置为空数据。

- `src/framework/store/modules/session.js` 定义 `useSessionStore`，通过 Pinia actions 直接组织浏览器存储，是令牌的唯一存储入口，使用 Session Storage 的 `doval.session` 保存双令牌和绝对到期时间，不维护 Store 或模块级令牌缓存，也不维护独立登录 `status`。不配置令牌 state/getter，并关闭 Store 持久化插件，确保每次 action 读取的都是最新存储值。服务端 `accessTokenExpiresIn`、`refreshTokenExpiresIn` 的单位为秒，写入时转换为毫秒时间戳。
- `clientId` 首次生成后保存在 Local Storage 的 `doval.clientId`，所有请求通过 `X-Client-Id` 携带，退出和过期不删除它。升级时只迁移旧 `user` 存储项中的客户端标识，然后删除旧项；不迁移旧令牌，用户需要重新登录。
- 刷新接口 `POST /auth/token/refresh` 按当前 `RefreshTokenDto` 传递 `userId`、`clientId`、`refreshToken`。`userId` 只从 Access Token 的 JWT `sub` 读取为字符串，避免 Java Long 精度损失；前端解析不代表验签或认证通过，最终由服务端校验。
- 普通请求使用 Bearer 请求头。刷新页面后直接复用未过期 Access Token，仅本地过期或服务端明确拒绝认证时刷新；同一标签页并发请求共用一次刷新，原请求最多因认证问题重试一次。一次性认证接口关闭自动网络重试。
- 明确的刷新凭据失效会清理会话、资料和菜单；网络故障、服务端暂时异常及普通权限不足保留会话。退出接口需要有效 Access Token，必要时先刷新，退出流程结束后清理当前标签页数据。
- Session Storage 按标签页隔离，不承诺多标签页会话同步。服务端按用户和浏览器 `clientId` 管理同设备会话，同一浏览器再次登录同一账号会撤销旧凭据；复制标签页产生的旧凭据也可能在其他标签页刷新后失效。
- 回归验证执行 `node --experimental-vm-modules --test tests/session.test.js`，生产构建执行 `npm run build`。

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

### 有钱记个人配置

使用 `npm run dev -- --modules=base,youqianji` 启用模块，生产构建使用 `npm run build -- --modules=base,youqianji`。
若访问时找不到页面，先确认当前开发服务的启动输出包含 `youqianji`。默认 `npm run dev` 仅加载 `base`；需要停止原服务并使用上述参数重新启动，仅刷新浏览器不会启用模块。
访问 `/youqianji/personalconfig` 会进入 `/youqianji/personalconfig/index`；侧栏菜单由服务端维护，菜单地址可使用该入口。
页面位于 `src/modules/youqianji/pages/personalconfig/index.vue`，独立接口文件位于 `src/modules/youqianji/api/personalconfig.js`。

页面调用 `GET /youqianji/personalconfig/get` 回填本人配置，通过 `POST /youqianji/personalconfig/save` 保存。
请求体仅包含 `currency`，清空选择时提交 `null` 恢复默认；未保存记录按未设置处理，不在加载时创建记录。
币种选项与后端 `Currency` 枚举保持一致，后端增减币种时须同步页面选项。加载失败支持重试且禁止保存，保存失败保留输入，撤销修改恢复最近一次成功加载或保存的值。

开发约定：业务页面按目录组织，接口放在模块内独立文件；个人配置不得提交用户主键或审计字段。验证时覆盖未设置、已有配置、清空保存以及请求失败场景。

### 有钱记账簿

账簿页面位于 `src/modules/youqianji/pages/book/index.vue`，账簿接口位于 `src/modules/youqianji/api/book.js`，成员、标签、类别、商户接口分别位于同目录的 `bookmember.js`、`booktag.js`、`bookcategory.js`、`bookmerchant.js`。列表仅展示本人账簿，支持名称前缀查询、分页、新增、编辑、显示、隐藏和删除，并通过行内「账簿设置」打开成员、标签、类别、商户管理抽屉。

接口基路径为 `/youqianji/book`：分页使用 `POST /pagelist`，分页参数通过查询参数 `page`、`size` 传递；详情使用 `GET /get/{id}`；新增和编辑分别使用 `POST /create`、`POST /update`；显示、隐藏和删除分别使用 `POST /show/{id}`、`POST /hide/{id}`、`POST /delete/{id}`。

维护约定：保存仅提交 `name`、`cover`、`currency`、`desc`、`defaultAccountId`，编辑时另带 `id`。当前页面不提供默认账户选择，编辑时保留详情中的 `defaultAccountId`，避免后端将遗漏值解释为清空。用户归属、排序与审计信息由后端维护，账簿资料保存不调用成员或用户关联接口，也不依赖旧的 `creator` 标志控制删除入口。

验证账簿改动时使用 `npm run build -- --modules=base,youqianji`，确保业务模块被纳入构建；同时检查创建与编辑分流、路径主键、状态切换、默认账户保留，以及删除分页末条后的回退行为。

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

账簿列表支持通过行首手柄拖动调整当前页顺序，分页查询固定传入 `sort=sort,asc`。排序调用 `POST /youqianji/book/move`，提交移动账簿 `id`、参照账簿 `targetId` 和 `where`（向上为 1，向下为 -1）；只有移动到全局末尾才使用 `targetId=0、where=0`，当前页末行不能当作全局末尾。搜索期间及请求处理中禁止拖动，不乐观修改列表，成功后直接采用拖动事件的 `newData` 更新当前页，不重新查询，失败保留原顺序并提示。维护作者：wuzm。

建议使用近两年发布的 Chrome、Edge、Firefox 或 Safari 浏览器访问，以获得完整的现代 Web 能力与最佳体验。

### 账簿成员状态维护

成员是账簿内部交易分类对象，不关联平台注册用户。成员列表不分页，管理场景省略 `status` 返回全部，交易选择场景必须传 `status: 'ACTIVE'`。`ACTIVE` 表示可用，`ARCHIVED` 表示归档；新增默认可用。

名称编辑只提交 `id`、`bookId`、`name`，状态通过 `POST /youqianji/book/member/archive/{id}`、`POST /youqianji/book/member/restore/{id}` 独立修改。归档停止新增选择并保留历史身份，恢复沿用原主键；`delete/{id}` 是物理删除。账簿设置中的成员面板展示状态，编辑、归档或恢复、删除操作直接平铺。

维护检查：确认默认查询同时包含可用和归档成员，状态筛选及重置正确，归档后展示恢复入口，恢复后展示归档入口，失败保留数据并提示错误。账簿设置抽屉沿用该接口约定。记录作者：wuzm。

### 账簿设置抽屉

账簿列表行内「账簿设置」打开 `BookSettingsDrawer.vue`，内部成员、标签、类别、商户四个面板独立实现。成员、标签、商户引用 `framework/components/editable-table/EditableTable.vue`，类别引用 `EditableTreeTable.vue`，基础组件仅管理表格编辑与交互，不包含页头，不调用接口。API 仍按功能分别放在 `bookmember.js`、`booktag.js`、`bookcategory.js`、`bookmerchant.js`。

各业务面板自行维护数据加载、查询和重置、字段白名单转换、接口调用、保存和排序结果处理、归档恢复及离开提醒。查询输入统一提示「请输入关键词」，名称按 `searchKey` 前缀检索，无刷新按钮，无分页。新增空行追加到当前列表末尾，子类别追加到所属父级子列表末尾并自动展开父级。编辑副本由组件维护，取消不改变原数据，失败保留输入，成功由面板调用 `finishEdit()` 并重新加载。

类别使用 EnhancedTable 原生树能力，加减方框展开、收起；收支用填充式单选按钮切换。检索时并行获取匹配项及完整方向列表，保留命中项及祖先，业务校验依据完整数据。仅一级类别提供添加子类别；归档影响子树，恢复需祖先可用，含子级节点禁止删除。检索期间禁止拖动，正常情况下仅允许同父级移动，服务端移动整棵子树。父级和所有子级拖动手柄统一位于行首排序列，名称列使用原生树形缩进与展开收起图标。

四个表格统一使用 `MoveIcon` 拖动手柄，向前提交 `where=1`，向后提交 `where=-1`。成员、标签、商户分别调用 `/member/move`、`/tag/move`、`/merchant/move`，类别调用 `/category/move`。接口操作留在各面板中，基础组件只发出 TDesign 拖动上下文，失败不改变原顺序。商户以商家、单位、个人、其他按钮分组，新增带入当前 `subjectType`，编辑保留原类型，排序不能跨组。

排序保存成功后不重新查询：成员、标签、商户直接将事件的 `newData` 赋给列表；类别树表的事件包含展开后的节点，业务仍按主键在平面数据中移动节点，保留父级关联和完整子树。基础表格统一拦截忙碌、编辑中、无效目标和原地拖动，业务面板不重复检查，类别同父级限制及商户同组限制继续保留。方法文档注明作者，步骤注释仅说明逻辑。维护作者：wuzm。

账簿页面的校验按职责保留一处：名称（含空白输入）由 TDesign 列规则校验，颜色由扩展校验处理；业务保存不重复判断基础组件的提交状态。串行加载保留忙碌状态及销毁检查，不维护重复的请求版本号。表单显隐使用计算属性直接同步，编辑数据仍保留副本；删除确认和分页事件继续检查排序状态，防止延迟确认或分页在排序请求中修改列表。维护作者：wuzm。

标签和类别颜色通过 ColorPicker 编辑，限制不透明单色 HEX，保存转大写，清空提交 null；展示态为不可交互的色块和编码，无边框、阴影及悬浮灰底，并与颜色表头左侧对齐。归档行内容灰化。类别图标沿用菜单图标选择网格，支持搜索、清空和分批渲染。

基础组件的属性、插槽、事件及实例方法见 `src/framework/components/editable-table/README.md`。四个业务面板各自维护 scoped Less 样式，仅保留实际使用的规则；编辑状态与拖动手柄样式由基础组件负责。构建验证使用 `npm run build -- --modules=base,youqianji`。维护作者：wuzm。

账簿设置采用操作列统一进入行编辑，名称和说明列设置 `edit.showEditIcon: false` 隐藏原生单元格编辑提示，基础表格保留 TDesign 默认配置能力。维护作者：wuzm。

可编辑表格运行时只保留 `EditableTable.vue` 和 `EditableTreeTable.vue` 两个组件，通用编辑及平面数据投影位于前者，后者负责原生 EnhancedTable 适配、递归数据投影、父级上下文、展开状态及树形拖动；不再拆分 Core 组件或独立数据工具文件。测试与使用文档继续保留。维护作者：wuzm。

### 业务字典加载与缓存

字典由 `src/framework/store/modules/dict.js` 管理，通过 `@framework/store` 导出。接口统一封装在 `src/framework/api/dict.js` 的 `getDetailByCode(code)`，Store 引用该函数，不直接拼接请求地址。编码全局唯一且区分大小写，按需请求 `GET /base/dict/get/detail/code/{code}`；不使用 namespace。页面初始化或弹窗打开时调用 `useDict(code)`，不要在表格单元格渲染函数中创建字典实例。

```js
import { useDict, loadDicts } from '@framework/store';

const dutytype = useDict('person.dutytype');
// 下拉框使用 dutytype.options.value，保留接口的 label、value 字段及值类型。
// 表格单元格使用 dutytype.getLabel(row.dutytype)，仅查询内存。
// dutytype.getItem(value) 获取完整字典项；loading、error 是计算属性。
// await dutytype.ready 等待首次加载；await dutytype.reload() 强制重试或刷新。
// 自动加载失败通过 error 暴露，主动等待 ready、reload 或批量加载时应捕获异常。
await loadDicts(['order.status', 'order.paytype']);
```

Pinia 保存响应式内存数据，通过项目现有 persist 插件配置 localStorage 和 pick，使用插件默认序列化与反序列化，插件恢复缓存后通过 afterHydrate 重建排序及查询索引；Store 不手动读取或写入存储。localStorage 的 `doval.dict` 顶层为 `data`，其内部以 code 为 key，各字典项包含 `data`、`loadedAt`、`expiresAt`；通过 `pick: ['data']` 仅保存字典集合，不配置自定义 serializer。旧的无顶层 data 缓存不会恢复，后续按需重新加载。有效期为加载成功后 30 分钟，读取不续期；浏览器刷新优先恢复有效缓存。过期后下次使用才请求，更新期间及失败后保留旧数据，不轮询，字典管理修改后不主动失效。同编码并发合并请求，批量加载按编码去重；所有调用方均失败后可重新加载。

选项按 sort 升序排列，缺省排序值为 0；空字典正常缓存。数字字典兼容数字字符串并正确识别 0，字符串字典区分前导零；文本转换将 null、undefined、空字符串显示为 `—`，未知值回显原值。选项与字典项共享使用，业务需要追加“全部”或修改选项时，应创建副本。localStorage 损坏按缓存未命中处理，写入失败不影响内存使用。持久化按当前标签页的字典集合整体保存，不提供跨标签页合并或实时同步；多标签页同时写入可能覆盖缓存集合，缺失项在后续使用时重新请求。

维护验证使用 `node --test tests/dict.test.mjs`，安装真实 persist 插件，覆盖并发合并、持久化恢复及索引重建、过期失败重试、值匹配、批量加载、损坏项过滤及存储异常。后续维护应继续保持加载与同步查询分离，不在 getter 或渲染过程中发请求。维护作者：wuzm。

账簿设置排序由业务面板在接口成功后按目标行前后位置更新本地数据，不重新请求列表；失败保留原顺序，类别保留父子关联与展开状态。维护作者：wuzm。

账簿列表 `src/modules/youqianji/pages/book/index.vue` 通过 `useDict` 按需加载 `youqianji.currency` 和 `youqianji.displaystatus`，币种名称、状态标签及显示隐藏操作文字均读取字典；币种保留“名称（编码）”格式，状态判断和接口调用继续使用 SHOW、HIDE 业务值。单元格只调用 getLabel，不在渲染时创建字典或触发加载。维护作者：wuzm。

### 业务页面字典替换约定

base 的用户列表及表单使用 user.userstatus，性别选项使用 user.gender，消息查询、发布与列表使用 message.messagetype。有钱记账簿表单与个人配置使用 youqianji.currency，成员、标签、商户、类别面板状态使用 youqianji.archivestatus，商户主体与类别收支方向分别使用 youqianji.bookmerchantsubjecttype、youqianji.bookcategorytype；账簿显示状态以数据库编码 youqianji.displaystatus 为准。

选项直接使用字典 options，币种名称加编码时用 computed 派生副本；状态展示使用 getLabel，操作判断及默认值继续使用后端业务值。新增行的“待保存”、归档恢复确认提示和操作完成消息属于页面交互文案。菜单语言列表继续取框架实际支持的语言包，图标列表来自图标库，不与通用字典混用。维护作者：wuzm。

有钱记相对移动 API 统一使用 moveBook、moveBookMember、moveBookMerchant、moveBookTag、moveBookCategory 命名，页面处理函数为 moveRows，移动状态为 moving，类别同级移动校验为 canMove。表格原生 drag-sort、before-drag-sort 事件与属性及服务端 sort 排序查询字段继续使用原契约。维护作者：wuzm。
