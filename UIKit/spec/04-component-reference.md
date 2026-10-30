# 04 · 组件参考（99 条目）

逐条规格。通用规则（状态、键盘、表单接线、i18n、图标）见 `03-component-contract.md`；颜色、字号、间距一律引用 `02` 的变量名，本文只写"用哪个"和"多大"。

每条格式：**用途 → 类名/DOM → 属性 → 视觉 → 状态 → a11y → i18n**。省略项表示"沿用通用契约"。

---

## A. theme（1）

### ThemeProvider

- **用途**：为一棵子树作用域化主题、密度与 token 覆盖；嵌入到既有应用时同时补上 `nui-root` 背景与排版。
- **属性**：`theme: 'paper'|'night'|'auto'|string`、`density: 'comfortable'|'compact'`、`tokens: TokenOverrides`、`root: boolean = true`。
- **行为**：`root` 时输出 `<div class="nui-root" data-nui-theme data-nui-density style="--nui-…">`；`tokens` 里的键自动加 `--nui-` 前缀（camelCase → kebab-case）。`theme="auto"` 交给 CSS 媒体查询，不在 JS 里判断。
- **注意**：不在 `<html>` 上也能工作；与全局 `<html data-nui-theme>` 同时存在时，内层 provider 胜出。

---

## B. foundation（9）

| 组件 | 类名 / DOM | 属性 | 视觉规格 |
| --- | --- | --- | --- |
| `Display` | `.nui-display`（`--xl/--l/--s` 修饰符），`as` 默认 `h1` | `size: 'xl'|'l'|'m'|'s'` | 衬线 400；`m` 36–71px、行高 1.1、字距 -0.01em；`l` 44–90px、字距 normal；`s` 28–42px、行高 1.15；`text-wrap: balance` |
| `Heading` | `.nui-heading`（`--3`/`--4`），`level: 2|3|4` | `level` | `h2` Inter 700 clamp(26..37)/1.3；`h3` 24/1.2/600；`h4` 18/1.3/600；`balance` |
| `Eyebrow` | `.nui-eyebrow`（`--accent`） | `accent?: boolean` | 12px/1.4、700、大写、字距 .16em、`text-muted`；accent 版用 `accent-text` |
| `Lead` | `.nui-lead` | — | 18px/1.72、`text-secondary`、`max-width: 52ch` |
| `Shell` | `.nui-shell` | `as` | `width: min(100% - 2*gutter, 1360px); margin-inline: auto` |
| `Section` | `.nui-section` + `--inverse/--plum/--navy` | `tone`, `contained = true` | `padding-block: --nui-section-y`（64–130px）；`contained` 时内部套 `.nui-shell` |
| `Stack` | `.nui-stack` | `gap: space step`（默认 4=16px） | 纵向 flex；`--nui-stack-gap` |
| `Cluster` | `.nui-cluster` | `gap`（默认 3=12px）、`justify` | 横向 wrap + `align-items:center` |
| `Grid` | `.nui-grid` + `--1/--2/--3/--4/--auto` | `cols`（默认 3）、`min`（auto=280px） | `gap: 20px`；3/4 列在 1080px 降为 2 列、640px 降为 1 列；`auto` 用 `minmax(min,1fr)` |

附加基础类（无组件封装，可直接用）：

| 类 | 规格 |
| --- | --- |
| `.nui-title` | 24px / 28px、500、大写、字距 -0.35px（卡片标题） |
| `.nui-prose` | `max-width: 65ch`、行高 1.875，子元素间 `1em` |
| `.nui-text-secondary` / `.nui-text-muted` / `.nui-text-small` | 语义文字色 / 14px/1.5 |
| `.nui-mono` | 等宽，`font-size: .92em` |
| `.nui-num` | `font-variant-numeric: tabular-nums` |
| `.nui-link` | 无下划线，底部 1px `accent` 线性层；hover 变 2px |
| `.nui-divider` | 1px `border`，`height:1px`，无 margin |
| `.nui-sr-only` | 视觉隐藏但可读 |

---

## C. actions（6）

### Button

- **用途**：所有动作。默认 `ghost`（无底色、大写、字距 .2em）；`solid` 是每屏唯一主操作。
- **类名**：`.nui-btn` + `--ghost`（默认，不输出类）/`--solid`/`--outline`/`--subtle`/`--danger`/`--invert`/`--underline`；尺寸 `--sm`/`--lg`；`--block`。
- **属性**：`variant`、`size`、`block`、`arrow`（尾部箭头，hover 右移 6px）、`loading`（`aria-busy` + 12px 转圈，禁用重复提交）、`href`（渲染 `<a>`，外链自动 `target=_blank rel=noopener noreferrer`）。
- **视觉**：`min-height: control-h`；字体 500 13px/1；gap .75em；边框 1px transparent；圆角 `radius-control`；hover 只变颜色/背景；`:focus-visible` 2px 焦点环 + 3px offset。
  - `solid`：背景 `accent`，文字 `on-accent`，左右 24px；hover 背景 `accent-hover`。
  - `outline`：边框 `text`，左右 24px；hover 背景 `text`、文字 `bg`。
  - `subtle`：背景 `surface-sunken` + 边框 `border`；hover 边框 `border-strong`。
  - `danger`：文字与边框 `negative`；hover 反白（底色 `negative`、文字 `surface`）。
  - `invert`：文字 `white`（深色区块用）；hover 文字 `gold`。
  - `underline`：只有 1px 底边（`accent`），`align-self:flex-start`，`min-height:0`，`padding-bottom:6px`。
  - `sm`：36px 高、11px 字、左右 16px；`lg`：56px 高、14px 字、左右 32px。
