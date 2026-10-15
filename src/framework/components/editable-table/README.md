# 可编辑表格

`EditableTable.vue` 基于 TDesign `Table`，`EditableTreeTable.vue` 基于 `EnhancedTable`。运行时只保留这两个 Vue 文件，采用基础层与增强层组合：普通组件不包含树形判断，树组件负责树数据、节点新增、展开和拖动适配，通过扩展点复用通用编辑能力。两者只封装表格内容，不包含查询、新增、重置、分组切换等页头组件，不导入业务模块，不接收请求 API，也不自行加载或保存数据。

## 数据与列

通过 `data`、`columns`、`rowKey`、`loading` 等属性传入受控数据，支持其他 TDesign 属性和单元格插槽透传。`rowKey` 默认 `id`，支持字段路径。业务负责查询与持久化，表格不会修改原始 `data`。

列编辑采用 TDesign 原生 `columns.edit` 配置，例如 `edit: { component: Input, props: { maxlength: 100 }, rules: [{ required: true, message: '请输入名称' }] }`。组件使用 `editableRowKeys` 开启当前行编辑，`row-edit` 同步深复制的副本，调用原生 `validateRowData` 校验。动态列编辑属性会保留，但请求或校验期间禁用控件。

颜色和图标等特殊内容使用单元格插槽，作用域在 TDesign 原参数基础上增加 `draft`（当前编辑副本）、`editing`（当前行是否编辑中）、`locked`（是否禁止开启新操作）、`startEdit`、`save`、`cancel`。可直接绑定 `draft` 内字段；外部仍使用 `v-model:editing-row` 观察编辑状态，用于离开提醒。非编辑行的插槽不可修改 `draft`。

## 操作与提交

默认追加 `op` 操作列，提供编辑及保存、取消；调用方可在 columns 中指定 `op` 宽度，通过 `row-actions` 插槽追加业务操作，或通过 `op` 插槽完全替换操作列。归档、恢复、删除、权限、状态标签、查询字段都属于业务，不内置于基础组件。

普通组件的 `save` 事件参数为 `{ row, original, isNew }`，树增强层在此基础上补充 `parentKey`。组件先校验当前行，成功后发出事件，业务自行调用接口、设置 `loading`：保存成功调用 `finishEdit()`，再重新查询；失败调用 `setError(message)`，保持副本与编辑状态。组件不会因发出事件而自行结束编辑。业务必须按白名单构建请求体，新增时不要提交临时主键或整行审计字段。

`validate` 属性可提供同步或异步扩展校验，返回空字符串、`true` 或 `undefined` 表示通过，字符串错误或 `false` 表示失败。`validation-error` 事件用于监听校验失败。取消发出 `cancel` 事件，原记录及其嵌套属性保持不变。

## 拖动与树

设置 `draggable` 后自动追加 `drag` 列，以官方示例中的 `MoveIcon` 作为拖动手柄，采用 `drag-sort="row-handler"`。可通过 `drag` 插槽调整位置，自定义手柄需要保留 `editable-table__handle`，放在名称等非 drag 列时还需添加 TDesign 的 `t-table__handle-draggable`。

`canDrag(row)` 决定是否允许从当前行启动拖动，`beforeDragSort(context)` 可以拦截移动；`drag-sort` 事件保留 TDesign 的上下文，由业务转换成后端要求的排序参数。组件不乐观修改受控数据，树表在 EnhancedTable 的 `beforeDragSort` 中通知业务并阻止默认交换，业务回填后才展示最终顺序，接口失败不会留下错误排序。

维护约定：请求与校验状态统一由 `pending` 管理，开启编辑及拖动由 `locked` 管理；原地拖动和手柄识别使用 TDesign 原生行为，不重复校验事件字段。动态编辑属性每次只求值一次。业务保存事件不重复检查忙碌状态，串行加载无需额外请求版本号；保留销毁后忽略异步响应、编辑副本、输入校验及树节点父级检查。维护作者：wuzm。

`EditableTreeTable` 接收嵌套 `data` 和原生 `tree` 配置，默认子字段为 `children`；`treeNodeColumnIndex` 在有拖动列时默认1，否则0。通过 `v-model:expanded-tree-nodes` 控制展开节点，默认加减方框图标。普通组件的 `addRow(defaults)` 在列表末尾新增。树组件扩展为 `addRow(defaults, parentKey)`，在父级子列表末尾添加并展开父级；省略 parentKey 在根列表末尾新增。检索补全祖先、限制同级排序、父级归档校验由业务提供。

通过 `getTable()` 获取底层 TDesign 实例，用于需要的原生树操作。受控 data 变化由 EnhancedTable 自身同步内部树状态，外层不重复调用 `resetData`，避免异步展开执行两次。不要将底层实例修改和受控 data 更新混用为两个数据源。

## 实例方法

| 方法                           | 作用                                         |
| ------------------------------ | -------------------------------------------- |
| `startEdit(row)`               | 开启现有行编辑，复制完整对象                 |
| `addRow(defaults, parentKey?)` | 在根或父级列表尾部创建临时编辑行             |
| `save()`                       | 校验并发出保存事件                           |
| `validate()`                   | 校验当前编辑行                               |
| `cancel()`                     | 取消编辑并发出事件，请求或校验中禁止执行     |
| `finishEdit()`                 | 业务提交成功后结束编辑                       |
| `setError(message)`            | 设置提交错误，保留副本                       |
| `isPending()`                  | 是否正在请求或异步校验，业务离开检查应先判断 |
| `getTable()`                   | 获取底层 Table 或 EnhancedTable 实例         |

表格容器采用 flex 和 ResizeObserver 控制内部滚动；调用方需提供可用高度和 `min-height: 0`。显式 `max-height` 优先于自动测量。所有分页、空状态和其他原生表格配置均由调用者通过原生属性提供，不固定为无分页。

参考：[TDesign 表格](https://tdesign.tencent.com/vue-next/components/table)、[官方 Demo](https://github.com/Tencent/tdesign-vue-next/tree/develop/packages/components/table/_example)。维护作者：wuzm。

## 分层扩展约定

`EditableTable` 默认渲染 TDesign `Table`，仅处理平面记录的副本替换和末行新增。它不导入 EnhancedTable，不认识子字段、父节点、展开状态或 treeMode。

通用扩展点：`tableComponent` 指定底层渲染组件；`tableProps` 向底层补充原生属性及事件适配；`dataAdapter(data, draft, { rowKey, isNew })` 替换默认的平面数据投影；`resolveRow(data, key)` 适配手柄定位的数据查找。扩展函数必须保持输入数据不变。

`EditableTreeTable` 在自身导入 EnhancedTable，递归查找和副本投影均位于增强层。它通过上述扩展点提供嵌套数据和受控拖动行为，管理父级上下文并增强保存事件，转发通用插槽和编辑方法。普通组件无须知道调用方是不是树表。这样与 TDesign 的增强层处理树形能力、复用基础表格的方向一致，无需复制编辑状态机或再增加 Core 组件。

自定义 `drag` 插槽按是否声明决定覆盖默认手柄；即使某行的条件插槽返回空内容，也不回退显示默认图标，确保自定义列内容不会被默认手柄覆盖。维护作者：wuzm。
