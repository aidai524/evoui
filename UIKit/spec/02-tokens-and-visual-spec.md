# 02 · Token 与视觉规范

实现顺序：先建 token 源，再生成 CSS 变量，最后才是组件。**所有视觉数值必须从这里取**，本文没写的值不允许自己发明（图表几何、图标内部像素除外）。

## 1. 三层结构

```
layer 1  primitive  原始值，永不被组件直接引用        →  --nui-color-gold
layer 2  base       与主题无关的尺度                   →  --nui-fs-h3 / --nui-space-6 / --nui-radius-base
layer 3  theme      每个主题一套语义映射（组件只读这层） →  --nui-accent / --nui-surface / --nui-text
         density    compact 覆盖层                     →  --nui-control-h: 36px
```

规则：

- 组件样式**只读 layer 2 与 layer 3**，不读 primitive。唯一例外是品牌深色区块（`nui-section--plum/navy`）与页脚，它们允许引用 primitive 的 `plum` / `navy` / `gold` / `night-text-2`，因为在两套主题下都必须是深色。
- 主题通过 CSS 变量的重新赋值实现，不用 JS 计算颜色，不用 `prefers-color-scheme` 之外的条件。
- 所有变量名以 `--nui-` 前缀；内置 token（primitive / base / paper / night / compact）生成在 `@layer nui3.tokens`，`defineTheme()` 生成的命名主题包在 `@layer nui3.theme`。

### 变量命名映射

| token 分组 | CSS 变量前缀 | 例 |
| --- | --- | --- |
| `primitive.color` | `color-` | `--nui-color-plum-900` |
| `primitive.font` | `font-` | `--nui-font-display` |
| `base.font-size` | `fs-` | `--nui-fs-display-l` |
| `base.line-height` | `lh-` | `--nui-lh-body` |
| `base.letter-spacing` | `ls-` | `--nui-ls-caps` |
| `base.space` | `space-` | `--nui-space-6` |
| `base.radius` | `radius-` | `--nui-radius-control` |
| `base.layout` | 无前缀 | `--nui-container` |
| `base.density` | 无前缀 | `--nui-control-h` |
| `base.motion` | 无前缀 | `--nui-dur-fast` |
| `base.z` | `z-` | `--nui-z-toast` |
| `theme.*` | 无前缀 | `--nui-text-secondary` |

## 2. Layer 顺序

```css
@layer nui3.tokens, nui3.theme, nui3.base, nui3.components, nui3.utilities;
```

- `nui3.base`：全局 reset + `body` 排版（仅完整包 `nui3.css` 包含；嵌入版 `components.css` 不含）。
- `nui3.tokens`：primitive、base 尺度、内置主题选择器（`:root`、`[data-nui-theme="paper"]`、`[data-nui-theme="night"]`、`@media (prefers-color-scheme: dark) { [data-nui-theme="auto"] }`）与 `[data-nui-density="compact"]`，全部在一个生成文件里。
- `nui3.theme`：只装 `defineTheme()` 产出的命名主题（`@layer nui3.theme { [data-nui-theme="name"] { … } }`），运行时注入。
- `nui3.components`：所有 `nui-*` 组件与基础排版类。
- 使用方写普通 CSS = 未分层，天然优先于所有 `@layer`，因此**不需要 `!important`** 就能覆盖。

## 3. Primitive（layer 1）