- **a11y**：`type="button"` 默认；disabled 用原生 `disabled` 或 `aria-disabled`（`.4` 透明度 + `pointer-events:none`）。

### IconButton

`.nui-icon-btn`（`--sm` 24px）。`label` **必填**（同时作为 `aria-label` 与 `title`）。32×32，图标 13–15px，`text-muted`，hover 转 `text` + 边框出现。

### ChipGroup

- `.nui-chips`（容器，`gap:26px`，横向可滚动且隐藏滚动条）+ `.nui-chip`。
- `role="group"` + `aria-label`；每项 `aria-pressed`，选中项 `tabIndex=0` 其余 `-1`，←/→ 切换。
- 视觉：`padding:18px 0`、12px/500 大写/字距 .14em、底部 2px 透明边框；选中 → 文字 `text` + 底边 `accent`；可选 `__count`（左 6px、tabular）。

### Tabs / TabPanel

- `.nui-tabs`（`gap:28px`，底边 1px `border`）+ `.nui-tab`（`padding:14px 0`、14px/600、`margin-bottom:-1px`）；选中 → 文字 `text` + 底边 2px `accent`。
- `role=tablist/tab/tabpanel`，`aria-controls` + `aria-labelledby`；roving tabindex。
- `TabPanel`：`id="{tabsId}-panel-{value}"`，非激活 `hidden` 但 `tabIndex={0}`。

### Segmented

- `.nui-segmented`（`padding:3px`、1px 边框、`surface-sunken` 底）+ `.nui-segmented__item`（高 `control-h - 16`、左右 14px、12px/600 大写/字距 .08em）。
- `role=radiogroup` + 每项 `role=radio` + `aria-checked`；←/→ 切换。
- 选中：`surface` 底 + 文字 `text` + `inset 0 -2px 0 accent`。
- 用途：Long/Short、Buy/Sell、Market/Limit、语言、主题、滑点。

---

## D. forms（10）

### Field

`.nui-field`（flex 纵向，gap 8）。属性：`label`、`labelAside`（label 行右侧）、`hint`、`error`、`hideLabel`。自动接线见 `03 §5`。

### Input / Textarea / Select

- `.nui-input` / `.nui-textarea` / `.nui-select`：`min-height: control-h`、`padding: 0 14px`、1px `border`、`surface` 底、15px/1.4；placeholder `text-muted`。
- hover 边框 `border-strong`；focus 边框 `border-focus` + `inset 0 -2px 0 accent`；`aria-invalid` 时边框 `negative`；disabled `.5` + `not-allowed`。
- `mono`（Input）：等宽 14px，用于地址/哈希输入。
- Textarea：`min-height:104px`、上下 12px、`resize: vertical`、行高 1.6。
- Select：原生 `<select>`，右侧留 38px，箭头用两条 5×5 的 45°/135° 线性层绘制（这是唯一允许的"渐变"，仅用于画箭头）。

### InputGroup

`.nui-input-group`（48px、1px 边框）+ `__addon`（左右 14px、`text-muted`、14px）。`start`/`end` 插入装饰（单位、符号、按钮）。内部 input 无边框无阴影；容器 `:focus-within` 走 focus 样式。用于「Supply [TKN]」「[%] 转账费」。

### SearchInput

- `.nui-search` + `.nui-search__input`（无边框，只有 1px 底边；`padding:10px 28px 10px 0`；14px）+ `__hint`（右侧 `/` 快捷键提示，11px 等宽，1px 边框，`aria-hidden`）。
- 属性：`label`（必填）、`shortcut`（默认 true）、`onClear`。`/` 聚焦（列表页可关）、Esc 清空。focus 底边转 `accent`。

### Switch

`.nui-switch`（40×22、1px `border-strong`、`surface-sunken`）+ `::after` 滑块（14×14、`text-muted`）。`role="switch"` + `aria-checked`；开启：底色与边框 `accent`，滑块 `on-accent` 并右移 18px。`label` 必填，渲染为相邻文本。

### Checkbox

`.nui-check`（inline-flex、gap 10、14px/1.5）+ 原生 `input[type=checkbox]`（16×16、`accent-color: accent`、`margin-top:2px`）。

### Slider

- `.nui-slider`（`--warning`/`--negative` 换色）+ `__input`（原生 range，高 22）+ `__marks`/`__mark`。
- 轨道 4px：已选部分用线性渐变（`--_pct`）填 `--_c`，其余 `border`。滑块 16×16、2px 边框、直角。
- 属性：`value`、`onChange`、`min`、`max`、`step`、`marks: number[]`、`format`、`label`、`tone`。
- a11y：`aria-label` + `aria-valuetext`（格式化读数）；刻度为 `tabIndex={-1}` 的按钮，点击跳值。

### FileDrop

`.nui-filedrop`（32px 20px 内边距、1px 虚线 `border-strong`、`surface-sunken`、居中）。`data-over` 时边框 `accent` + 8% 染色，`data-invalid` 时 `negative`。`__label`（600）、`__hint`（12px muted）、`__browse`（下划线 `accent`）。属性：`onFiles`、`accept`、`maxSize`（字节）、`multiple`、`label`、`hint`。超限提示 `fileTooLarge`。

---

## E. navigation（6）

### ZcashMark

官方标记，`size` 默认 40，`variant: 'color'|'mono'`，不改色；有 `title` 时 `role="img"` 否则 `aria-hidden`。默认链接到 `https://z.cash/`。

### Brand

`.nui-brand`：`__mark`（40×40）+ `__name`（18px/600、字距 -0.01em）+ `__sub`（左侧 1px `border`、`padding-left:14px`、12px/500 大写/字距 .16em、`text-muted`；≤480px 隐藏）。
**产品名不得包含 "Zcash"**，且比 Zcash 标记显眼。

### Header

- `.nui-header`（高 `header-h` 88px，`bg`，`z-index: --nui-z-sticky`）+ `--sticky`（`position:sticky; top:0`）+ `--bordered`（底边 1px）+ `__inner`（`height:100%`、flex、`gap:40px`）+ `__actions`（`gap:16px`、`margin-left:auto`）。
- `.nui-nav`（`gap:34px`、`margin-left:auto`）+ `.nui-nav__link`（12px/500 大写/字距 .16em、`text-muted`；底部 -8px 处 1px `accent` 下划线，hover/当前项 `scaleX(1)`；当前项文字 `text`）。
- 分组（有 `children`）：按钮 `.nui-nav__trigger` + `aria-expanded` + `aria-controls`；面板 `.nui-nav__panel`（`top:100%`、`left:-20px`、`margin-top:22px`、2 列 `minmax(220px,1fr)`、`max-width: min(560px,90vw)`、`padding:12px`、1px 边框、`surface-raised`、`nui-rise` 入场、顶部 24px 悬停桥）+ `.nui-nav__item`（`padding:10px 12px`、左侧 2px 透明边框；当前项左边框 `accent` + `surface-sunken`）+ `__item-label`（14px/600）+ `__item-desc`（12px、`text-muted`）。
- 移动端：`@1100px` 隐藏 nav，显示 `.nui-header__menu`（IconButton）打开 Drawer；Drawer 内 `.nui-mobile-nav`（分组标题 11px/700 大写 + 链接 16px/500、行间 1px `border-soft`）。
- 属性：`brand`、`nav: NavItem[]`、`actions`、`sticky`、`bordered`、`renderLink`（路由适配器，注入 `href`/`aria-current`/`onClick`）、`mobileActions`、`menuLabel`。

### Breadcrumb

`.nui-breadcrumb`（flex wrap、gap 8、12px、`text-muted`；`li + li::before` 为 `/`、颜色 `text-decorative`）。末项 `aria-current="page"` 且用 `<span>`。

### Footer

- `.nui-footer`（`padding:56px 0 64px`、底色 `footer-bg`、12px 文字 `#cbcbcb`）+ `__grid`（`1.5fr repeat(var(--nui-footer-cols,3),1fr)`、`gap:40px`）。
- `__title`（11px/700 大写/字距 .16em、白色）、`__links`（`gap:11px`，hover `gold`）、`__tagline`（`max-width:28ch`、`#9a9a9a`）、`__legal`（`margin-top:56px`、`padding-top:20px`、顶部 1px `rgba(255,255,255,.16)`、12px）。
- 断点：860px → 2 列；640px → 1 列 + legal 纵向。
- **`disclaimer` 恒定渲染**（默认 `DEFAULT_DISCLAIMER`），可改写措辞不可删除。

### SubNav

`.nui-subnav`（`gap:28px`、底边 1px、可横向滚动）+ `__link`（`padding:14px 0`、14px/600、`margin-bottom:-1px`、底部 2px 透明；`aria-current="page"` → 文字 `text` + 底边 `accent`）+ `__badge`（18px 最小、1px 边框、11px/600）。用于产品内分页导航（是链接不是 tab）。

---

## F. surfaces（13）

### Card

`.nui-card`（`padding: card-pad`、1px `border`、`surface`、`radius-base`、纵向 flex）；`--interactive` 时 `cursor:pointer`，并有底部 2px `accent` 规则 `scaleX(0)→1`（hover/focus-within）。
子元素：`__head`（flex、gap 14、下边距 10）、`__logo`（42×42、1px 边框、`surface-sunken`；hover 变 `accent`）、`__index`（右上角、11px 等宽、`text-decorative`、`aria-hidden`，两位补零）、`__title`（24px/28px/500 大写/字距 -0.35px、右侧留 30px）、`__desc`（14px/1.62、`text-secondary`、默认 3 行截断 `--nui-card-lines`）、`__foot`（顶部 1px `border-soft`、`margin-top:auto`、`padding-top:14px`）、`__tags`（11px/600 大写/字距 .12em `text-muted`，项间 `/`）、`__link`（11px/500 大写/字距 .16em + 箭头，hover 箭头右移 5px）；`__link--stretched::before { inset:0 }` 让整卡可点。

`ProjectCard` 是 Card 的成品变体：`name`、`description`、`href`、`tags[]`、`logo`、`index`。

### Panel

`.nui-panel`（1px `border`、`surface`）+ `__head`（`padding:16px card-pad`、底边 1px、flex 两端对齐）+ `__title`（15px/1.3/600）+ `__body`（`padding: card-pad`）+ `__foot`（`padding:14px card-pad`、顶边 1px）；`--sunken` 换 `surface-sunken` 底。
属性：`title`、`actions`、`footer`、`sunken`、`flush`（`flush` 时 body 不加内边距，用于内嵌 DataTable）。

### Stats / Stat

`.nui-stats`（flex wrap、gap `24px 56px`）+ `--divided`（每项左侧 `padding-left:56px` + 1px 左边框）。
`.nui-stat`：`__label`（11px/700 大写/字距 .16em、`text-muted`）+ `__value`（40px/900、字距 -0.02em、tabular；内部 `<small>` 为 .45em/600 `text-muted`）；`--sm` 时 value 26px/800。
640px：gap 20/32px，divided 的分隔线与左内边距取消，value 28px。

### Badge