| 变量 | 值 | 用途 |
| --- | --- | --- |
| `--nui-color-plum` | `#271219` | 主墨色 / 深色区块背景 |
| `--nui-color-plum-950` | `#140a0d` | night 页面底 |
| `--nui-color-plum-900` | `#1d0e13` | night 表面 |
| `--nui-color-plum-800` | `#2b1820` | night 抬升表面 |
| `--nui-color-plum-700` | `#3d2730` | night 边框 |
| `--nui-color-plum-600` | `#5a4049` | night 强边框 |
| `--nui-color-navy` | `#141529` | 备选深色区块（与 plum 互斥） |
| `--nui-color-gold` | `#f3b724` | 唯一品牌强调色 |
| `--nui-color-gold-600` | `#e0a800` | 强调 hover |
| `--nui-color-gold-800` | `#8a6100` | 浅底上的强调文字（4.9:1） |
| `--nui-color-paper` | `#f3f1ef` | 暖纸页面底 |
| `--nui-color-paper-alt` | `#f7f7f7` | 备用浅底 |
| `--nui-color-white` | `#ffffff` | 卡片表面 |
| `--nui-color-black` | `#000000` | 页脚 |
| `--nui-color-line` | `#e3ded7` | 暖色发丝线 |
| `--nui-color-line-strong` | `#d5cec6` | 强发丝线 |
| `--nui-color-line-soft` | `#efece8` | 极浅分隔线 |
| `--nui-color-ink-700` | `#4b4146` | 引导段落 |
| `--nui-color-ink-600` | `#5c5357` | 次级文字（纸上 6.6:1） |
| `--nui-color-ink-500` | `#6b6667` | 弱化文字（纸上 5.0:1，AA 下限的替代品，不要用 z.cash 原始 `#797576`） |
| `--nui-color-ink-300` | `#b5adaf` | **仅装饰**（序号、分隔符），永不用于正文 |
| `--nui-color-night-text` | `#f3f1ef` | night 主文字 |
| `--nui-color-night-text-2` | `#c9bfc3` | night 次级文字 |
| `--nui-color-night-text-3` | `#9d8f95` | night 弱化文字 |
| `--nui-color-green-700` | `#1f7a3a` | 正向（浅底） |
| `--nui-color-green-300` | `#5fd08f` | 正向（深底） |
| `--nui-color-red-700` | `#b42318` | 负向（浅底） |
| `--nui-color-red-300` | `#ff8a7a` | 负向（深底） |
| `--nui-color-blue-700` | `#2f4a8a` | 信息 / 机密（浅底） |
| `--nui-color-blue-300` | `#9fb4ff` | 信息 / 机密（深底） |
| `--nui-font-display` | `"DM Serif Display", "Iowan Old Style", Georgia, serif` | 标题 |
| `--nui-font-sans` | `Inter, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif` | UI |
| `--nui-font-mono` | `"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace` | 地址/哈希/序号 |

## 4. Base 尺度（layer 2）

### 字号

| 变量 | 值 | 用途 |
| --- | --- | --- |
| `--nui-fs-display-xl` | `clamp(56px, 11vw, 160px)` | 巨型宣言（谨慎使用） |
| `--nui-fs-display-l` | `clamp(44px, 6.3vw, 90px)` | 首页/板块主标题 |
| `--nui-fs-display-m` | `clamp(36px, 4.9vw, 71px)` | Display 默认尺寸 |
| `--nui-fs-display-s` | `clamp(28px, 3.4vw, 42px)` | 页内标题、空状态标题 |
| `--nui-fs-h2` | `clamp(26px, 2.6vw, 37px)` | 区块标题 |
| `--nui-fs-h3` | `24px` | 卡片标题 |
| `--nui-fs-h4` | `18px` | 小节标题 |
| `--nui-fs-lead` | `18px` | 引导段落 |
| `--nui-fs-body` | `16px` | 正文 |
| `--nui-fs-small` | `14px` | UI 文字 / 表格 |
| `--nui-fs-label` | `12px` | 大写标签下限 |
| `--nui-fs-micro` | `11px` | 微标签、表头 |
| `--nui-fs-stat` | `40px` | KPI 数值 |

### 行高 / 字距

| 变量 | 值 | 说明 |
| --- | --- | --- |
| `--nui-lh-display` | `1.1` | 衬线标题 |
| `--nui-lh-heading` | `1.3` | 无衬线标题 |
| `--nui-lh-body` | `1.875` | 正文（品牌签名行高，`body` 默认） |
| `--nui-lh-ui` | `1.5` | UI |
| `--nui-lh-tight` | `1` | 单行数字/按钮 |
| `--nui-ls-display` | `-0.01em` | 衬线标题 |
| `--nui-ls-title` | `-0.35px` | 大写卡片标题 |
| `--nui-ls-caps` | `0.16em` | 大写标签与导航 |
| `--nui-ls-button` | `0.2em` | 大写按钮 |