`.nui-badge`：`min-height:22px`、左右 8px、1px 边框（`color-mix(_c 40%, transparent)`）、11px/600 大写/字距 .1em；`--dot::before` 6px 圆点；色板 `--positive/--negative/--warning/--info/--accent`（accent 为实心 `accent` 底 + `on-accent` 文字）；`--solid` 加 12% 底色。

### Alert

`.nui-alert`：`padding:14px 16px`、1px 边框 + 左侧 2px `_c` 竖线、14px/1.6；`__title`（600）+ `__body`（`text-secondary`）。色调 `--positive/--negative/--warning/--shielded`（shielded 用 `privacy-shielded`）。`negative` 时 `role="alert"`，其余 `role="status"`。
**风险披露必须用 `--warning`**，且文案具体（见 `01 §7`）。

### DataTable

- `.nui-table-wrap`（1px 边框 + `overflow-x:auto`；在 Panel 内边框归零）+ `.nui-table`（`border-collapse: collapse`、14px）。
- 单元格 `padding: cell-py cell-px`、`white-space: nowrap`、垂直居中；`thead th` 粘顶、`surface` 底、底部 1px、11px/600 大写/字距 .12em、`text-muted`；`tbody tr + tr` 顶部 1px `border-soft`；行 hover 背景 `surface-sunken`。
- 数字列 `.is-num`：右对齐 + tabular。
- `__sort`：继承表头字体、hover 变 `text`；激活列 `th[aria-sort]` 显示 `↑`/`↓`。
- 属性：`columns: { key, header, cell, numeric?, sortValue?, width? }[]`、`rows`、`rowKey`、`loading`（`aria-busy` + 保留表头 + 骨架行）、`empty`（空态节点）、`onRowClick`、`defaultSort: { key, direction }`。
- 行点击只能增强，不能是唯一入口（键盘用户需要行内可聚焦链接/按钮）。

### KeyValue

`.nui-kv`（`grid-template-columns: minmax(120px,max-content) minmax(0,1fr)`、14px）；`dt`（右侧 24px、`text-muted`）、`dd`（右对齐、tabular、`overflow-wrap:anywhere`）；行 `padding:10px 0` + 顶部 1px `border-soft`（首行无）；`--left` 让 dd 左对齐（长文本/地址用）。

### Stepper

`.nui-stepper`（grid、`list-style:none`、`counter-reset`）+ `.nui-step`（`grid-template-columns: 28px 1fr`、gap 14、`padding-bottom:22px`；列间 1px 连接线，`left:13.5px`、`top:30px`）。
`__marker`：28×28 圆形、1px `border-strong`、`surface` 底、11px 等宽；空内容时用 CSS 计数器显示序号。
状态（`data-state`）：
- `active`：边框 `accent` + 3px `accent` 25% 光环；
- `complete`：底色与边框 `accent`、文字 `on-accent`、内容 `✓`，连接线变 `accent`；
- `error`：边框与文字 `negative`、内容 `!`；
- `pending`：标题 `text-muted`。
`--horizontal`：`grid-auto-flow: column` + 连接线改为顶部水平线（`top:13.5px`）。
`aria-current="step"` 标在 active 项。

### Progress / Skeleton / EmptyState

| 组件 | 规格 |
| --- | --- |
| `Progress` | 4px 高、底 `border`；填充 `accent`、宽度 `--nui-value%`、0.5s 过渡；`role="progressbar"` + `aria-valuemin/max/now`；无 value 时 `--indeterminate`（30% 宽条 1.4s 循环） |
| `Skeleton` | 1px 高度自适应块；渐变 `border-soft→border→border-soft` 200% 尺寸 + 1.6s shimmer；`aria-hidden` |
| `EmptyState` | `padding:80px 20px 88px`、居中；标题用衬线 `display-s`；hint `max-width:46ch`、14px、`text-muted`、下边距 24px；底部一个动作。空表格/空列表/无搜索结果都用它 |

---

## G. overlays（3）

### Dialog

- 原生 `<dialog class="nui-dialog">`，`width: min(100% - 32px, var(--nui-dialog-w, 480px))`、`max-height: min(100% - 48px, 760px)`、1px 边框、无阴影；`::backdrop` 用 `scrim`。
- `open` 时 `display:flex; flex-direction:column` + `nui-rise` 入场（12px 上移 + 淡入）。
- `__head`（`padding:18px card-pad`、底边 1px，标题 16px/1.3/600）、`__body`（`padding: card-pad`、`overflow:auto`）、`__foot`（`padding:16px card-pad`、顶边 1px、右对齐、gap 16）。
- 属性：`open`、`onClose`、`title`、`footer`、`width`、`dismissible = true`。
- `dismissible=false`（签名/提交中）时忽略 Esc 与背板点击，并且关闭按钮消失。

### Drawer

`.nui-drawer`，`width: min(100% - 40px, 380px)`、全高、右侧（`margin:0 0 0 auto`、左边框 1px）；`data-side="left"` 翻转；`__body` 占满剩余高度；入场 ±24px 位移 + 淡入。用于移动端导航、下单详情、领取代币。

### ToastProvider / useToast

- `.nui-toaster`：`position:fixed; right:20px; bottom:20px; z-index:--nui-z-toast`、纵向 gap 10、`width: min(100% - 40px, 380px)`、`role="region" aria-live="polite" aria-label={notifications}`、`pointer-events:none`。
- `.nui-toast`：`padding:14px 16px`、1px 边框 + 左侧 2px `accent` 竖线、`surface-raised`、14px/1.5、入场 `nui-rise`；`__title` 600、`__desc` `text-secondary`；色调 `--positive`/`--negative`。
- API：`toast({ title, description?, tone?, duration?, action? }) => id`、`dismiss(id)`。`negative` 用 `role="alert"`，其余 `role="status"`。
- 交易结果必须走 toast，不要在页面里内联插一条成功提示。

---

## H. zcash（14）

### Address

`.nui-address`（inline-flex、gap 8、13px 等宽）+ `__text`（省略号截断）+ `__type`（类型标签：10px/600 大写/字距 .08em、1px 边框、`padding:2px 5px`）。

- 属性：`address`、`truncate: [head,tail] | false`、`copyable`、`showKind`、`href`。
- 类型由 `parseAddress` 推导：Unified / Sapling / Transparent / TEX；Unified 与 Sapling 的类型标签改用 `privacy-shielded` 边框与文字。
- `--full` 时允许换行（`word-break: break-all`），用于详情页与收款页。
- 复制按钮 24×24，成功后 1.5s 显示 `data-copied`（`positive` 色）并播报 `copied`。

### Hash

`.nui-hash`：与 Address 同构（13px 等宽、`__text` 截断），无类型标签；`href` 时渲染内链，hover 变 `accent-text`。用于 txid、block hash、state root。

### CopyButton / useCopy

`.nui-copy`（24×24、无底色、`text-muted`；hover 变 `text` + 边框）；`value`、`label`（必填，作为 `aria-label`）。hook 返回 `{ copied, copy }`。成功态必须播报（`aria-live="polite"` 内的 `copied` 文本）。

### Amount

`.nui-amount`（inline-flex、baseline、gap .3em、tabular、`white-space:nowrap`）+ `__unit`（.78em/500、`text-muted`）+ `__fiat`（左 0.4em、.85em、`text-muted`）。

- 属性：`value`（bigint 基础单位）、`decimals=8`、`symbol='ZEC'`（`null` 表示不显示单位）、`exact`、`fiat`、`hidden`、`sign:'auto'|'none'`、`size:'md'|'lg'`。
- 规则：默认最多 4 位小数；非零但过小显示 `<0.0001`，**永不显示 0**；`exact` 用于确认页；`hidden` 渲染 `••••••`（`aria-hidden` 的点号）+ `.sr-only` 文本 `Amount hidden`，`fiat` 同时隐藏；`sign='auto'` 时正值加 `+`、负值加 `-` 并自动着色；`lg` 为 32px/800/字距 -0.02em；`title` 属性提供完整精确值（隐藏时不提供）。

### PriceChange

`.nui-delta`（600、tabular）：`--up` 绿 + `▲ `、`--down` 红 + `▼ `（箭头 .7em）。输入为百分数。

### PrivacyBadge

`.nui-privacy`（`min-height:22px`、`padding:0 8px 0 6px`、1px 边框 `45%` 混合、11px/600 大写/字距 .1em、图标 12×12）：

| level | 颜色 | 附加 |
| --- | --- | --- |
| `shielded` | `privacy-shielded` | 10% 底色 |
| `confidential` | `privacy-confidential` | 仅边框与文字 |
| `public` | `privacy-public` | **虚线边框** |

`describe=true` 时提供 tooltip/说明（用 `privacy*Desc` 文案）；`label` 可覆写显示文字。`usePrivacyLevel(level)` 返回 `{ label, description }`。

### PoolBadge / ChainBadge

- `.nui-pool`（12px/500、`text-secondary`、前置 8px 圆点）：`orchard` 实心 `privacy-shielded`；`sapling` 空心（2px 内嵌环）；`transparent` 1px 空心环。
- `.nui-chain`（13px/500 + 可选图标）：仅显示链名。

### TokenIcon / TokenPair

`.nui-token-icon`：圆形（`radius-pill`）、默认 24px（`--sm` 18、`--lg` 36）、1px 边框、`surface-sunken` 底、字母回退为 42% 字号/700；`--zec` 用 `gold` 底 + 白色字母；`img` 铺满 `object-fit:cover`。
`TokenPair`：两个图标重叠 -30% 尺寸，第二个加 2px `surface` 外环。

### TxStatus

`.nui-tx-status`（13px/500 + 8px 圆点、`white-space:nowrap`），状态映射：

| status | 颜色 | 动效 |
| --- | --- | --- |
| `pending` / `confirming` | `warning` | 圆点 1.4s 脉冲（50% opacity .3） |
| `confirmed` | `positive` | — |
| `failed` / `expired` | `negative` | — |
| `refunded` | `info` | — |

文本用 `tx*` 消息；有 `confirmations`/`required` 时追加 `3 / 10`；`aria-live="polite"`。

### SyncProgress

`.nui-sync`（grid、gap 8、最小宽 200）+ `__row`（12px、`text-muted`、tabular、两端对齐）+ `__label`（600、`text`）。展示扫描高度、链尖、起点与 ETA，配一条 `Progress`。

### MemoInput

`.nui-memo`（相对定位）+ `.nui-textarea`（等宽 13px、底部留 30px）+ `__count`（右下 12px/10px、11px 等宽，`data-over` 时 `negative`）。

- `maxBytes = 512`（UTF-8 字节）；`recipient` 为透明地址时禁用并显示 `memoTransparent` 提示。
- 输入时显示 `已用/512 bytes`；超限不截断输入，但阻止提交并给错误。

### ReceiveQR

`.nui-qr`：`padding:16px`、**背景恒为白色**（深色主题下也是，保证静区）、1px 边框；`svg` 尺寸 `--nui-qr-size`（默认 200）；`__caption`（10px 上边距、11px/500 大写/字距 .1em、`#5c5357`）。`value` 可以是地址或 ZIP-321 URI，配 `qrFor` 文案。