### 间距（唯一合法取值）

| 变量 | 值 | 典型用途 |
| --- | --- | --- |
| `--nui-space-1` | `4px` | 图标与文字缝隙 |
| `--nui-space-2` | `8px` | label 与控件、行内小间隙 |
| `--nui-space-3` | `12px` | 紧密堆叠 |
| `--nui-space-4` | `16px` | Stack 默认 gap、面板头 |
| `--nui-space-5` | `20px` | 表单字段间距、网格间距 |
| `--nui-space-6` | `24px` | 卡片内边距、产品页区块间距 |
| `--nui-space-8` | `32px` | 门户区块间距、页头间距 |
| `--nui-space-10` | `40px` | 大块分隔 |
| `--nui-space-12` | `48px` | 页内大节 |
| `--nui-space-16` | `64px` | 营销小节 |
| `--nui-space-20` | `80px` | 空状态上下留白 |
| `--nui-space-24` | `100px` | 营销大节 |
| `--nui-space-32` | `130px` | 首页级节奏 |

### 圆角 / 布局 / 密度 / 动效 / 层级

| 变量 | 值 | 说明 |
| --- | --- | --- |
| `--nui-radius-base` | `0px` | 卡片、面板、对话框 |
| `--nui-radius-control` | `0px` | 按钮、输入、chip |
| `--nui-radius-pill` | `999px` | 仅 logo、token 图标、状态点、步进圆点 |
| `--nui-container` | `1360px` | 内容最大宽 |
| `--nui-gutter` | `clamp(20px, 3.5vw, 50px)` | 左右留白 |
| `--nui-header-h` | `88px` | 桌面页头高（≤860px 时 72px） |
| `--nui-section-y` | `clamp(64px, 9vw, 130px)` | 营销区块上下留白 |
| `--nui-grid-gap` | `20px` | 网格间距 |
| `--nui-control-h` | `48px` | 控件高 |
| `--nui-control-px` | `24px` | 控件左右内边距 |
| `--nui-card-pad` | `24px` | 卡片/面板内边距 |
| `--nui-cell-py` | `14px` | 表格单元格上下 |
| `--nui-cell-px` | `16px` | 表格单元格左右 |
| `--nui-dur-fast` | `0.2s` | 颜色/边框过渡 |
| `--nui-dur` | `0.3s` | 默认过渡 |
| `--nui-dur-slow` | `0.5s` | 展开/位移 |
| `--nui-ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | 统一缓动 |
| `--nui-z-sticky` | `20` | 页头、粘性表头 |
| `--nui-z-overlay` | `100` | 下拉面板、tooltip |
| `--nui-z-toast` | `110` | Toast |

### compact 密度（`[data-nui-density="compact"]`）

| 变量 | 值 |
| --- | --- |
| `--nui-control-h` | `36px` |
| `--nui-control-px` | `16px` |
| `--nui-card-pad` | `16px` |
| `--nui-cell-py` | `8px` |
| `--nui-cell-px` | `12px` |

用于交易/表格密集界面（Perps、Explorer）。切换密度只换这五个变量，组件代码不变。

## 5. 语义 token（layer 3，组件只读这层）

| token | paper | night |
| --- | --- | --- |
| `color-scheme` | `light` | `dark` |
| `--nui-bg` | `#f3f1ef` | `#140a0d` |
| `--nui-bg-alt` | `#f7f7f7` | `#1d0e13` |
| `--nui-surface` | `#ffffff` | `#1d0e13` |
| `--nui-surface-raised` | `#ffffff` | `#2b1820` |
| `--nui-surface-sunken` | `#f3f1ef` | `#140a0d` |
| `--nui-text` | `#271219` | `#f3f1ef` |
| `--nui-text-secondary` | `#5c5357` | `#c9bfc3` |
| `--nui-text-muted` | `#6b6667` | `#9d8f95` |
| `--nui-text-decorative` | `#b5adaf` | `#5a4049` |
| `--nui-border` | `#e3ded7` | `#3d2730` |
| `--nui-border-strong` | `#d5cec6` | `#5a4049` |
| `--nui-border-soft` | `#efece8` | `#2b1820` |
| `--nui-border-focus` | `#271219` | `#f3b724` |
| `--nui-accent` | `#f3b724` | `#f3b724` |
| `--nui-accent-hover` | `#e0a800` | `#e0a800` |
| `--nui-on-accent` | `#271219` | `#271219` |
| `--nui-accent-text` | `#8a6100` | `#f3b724` |
| `--nui-positive` | `#1f7a3a` | `#5fd08f` |
| `--nui-negative` | `#b42318` | `#ff8a7a` |
| `--nui-warning` | `#8a6100` | `#f3b724` |
| `--nui-info` | `#2f4a8a` | `#9fb4ff` |
| `--nui-privacy-shielded` | `#8a6100` | `#f3b724` |
| `--nui-privacy-confidential` | `#2f4a8a` | `#9fb4ff` |
| `--nui-privacy-public` | `#6b6667` | `#9d8f95` |
| `--nui-inverse-bg` | `#271219` | `#f3f1ef` |
| `--nui-inverse-text` | `#ffffff` | `#271219` |
| `--nui-inverse-text-secondary` | `#c9bfc3` | `#5c5357` |
| `--nui-inverse-accent-text` | `#f3b724` | `#8a6100` |
| `--nui-footer-bg` | `#000000` | `#000000` |
| `--nui-scrim` | `rgba(39,18,25,.55)` | `rgba(0,0,0,.66)` |
| `--nui-focus-ring` | `#f3b724` | `#f3b724` |
| `--nui-chart-1` | `#8a6100` | `#f3b724` |
| `--nui-chart-2` | `#2f4a8a` | `#9fb4ff` |
| `--nui-chart-3` | `#1f7a3a` | `#5fd08f` |
| `--nui-chart-4` | `#271219` | `#c9bfc3` |
| `--nui-chart-5` | `#6b6667` | `#9d8f95` |
| `--nui-chart-grid` | `#efece8` | `#2b1820` |