### DetailList（同时属 defi 组）

`.nui-detail-list`（grid、gap 8、13px）：每行两端对齐、标签 `text-muted`、值右对齐 tabular。用于费率、路由、滑点、手续费。

---

## I. defi（5）

### TokenAmountInput

- 结构：`.nui-token-input`（`padding:16px 18px`、1px 边框、`surface-sunken` 底、grid、gap 10）
  - `__top`：`__label`（11px/700 大写/字距 .16em）+ 右侧 `aside`（如 `PrivacyBadge`）
  - `__main`：`__amount`（`flex:1`、无边框、30px/600/字距 -0.02em、tabular、placeholder `text-decorative`）+ `TokenSelect`（`min-height:40px`、`padding:0 12px 0 8px`、15px/600、6px 折角箭头；无选中代币时 `--empty` 用 `accent` 实心 + `on-accent`）
  - `__bottom`：左侧 `fiat`（如 `≈ $117.40`），右侧 `__balance`（`Balance 2.5` + `__max` 按钮：10px/600 大写、1px `border-strong`、hover 边框 `accent`）
- 属性：`value`（十进制字符串）、`onChange`（已净化）、`token`、`onTokenClick`、`label`、`aside`、`fiat`、`onMax`（传入十进制字符串，不是 bigint）、`readOnly`、`invalid`。
- 行为：`:focus-within` → 边框 `border-focus` + `inset 0 -2px 0 accent`；`data-invalid` → 边框 `negative`；只读输入 `cursor:default` 且不显示 MAX。
- 规则：value 永远是字符串；提交前 `parseUnits`；`onMax` 用 `formatUnits(balance, decimals)` 生成字符串。

### TokenPicker

`Dialog` 内含：搜索框（autoFocus、`searchTokensPlaceholder`）+ `.nui-token-list`（`role="listbox"`、`max-height:360px`、`overflow-y:auto`）+ `__item`（`padding:10px 12px`、gap 12；hover/选中 `surface-sunken`；`aria-disabled` 时 .45 透明度）。
属性：`open`、`onClose`、`tokens`、`onSelect`、`selected`、`disabled`、`popular`。行内容：TokenIcon + 符号 + 名称 + 右侧余额（13px、tabular、`text-secondary`）。

### SwapSwitch

`.nui-swap-switch`：36×36、1px 边框、`surface`、`margin:-14px auto`、`z-index:1`（压在两个输入之间）；hover 旋转 180° + 边框 `accent`。`label` 必填（`switchTokens`）。

### HealthFactor

`.nui-health`（grid、gap 8）+ `__row`（label 11px/700 大写 + value 20px/800 tabular）+ `__track`（6px 渐变：`negative` 0–33%、`warning` 33–50%、`positive` 50–100%，opacity .85）+ `__marker`（2×14px 竖标，`left: clamp(0%, value%, 100%)`）。

- 属性：`value`（`Infinity` = 无负债）、`liquidation = 1`、`warning = 1.5`、`max = 3`。
- 分区：`data-zone="safe|warning|danger"`，value 颜色对应 `positive/warning/negative`；`role="meter"` + `aria-valuemin/max/now` + `aria-valuetext="2.41, safe"`。

---

## J. trading（6）

### OrderBook

`.nui-book`（12px、tabular）；`__head` 与 `__row` 共用 `grid-template-columns: 1.1fr 1fr 1fr`、左右 `cell-px`；`__row` 高 22px，深度条为右侧填充（`--_depth` 宽度、`opacity:.12`）；`--bid` 绿 / `--ask` 红（价格同色）；`__mid` 行显示价差与最新价（`strong` 16px），`__last--up/down` 着色。

属性：`bids`、`asks`、`rows=8`、`priceDecimals`、`last`、`lastDirection`、`onSelectPrice`。每行可聚焦（有回调时 `tabIndex=0`）并有 `aria-label="Bids 912.40, Size 1.25"`。

### LeverageSlider

`.nui-leverage__head` + `__value`（48px 最小、1px 边框、14px/700 tabular、`--warning`/`--negative` 着色）。内部是 `Slider`，`warnAbove` 以上转 warning。`max` 默认 50、`warnAbove` 默认 10。

### PnL

`.nui-pnl`（600、tabular；`small` 为 .85em/500 百分数）；正值 `positive`、负值 `negative`。`currency` 默认 USD。

### PositionTable

基于 `DataTable`：列 = 市场、方向（`Badge` Long/Short）、数量、开仓价、标记价、强平价（`warning` 色）、杠杆、PnL（`PnL` 组件）、操作（`Button size="sm"` 平仓）。`positions`、`onClose`、`priceDecimals`。

### LiveValue

`.nui-live`（tabular）：值变化时闪一次背景（0.9s `nui-flash-up/down`），可选常驻着色（`colored`）。`aria-live="off"`（高频变化不播报）。

### Countdown

`.nui-countdown`（tabular）：数字 1.25em/700 + 单位 .8em/`text-muted`；`<time dateTime>`；到点后显示 `ended`。`compact` 默认 true。

---

## K. charts（10）

所有图表共享：容器 `.nui-chart`（相对定位、`width:100%`、`outline-offset:4px`）+ 自适应宽度（观察容器尺寸）+ 轴文字 `.nui-chart__axis`（11px、`text-muted`、tabular）+ 网格 `.nui-chart__grid`（1px `chart-grid`）+ 参考线 `.nui-chart__ref`（1px 虚线 3/4、`text-muted`）+ 参考标签（10px/600 大写）+ 十字线 `__crosshair`（1px `border-strong`）+ tooltip `__tip`（绝对定位 top 4、`translateX(-50%)`、`min-width:120px`、`padding:8px 10px`、1px 边框、`surface-raised`、12px/1.5）+ 图例 `__legend`（12px、`text-secondary`、项目前 8×8 色块）+ 空态 `__empty`（虚线边框 + `chartEmpty` 文案）。

序列取色顺序：`chart-1 → chart-5`，网格 `chart-grid`。

| 组件 | 图表类型 | 关键规格 |
| --- | --- | --- |
| `LineChart` | 折线/面积 | 线宽 1.75、`linejoin:round`；`area` 用同色垂直渐变（顶部有透明度→底部透明）填充到基线；`dashed` 用 `4 4`；点数 <2 时渲染空 svg；标记点 r=4.5、填充 `surface`、描边 2；`series[{name,data,color?,area?,dashed?}]`、`labels`、`height`（默认 240）、`yTicks=4`、`xTicks=5`、`yFormat`、`referenceY[]`、`referenceX[]`、`markers[]`、`curve:'linear'|'step'`、`legend`、`yMin/yMax` |
| `PriceChart` | `{t,value}` 适配器 | 默认 `area`、`height 240`、价格格式可注入；概率序列用 `yMin=0 yMax=1` 且格式化为百分比 |
| `CandleChart` | K 线 + 成交量 | 默认高 320；蜡烛实心涨绿/跌红，影线 1px；成交量区占高度 16%、柱填充同色 `fillOpacity:.28`；顶部 `__ohlc` 读数行（12px、标签 `text-muted`、值 `text` 600，`C` 值按涨跌着色，含 `V` 成交量）；最后一根价格标签用 `accent` 底 + `on-accent`；支持十字线 |
| `BarChart` | 柱状 | 默认高 200；柱宽自适应，`signed` 时正负分别着色；`yFormat`、`xTicks=6` |
| `DonutChart` | 环形 | 默认 `size 168`、`thickness 18`；中心 `center` 内容（tabular）；图例纵向；起画角 -90° |
| `DepthChart` | 累计深度 | 默认高 200；bids `positive`、asks `negative`，线宽 1.5 的阶梯面积；价格格式可注入 |
| `BondingCurve` | 联合曲线 | 默认高 240、60 个采样点；虚线画完整曲线、实心填充已售部分、当前供应量标记；`price(supply)`、`maxSupply`、`sold`、`nowLabel` |
| `BondingCurveChart` | 别名 | 与 `BondingCurve` 行为一致（LaunchPad 语义命名） |
| `Sparkline` | 迷你趋势 | 默认 96×28；按首尾方向自动绿/红，可 `tone:'auto'|'neutral'|'positive'|'negative'`；无 label 时 `aria-hidden` |
| `Legend` | 图例 | 独立可复用，`items:[{label,color,value?}]` |

交互：容器 `tabIndex={0}`，←/→ 移动读数索引，`blur` 复位；`svg` 带 `role="img"` 与 `aria-label` 摘要（含单位与范围）。

---

## L. data（2）

### Meter

`.nui-meter`（grid、gap 8）+ `__head`（13px 两端对齐，`__label` muted、`__value` 600 tabular）+ `__track`（8px、1px `border`、`border-soft` 底）+ `__fill`（`--_pct` 宽度、0.5s 过渡）+ `__mark`（1px 竖线，超出上下 4px）+ `__marks`（14px 高刻度文字）。
色调 `accent`（默认）/`positive`/`warning`/`negative`；`role="meter"` + `aria-valuenow/max`。
用途：配额、募资进度、利用率、份额。

### UptimeBar

`.nui-uptime`（grid、gap 8）+ `__head`（13px、`strong` tabular）+ `__bar`（`grid-auto-flow: column`、gap 2px、高 28）+ `__day`（`positive`、opacity .75；hover 1）。
`data-status`：`degraded` → `warning`，`outage` → `negative`，`none` → `border`。整体 `role="img"` + `aria-label="{label}: 99.98%"`。

---

## M. prediction（2）

### OutcomeButton

`.nui-outcome`（`min-height:44px`、左右 14px、1px 边框、14px/600、两端对齐、`overflow:hidden`）；`::before` 用 `--_pct` 宽度做概率填充（`opacity:.1`，色为 `--_c`）；`aria-pressed` 选中时边框与内环用 `--_c`；右侧 `__price`（tabular、`--_c`）。
色调 `positive`（Yes）/`negative`（No）/中性。

### ProbabilityBar

`.nui-probbar__track`（flex、高 8、gap 2）+ `__legend`（12px、色块 8×8）。`role="img"` + `aria-label` 汇总各结果百分比。

---

## N. content（9）

### CodeBlock

`.nui-code`（1px 边框、`inverse-bg` 底 + `inverse-text` 文字：浅色主题下为梅紫、night 主题下反转为纸白，保证与页面形成反衬）+ `__head`（`min-height:38px`、11px/500 大写/字距 .1em、`inverse-text-secondary`）+ `__tabs`/`__tab`（选中底部 2px `accent`）+ `__pre`（`padding:16px`、13px/1.65 等宽、横向滚动）。
属性：`code`、`snippets[{label,code}]`、`title`、`language`、`copyable=true`。

### SecretField

`.nui-secret`（`padding:4px 4px 4px 10px`、1px 边框、`surface-sunken`）+ `__value`（13px 等宽、省略号）。`visibleTail=4` 为默认显示末位；眼睛按钮切换（`reveal`/`hide` 文案 + `aria-pressed`）。用于 API key、查看密钥。

### Timeline