语义使用约定：

- `text` 用于标题与主体；`text-secondary` 用于说明段落与卡片描述；`text-muted` 用于标签、占位符、时间戳；`text-decorative` **只能**用于序号和分隔符（它在纸白上只有 2.2:1）。
- `surface` 用于卡片/面板/输入框；`surface-sunken` 用于内嵌区域（表格 hover、分段控件底、TokenAmountInput 底）；`surface-raised` 用于浮层（下拉面板、tooltip 反向用 `inverse-bg`、toast）。
- `accent` 只做填充与规则；作为文字时必须用 `accent-text`。
- `inverse-*` 是"深色区块里的浅色文字"：纸白主题下 `inverse-bg=plum`，night 主题下反转为纸白（用于 night 页面里的浅色强调块）。
- 图表序列严格按 `chart-1..5` 顺序取色，网格用 `chart-grid`。

### 对比度矩阵（必须逐条通过）

| 前景 on 背景 | 最低比 |
| --- | --- |
| `text` on `bg` / `surface` | 7:1 |
| `text-secondary` on `bg` / `surface` | 4.5:1 |
| `text-muted` on `bg` / `surface` | 4.5:1 |
| `accent-text` on `bg` / `surface` | 4.5:1 |
| `on-accent` on `accent` | 4.5:1 |
| `positive` / `negative` / `info` on `surface` | 4.5:1 |
| `privacy-shielded` / `privacy-confidential` / `privacy-public` on `surface` | 4.5:1 |
| `inverse-text` on `inverse-bg` | 7:1 |
| `inverse-text-secondary` / `inverse-accent-text` on `inverse-bg` | 4.5:1 |
| `chart-1..5` on `surface` | 3:1 |

实现要求：把这 23 组写成一个**可执行测试**，遍历所有主题（含自定义主题），任何一组不达标即失败。品牌深色区块（plum / navy）另有覆盖：区块内 `lead`、`eyebrow`、`text-secondary`、`text-muted` 统一取 `--nui-color-night-text-2`（与 navy 底实测 10.03:1），`eyebrow--accent` 取 `--nui-color-gold`。这条覆盖写在 `foundation.css`，不要逐页面写死浅色。

## 6. 主题机制

| 目标 | 做法 |
| --- | --- |
| 内置主题 | `<html data-nui-theme="paper">`（默认，`:root` 即 paper）/ `"night"` / `"auto"`（跟随 `prefers-color-scheme`） |
| 局部主题 | 任意容器上加 `data-nui-theme`；或 `<ThemeProvider theme="night">`（同时输出 `nui-root` 作用域类，保证嵌入时也有背景与排版） |
| 密度 | `data-nui-density="compact"`（独立轴，与主题正交） |
| 运行时改 token | `<ThemeProvider tokens={{ accent:'#7ee0c3', 'accent-hover':'#5fcfae', 'accent-text':'#7ee0c3', 'focus-ring':'#7ee0c3' }}>` → 输出内联 CSS 变量 |
| 命名主题 | `defineTheme({ name, extends, tokens })` → 返回 `{ name, tokens, css, refs }`；`css` 形如 `[data-nui-theme="jade"]{…}` |
| 校验 | `checkContrast(theme.tokens)` 跑上面的对比度矩阵；`contrastRatio(fg,bg)`、`toCssVars(map)` 为底层工具 |

改 `accent` 时必须同时改 `accent-text`（强调色作文字要 ≥4.5:1）与 `focus-ring`，并跑 `checkContrast`。示例自定义主题（jade，基于 night 只换强调色）：

```ts
defineTheme({
  name: 'jade',
  extends: 'night',
  tokens: { accent: '#7ee0c3', 'accent-hover': '#5fcfae', 'accent-text': '#7ee0c3', 'focus-ring': '#7ee0c3', 'chart-1': '#7ee0c3' },
});
```

### Tailwind preset

```js
presets: [preset]  // @nui3/tokens/tailwind
```

- 颜色命名空间 `nui-*` → `bg-nui-surface`、`text-nui-text`、`border-nui-border`、`text-nui-privacy-shielded`…（全部映射到 CSS 变量，切换主题无需重建）
- `fontFamily`: `font-display` / `font-sans` / `font-mono`
- `borderRadius`: `rounded-none` / `rounded`（`radius-base`）/ `rounded-control` / `rounded-pill`
- `maxWidth`: `max-w-container`
- `transitionTimingFunction`: `ease-nui`

## 7. 字体

三套自托管字体（无 CDN，OFL）：

| 家族 | 字重 | 文件数 | 用途 |
| --- | --- | --- | --- |
| DM Serif Display | 400 | 2（latin / latin-ext） | 仅标题 |
| Inter | 300 / 400 / 500 / 600 / 700 / 900 | 12 | 全部 UI 与正文 |
| IBM Plex Mono | 400 / 500 | 4 | 地址、哈希、memo、序号、代码 |

实现要求：`font-display: swap`；latin 与 latin-ext 分别声明 `unicode-range`；`body` 设 `-webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility`；`h1..h6,p,figure,blockquote,dl,dd` 的 `margin` 归零。

## 8. 布局与断点

| 变量/构件 | 值 |
| --- | --- |
| 内容容器 | `width: min(100% - 2*gutter, 1360px); margin-inline: auto`（`.nui-shell`） |
| 页头高 | 88px（≤860px 为 72px） |
| 网格列折叠 | `3/4 列 → 2 列 @1080px → 1 列 @640px`（`auto` 网格除外，它按 `minmax(--nui-min, 1fr)` 自适应） |
| 顶部导航折叠 | `@1100px` 隐藏 `.nui-nav`，显示菜单按钮（Drawer）；`@860px` 页头 72px、隐藏 nav |
| 页脚栅格 | `1.5fr + 3×1fr`；`@860px` 2 列；`@640px` 1 列 |
| 移动端隐藏 | `@640px` `.nui-hide-mobile { display:none }` |
| Stats 折行 | `@640px` 间距 20/32px，`divided` 的分隔线与左内边距取消，数值 28px |