`.nui-timeline`（`list-style:none`）+ `__item`（`grid-template-columns:20px 1fr`、gap 12、`padding-bottom:18px`；列间 1px 线 `left:9.5px`）+ `__dot`（20×20 圆、2px `_c` 边框、`surface` 底）+ `__row`（两端对齐）+ `__title`（14px/600）+ `__time`（12px、`text-muted`、tabular）+ `__desc`（13px、`text-secondary`）。
`data-tone`：`accent`/`positive`/`negative`/`info`。

### Pagination

`.nui-pagination`（flex wrap、gap 4）+ `__btn`（最小 34×34、13px/500、tabular；hover 边框；disabled .4）+ `__num[aria-current="page"]`（边框 `text`、700）+ `__gap`（`…`）。内建 `paginationRange(page,pages,siblings)`。

### Tooltip / InfoTip

`.nui-tooltip`（相对定位）+ `__bubble`（绝对定位、底部 `calc(100% + 8px)`、`z-index: overlay`、`max-width:260px`、`padding:8px 10px`、`inverse-bg`/`inverse-text`、12px/1.5、无圆角、`pointer-events:none`、`opacity/visibility` 过渡）；hover 或 `focus-within` 显示；Esc 隐藏（`data-hidden`）；`data-side="bottom"` 翻转。
`InfoTip`：`.nui-infotip` 15×15 圆形按钮，衬线 9px `i`，`cursor:help`，`aria-label` 必填。

### Disclosure

原生 `<details class="nui-disclosure">`（底部 1px 边框）+ `__summary`（`padding:16px 0`、15px/600、去掉默认三角、右侧 `+`/`−` 号 22px/300）+ `__body`（`padding:0 0 18px`、14px/1.7、`text-secondary`）。用于 FAQ、高级设置、规则说明。

### Identicon

`.nui-identicon`（`variant="grid"` 时圆形）；从 `value` 哈希确定性生成（网格或抽象图形），`size` 默认 32，`label` 提供时 `role="img" aria-label`，否则 `aria-hidden`。

### NFTCard

`.nui-nft`（1px 边框、纵向 flex）+ `__media`（`aspect-ratio:1`、`surface-sunken`、溢出隐藏；hover 图片 `scale(1.03)`）+ `__badge`（左上 10px）+ `__body`（`padding:14px 16px 16px`、grid gap 4）+ `__collection`（11px/600 大写/字距 .1em、muted）+ `__name`（16px/600、单行省略）+ `__foot`（两端对齐、tabular）+ `__price`（700）+ `__meta`（12px muted）。无图片时用 `Identicon variant="art"` 生成替身。

---

## O. payments（2）

### BatchPayments

`.nui-batch`（grid、gap 12）：`__summary`（flex wrap、gap 8/28、14px；数值 `b` 用 `text` + tabular：总人数、总额、有效/无效数）+ 表格（`.nui-batch-table` 容器）+ `__recipient`（grid、13px；无效时子元素 `negative`）+ `__memo`（最大 180px、省略号）+ `__issue`（`negative`、600）。

表格列：`#`、收款人（`Address` + 名称）、金额（`Amount`，tabular）、隐私（`PrivacyBadge`，按地址推导）、状态（`TxStatus`）、操作（移除 `IconButton`）。
属性：`rows: PaymentRow[]`、`onRemove`、`decimals=8`、`symbol`、`network`、`statuses`、`actions`。

### BatchPaymentTable

在 `BatchPayments` 之上增加：CSV 粘贴区（`Textarea` + `pasteCsvHint` + `importCsv` 按钮，导入模式 `replace`/`append`）、行删除、逐行校验（地址/金额/memo/重复）、合计。
属性：`rows`、`onChange`、`importMode='replace'`、`showImport=true`、`decimals`、`symbol`、`network`、`statuses`、`actions`。
行为：解析用 `parsePaymentCsv` + `validatePayments`；只要存在无效行就禁用提交，并在 summary 显示 `rowsInvalid`。

---

## P. i18n（1）

### LocaleProvider / useNuiLocale

见 `03 §8`。返回 `{ locale, m }`，无 provider 时默认英文包与 `en-US` 格式。中文的日期/数字格式跟随 `zh-CN`。

---

## 实现优先顺序（建议）

1. **骨架**：ThemeProvider、Shell、Section、Stack、Cluster、Grid、Display / Heading / Eyebrow / Lead。
2. **交互原子**：Button、IconButton、Field、Input、Textarea、Select、SearchInput、Switch、Checkbox、Segmented、Tabs、ChipGroup。
3. **容器**：Panel、Card、Badge、Alert、KeyValue、EmptyState、Skeleton、Progress、DataTable、Stats / Stat。
4. **浮层**：Dialog、Drawer、ToastProvider。
5. **Zcash 域**：Address、Hash、CopyButton、Amount、PrivacyBadge、PoolBadge、TxStatus、MemoInput、ReceiveQR、TokenIcon。
6. **DeFi/交易**：TokenAmountInput、TokenPicker、SwapSwitch、DetailList、HealthFactor、OrderBook、LeverageSlider、PnL、PositionTable、LiveValue、Countdown。
7. **图表**：LineChart → PriceChart → BarChart → DonutChart → Sparkline → CandleChart → DepthChart → BondingCurve → Legend。
8. **其余**：Stepper、Timeline、Pagination、Tooltip、InfoTip、Disclosure、CodeBlock、SecretField、Identicon、NFTCard、Meter、UptimeBar、OutcomeButton、ProbabilityBar、BatchPayments、BatchPaymentTable、FileDrop、Breadcrumb、SubNav、Header、Footer、Brand。