响应式实现原则：**用 `--nui-cols` 变量 + 媒体查询覆盖，不要在 JSX 内联列数**（内联 `--nui-cols` 会与折叠规则打架）。

## 9. 运动

- 过渡只用 `--nui-dur-fast`（颜色/边框）、`--nui-dur`（默认）、`--nui-dur-slow`（展开、位移），缓动统一 `--nui-ease`。
- 关键帧（全局命名，供所有组件复用）：
  - `nui-spin` 0.8s linear：加载环形（12px，1.5px 边框，一侧透明）
  - `nui-rise` 0.3s：浮层入场（`translateY(12px)` + 透明度）
  - `nui-slide-in` / `nui-slide-in-left` 0.3s：抽屉（±24px）
  - `nui-pulse` 1.4s：pending 状态点（50% 时 opacity .3）
  - `nui-shimmer` 1.6s linear：骨架屏（背景位置 -200%→0，200% 尺寸）
  - `nui-indeterminate` 1.4s：不确定进度（30% 宽条平移）
  - `nui-flash-up` / `nui-flash-down` 0.9s：实时数值闪烁（正向 22% 染色 → 透明）
- 允许的 hover 位移：箭头右移 6px、卡片上移 4px（仅作品卡）、图标旋转 180°、卡片底部规则 `scaleX(0→1)`。
- `prefers-reduced-motion: reduce` 时：所有 `transition-duration` 与 `animation-duration` 压到 `0.01ms`，`animation-iteration-count: 1`，`scroll-behavior: auto`。嵌入版 CSS 不含 base 层，需要用 `[class*="nui-"]` 选择器兜底同一规则。

## 10. 形状与高度细则

| 元素 | 规格 |
| --- | --- |
| 卡片 / 面板 / 对话框 / 抽屉 | `border: 1px solid var(--nui-border)`，无阴影，圆角 0 |
| 浮层（下拉面板 / toast） | 1px 边框 + `surface-raised`；**不用**投影营造层级 |
| 表格外层 | 1px 边框包裹 + `overflow-x:auto`；放进 `Panel` 时边框宽度归零（面板已有框） |
| 输入 / 选择 / textarea | 1px `border`，聚焦时边框转 `border-focus` **加** `inset 0 -2px 0 accent`（金色下划线，禁用蓝色 glow） |
| 分段控件 | 容器 1px 边框 + `surface-sunken` 底 + 3px 内边距；选中项 `surface` 底 + `inset 0 -2px 0 accent` |
| 状态点 | 8px 圆点（`radius-pill`），颜色随语义色 |
| 进度条 | 4px 高（Meter 为 8px，健康条 6px），底 `border`，填充 `accent` |
| 发丝线 | 1px `border`（区块分隔）、`border-soft`（列表行间） |

## 11. 品牌深色区块（`Section tone`）

| tone | 背景 | 文字 |
| --- | --- | --- |
| `default` | 无（继承页面） | 继承 |
| `inverse` | `--nui-inverse-bg`（纸白=plum，night=paper） | `--nui-inverse-text`；次级用 `inverse-text-secondary` |
| `plum` | `--nui-color-plum` | `--nui-color-white`；次级 `--nui-color-night-text-2` |
| `navy` | `--nui-color-navy` | `--nui-color-white`；次级 `--nui-color-night-text-2` |

规则：深色区块**不得连续**，也不得紧邻另一种深色（`plum` 与 `navy` 永不相邻）。门户页面（Ecosystem）每页 0–1 个且位于末尾；营销页（首页）允许 2 个，中间必须有至少一个浅色区块分隔。示例：首页用 `navy` 承载技术栈、`plum` 收尾，两者之间有浅色的应用生态与建设入口区块。
