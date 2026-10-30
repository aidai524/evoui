# 05 · 页面配方与内容规则

页面层规格：路由、区块顺序、每个区块用什么组件、间距、示例数据契约、风险披露与原型标注。组件细节见 `04`。

---

## 1. 路由与站点地图

Hash 路由（无需服务器 rewrite）：`#/`、`#/<section>`、`#/<product>/<page>/<id>`。

| 路由 | 页面 | 备注 |
| --- | --- | --- |
| `#/` | 生态首页 | 见 §2（当前有两条路线，见 2.0） |
| `#/overview` | 协议概览 | 使命、愿景、技术栈、路线图 |
| `#/infrastructure` | 公共基础设施 | Explorer、RPC、规划中的 Indexer |
| `#/apps` | 应用目录 | Phase 筛选 |
| `#/apps/:id` | 应用详情 | 阶段时间线 + 原型状态 |
| `#/build` | 开发者入口 | 起步、组件、AI、模板 |
| `#/extend` | 扩展 | 主题、组件、适配器、集成契约 |
| `#/ecosystem` | 参考生态 | 参考应用说明 |
| `#/contribute` | 贡献 | 代码、RFC、路线图、治理状态 |
| `#/docs` | 组件文档索引 | 99 组件按组 |
| `#/docs/:name` | 单组件文档 | 演示 + 用法 + 属性 |
| `#/docs/getting-started` | 前端接入指南 | 替代 `docs/getting-started.md` |
| `#/docs/ai-integration` | AI 接入指南 | 替代 `docs/ai-integration.md` |
| `#/<product>` … | 12 个产品原型 | 见 §6 |

兼容别名（301 语义，前端重定向）：`#/swap → #/dex`、`#/lend → #/lending`、`#/tx → #/explorer/tx`。

页面标题：`{页面标题} · {产品名} — NUI3`，路由变化时更新 `document.title`；路由切换 `window.scrollTo(0,0)`。

---

## 2. 首页

### 2.0 两条并存的路线（实现前必须选一条）

| | V1 · 已提交 | V2 · 工作区未提交改版 |
| --- | --- | --- |
| 主题 | 跟随用户设置（默认 paper） | 强制 `data-nui-theme="night"` |
| 组成 | 全部用 NUI3 组件（`Section`/`Display`/`Stats`/`Grid`/`Card`） | 自建 `Home.css`（22 KB，`brutal-*` 类）+ 仅用 `Button`、`Display` |
| 页头 | 共享 `Header`（8 项主导航 + 设置） | 自建页头（等宽字体、语言/时钟/CTA） |
| 排版 | 衬线大标题 + Inter 正文 | 等宽字体为主（`brutal-micro` 10px 起） |
| 分隔 | 纵向留白 + 深色区块节奏 | 1px 发丝线分割（不用纵向间距分隔） |
| 合规 | 基本符合 `01`；唯一例外是一段内联 `<style>`（技术栈行布局 + Hero 断点） | 违反“只用组件”与“每个组件只靠 token 定制”：全站单主题、22 KB 自建样式表，且首页自建页头绕过共享 Header |
| 状态 | 线上版本 | 未审查、未提交、无文档 |

**默认按 V1 实现**（与 `01` 的硬规则一致）。若要走 V2，需先显式放宽 `01` 的 R2/R4/R12 三条，并把 `Home.css` 里的取值全部改成 token 引用（它目前已经 125 处用 `var(--nui-*)`，无裸色值，这点是合格的）。

### 2.1 V1 首页（六段叙事）

叙事顺序固定：使命 → 使命/愿景 → 为什么是这套栈 → 能建什么 → 从哪参与 → 收尾 CTA。整页用 NUI3 组件，允许两个深色区块（`navy` + `plum`），中间必须隔浅色。

| # | 区块 | 内容与组件 | 具体数值 |
| --- | --- | --- | --- |
| 1 | Hero | `Eyebrow`（`Noir Protocol · Mission & open ecosystem`）→ `Display size="l"` 两行标题（`A private financial future.` / `Built in the open.`，衬线）→ `Lead`（Max 760，使命一段）→ `Cluster gap={8}` 内一个 solid `Build on Noir` + 一个 ghost `Our mission & technology` → 四格事实条（`NOIR · Confidential execution` / `NEAR · Execution environment` / `ZCASH · State anchor` / `NUI3 · Open application UI`，前面加粗品牌名） | 外层 `shell padding:88px 0 72px`；Lead 上边距 36；动作区上边距 40；事实条上边距 64、`padding:20px 0`、上下 1px `border`、gap `16px 40px`、14px `text-secondary` |
| 2 | Mission & Vision | `Grid cols={2}`，两块各：`Eyebrow as="h2"`（`01 · Our mission` / `02 · Our vision`）→ `Display as="h2" size="s"` → `Lead` | `shell padding:16px 0 96px`；每块顶部 2px `text` 色规则 + `padding-top:20px`；标题上下 20px |
| 3 | Why build on Noir（深色 `navy`） | `Section tone="navy"`：`Eyebrow accent`（`Technology · Why build on Noir`）+ `Display size="m"`（`One connected stack. Five places to create.`）+ `Lead`（Max 820）→ 五行技术栈列表（01 Applications、02 NUI3、03 Public infrastructure、04 Noir execution、05 Zcash anchor：序号等宽 + 层名 + 说明 + 右侧 `{action} →`）→ `Grid cols={3}` 三条原则（Confidential by design / Connected to Zcash / Composable for builders） | 列表上边距 48/下 32，顶部 1px 分隔线；每行 `grid-template-columns: 48px .75fr 1.6fr auto`、gap 24、`padding:24px 0`、底部 1px；≤800px 重排为 2 列；三条原则各顶部 1px + `padding-top:18px`，标题用 `nui-panel__title`（15px/600） |
| 4 | The application ecosystem | `Cluster justify="space-between"`：`Eyebrow as="h2"` + `Display size="s"`（`Not one product. Many possibilities.`）+ ghost `All apps & phases →`；`Grid cols={3}` 三张 `Card interactive`（wallet / dex / lending）：`Badge` Phase n + `Badge` Prototype、`nui-card__title`、`nui-card__desc`、stretched link `View application →` | `shell padding:88px 0`；标题区下边距 28；卡片标题上边距 20 |
| 5 | Choose where you contribute | `Eyebrow as="h2"` + `Grid cols={3}` 三张 `Card interactive`：A Build an application / B Extend the system / C Shape the ecosystem（序号等宽 11px、`nui-card__title` 上边距 20、描述、stretched link） | `shell paddingBottom:96px`；网格上边距 24 |
| 6 | 收尾 CTA（深色 `plum`） | `Section tone="plum"`：`Eyebrow accent`（`Noir is built to be built on`）+ `Display size="m"`（Max 900）+ `Cluster` 两个 ghost 按钮（`Start building` / `Explore the ecosystem`）——此处**不放** solid（主 CTA 已在 Hero） | 标题上下 16/24；动作区上边距 32 |

响应式：≤600px 时 Hero 标题降至 34px / 行高 1.1；技术栈行在 ≤800px 变 2 列（序号 + 内容），说明与链接落到第 2 列。

配色约束：深色区块只有第 3（navy）与第 6（plum），中间隔着第 4、第 5 两个浅色区块；不得把它们调换成相邻，也不得在第 3 或第 6 内再套浅色 `Section`。

### 2.2 V2 首页（等宽"brutal"改版，仅在决定采用时实现）

- 外层 `<div class="brutal-site" data-nui-theme="night">`，全站等宽字体（`--nui-font-mono`），强调色只做标记与填充块。
- 结构：自建页头（品牌块用 `accent` 底 + `on-accent` 文字，18px 等宽；导航 10px 大写，gap 25px，padding 27px 0 25px；右侧语言切换 46px、UTC 时钟 102px、outline 小 CTA，最小高 72px）→ Hero（2 列 `1.02fr/0.98fr`，`min-height:650px`，左栏 `padding:74px 54px 46px 86px` 且右侧 1px 竖线；`Display size="l"` 放大到 `clamp(72px, 8.4vw, 142px)`；tagline 36px 上边距等宽；intro 最大宽 475px、12px 等宽；动作区 gap 28px、上边距 32px，一个 solid + 一个 ghost；右侧协议示意图：网格底纹、扫描线、坐标框、四角刻度、`/01` 标记）。
- 区块之间用 `.brutal-bordered { border-bottom: 1px solid var(--nui-border) }` 分隔，**不用纵向 margin**；每个区块有 `SectionHead`（最小高 58px、左右 28px、底部 1px、左侧 `/0N` 强调色序号、右侧 9px 等宽小标签）。
- 区块顺序：Hero(01) → Core principles(02，5 列，每格最小高 210px、内边距 30/26/26，图标 + `+`、11px 等宽标题、10px 弱化等宽正文、右下装饰序号) → Selected systems(03，4 列 gap 18px，卡片 `aspect-ratio:1.9` 图形区 + `0N` 计数 + 右上 `+`、底部说明条最小高 78px 内边距 15/16、hover 边框转 accent + 上移 4px + 图 1.045 放大) → Console（3 列 `1.1fr/1.12fr/1fr`，1px 左分隔：BUILD WITH US(04) / SYSTEM STATUS(05，4 行指标 = 88px 标签 + 4px 条 + 数值，末行 `ALL SYSTEMS OPERATIONAL` 强调块) / SUBSCRIBE TO SIGNAL(06，两列表单 gap 10、输入高 44、`aria-live` 反馈槽)）→ Footer（`1.45fr + 3×0.8fr + 1.25fr`，gap 34px，padding 42/34）+ 法务条（padding 18/34、顶部 1px）→ Access ticker（最小高 56px，斜纹强调带 + `> ACCESS GRANTED_` 闪烁光标）。
- 断点：1600px+ / ≤1180px（Hero 1:1、作品 2 列、console 2 列、页脚 4 列）/ ≤860px（Hero 单列、principles 3→2 列、导航折叠为 `MENU`/`CLOSE` 的绝对定位面板，页头 64px）/ ≤560px（全部单列，页脚 2 列）；`prefers-reduced-motion` 时关闭闪烁与位移。
- 页脚仍必须渲染免责声明（大写版）。

---

## 3. 门户板块（`Ecosystem`）

统一外壳：`Shell`，`padding: 56px 0 96px`。统一页首 `PageIntro`：最大宽 860、下边距 48；`Eyebrow` → `Display size="s"`（上下 16/20）→ `Lead`。
区块间距阶梯：28px（筛选器/提示之后）→ 32px（Alert 或深色区块之前）→ 64px（大节之间）。
**门户页面每页 0–1 个深色区块且位于末尾**；`plum` 与 `navy` 不共存、不相邻；portal 不使用 `tone="inverse"`。首页是例外（见 §2.1）：可有两个深色区块，但必须被浅色区块隔开。

| 页面 | 区块顺序（自上而下） |
| --- | --- |
| **Overview** | PageIntro（`Overview · Noir Protocol` / "An open ecosystem for privacy-native finance."）→ `Grid cols={2}` 两张 Card：*Protocol*（"Confidential execution, anchored to Zcash."：在 NEAR 执行、状态锚定 Zcash，**明确说明不是 ZK rollup**）、*Mission & vision*（"Make privacy useful, composable and open."）→ 64px → `Eyebrow` + `Display size="s"` "One stack, multiple places to build." + `Grid cols={4}` 编号卡（01 Applications / 02 NUI3 / 03 Public infrastructure / 04 Protocol & Zcash）→ 64px → 路线图（`Cluster` 标题 + "Explore apps" 按钮 + `Grid cols={2}` 四张 Phase 卡：`Badge "Phase n"` + 参考数量 + 标题 + 描述）→ 32px → `Alert tone="warning" title="Privacy needs precise language."`：`Shielded Zcash, confidential Noir execution and public external networks are different states. Interfaces must explain where privacy changes.` — 本页**无深色区块** |
| **Infrastructure** | PageIntro（"Shared rails for every application."）→ `Alert tone="info" title="Reference interfaces only"`：`The interfaces below use sample data. No production endpoint, uptime or service availability is implied.` → 28px → `Grid cols={3}` 三张卡（Explorer、RPC、规划中的 Indexer，后者的状态徽章为 `Planned`）→ 32px → **`Section tone="navy"`**（`Eyebrow accent` + `Display size="s"` + "Developer quickstart" 按钮） |
| **Apps** | PageIntro（"Explore what can be built on Noir." + "Every interface is built with NUI3 and labelled with its current reference status."）→ `ChipGroup`（`All apps` + Phase 1–4，带计数）→ 28px → `Grid cols={3}` 应用卡 → 无深色区块 |
| **Apps / :id** | "← All apps"（`size="sm"`、`arrow={false}`）→ 头部块（`margin:28px 0 40px`）：`Cluster gap={8}` 两个 Badge（`Phase n` + 状态）→ `Display size="s"` → `Lead` → `Grid cols={2}`：左 Card *Application phase*（`Timeline` 四阶段，当前阶段 `tone="accent"`，时间列 "Reference phase"，描述 "Reference scope for this application; no production completion is implied."）、右 Card *Reference status*（`KeyValue alignLeft`：Interface = Interactive prototype / Data = Sample data only / Roadmap phase = Phase n / Built with = @nui3/react）+ `Button variant="solid"` "Open prototype"（上边距 24）→ 32px → `Alert tone="info" title="Prototype, not a production launch"` |
| **Build** | PageIntro（"Start with working foundations."）→ `Grid cols={2}` 四张 interactive Card（Getting started / Components & tokens / AI integration / Templates & examples，每张含 stretched link "Open →"）→ 32px → `CodeBlock language="bash"` 安装命令（clone / cd / pnpm install / pnpm build） |
| **Extend** | PageIntro（"Adapt the system without forking every screen."）→ `Grid cols={2}` 四张 Card（Custom themes / Custom components / Adapters / Integration contract）→ `CodeBlock` 命名主题示例（`defineTheme` + `checkContrast`）→ `Cluster` 两个 ghost 按钮（Theming guide、Extension rules） |
| **Ecosystem** | PageIntro（"A growing catalogue of things to build."）→ `Alert tone="info" title="Reference ecosystem"`（说明不是第三方生产部署）→ 28px → `Grid cols={3}` 三张参考应用卡 → 32px → **`Section tone="plum"`**（`Eyebrow accent` "Your project belongs here" + `Display size="s"` "Build it. Extend it. Share it." + "Contribute to the ecosystem" 按钮） |
| **Contribute** | PageIntro（"Build the ecosystem in the open."）→ `Grid cols={2}` 四张 interactive Card（Contribute code / Propose an RFC / Share an application / Roadmap & governance；最后一张必须写明 "A formal governance process has not yet been defined."）→ 无深色区块 |

### 应用目录与详情的数据契约

```ts
ProductMeta = {
  id: string;                       // 'dex' | 'bridge' | …
  group: 'trade'|'earn'|'assets'|'pay'|'build';
  name: { en, zh };
  tagline: { en, zh };
  phase: 1|2|3|4;
  priority: number;                 // wallet = 0（入口），其余 1–11
  pages: { id: string; label: {en,zh}; hidden?: boolean }[];  // id:'' = 索引页
}
```

- 目录卡：`Card interactive` → `Cluster justify="space-between"`（`h3.nui-card__title` + 状态 Badge）→ `p.nui-card__desc`（tagline）→ `div.nui-card__foot`（`ul.nui-card__tags`：`Phase n` + 最多两个非隐藏子页标签；stretched link "View app →"）。
- 状态词只有两个：`Prototype`（有可交互原型）/ `Planned`（未实现，如 Indexer）。
- 目录排除 `explorer` 与 `rpc`（它们归 Public Infrastructure），其余按 `priority` 升序。

---

## 4. 组件文档站

- 外壳：`Shell`，`padding: 40px 0 96px`；内容为 flex 行，`gap:32px`、`align-items:start`。
- 侧栏：`flex: 0 0 240px`、粘性 `top:110px`、`max-height: calc(100vh - 140px)`、纵向滚动；`@1080px` 隐藏，改为顶部 "All components" 按钮打开左侧 Drawer。
- 侧栏内容：`SearchInput`（`shortcut={false}`）→ **Guides** 组（11px eyebrow 小标题）→ 每个组件分组一个组。行样式：`padding:6px 10px`、14px、gap 2；激活行 = 文字 `accent-text` + 左侧 2px `accent` + 背景 `surface-sunken`。搜索同时过滤指南与组件名（大小写不敏感的子串）。
- 索引页：返回按钮 "← Build overview" → `Eyebrow`（`NUI3 · 99 components`）→ `Display size="s"` "Build a Zcash app in an afternoon." → `Lead` → 两张指南卡（For developers / For coding agents，stretched "Read guide →"）→ 安装 `CodeBlock` → `Grid cols={3}` 每个分组一张卡（Badge 计数 + 前五个组件名）→ 主题与 i18n `CodeBlock`。
- 单组件页：`Cluster gap={4}`（组 Badge + `code.nui-mono` 类名）→ `Display size="s"` 组件名 → `Lead` 描述 → 三个 28px 间隔的 section：**Live demo**（eyebrow + 1px 边框、24px 内边距、可横向滚动；无演示时显示 "No visual demo for this utility."）、**Usage**（`CodeBlock`：import + 示例）、**Props**（`DataTable`：Prop / Type or signature，仅当有属性）→ 底部 `Cluster justify="space-between"` 上/下一个组件按钮。
- 指南结构（两篇都必须有"Guide"徽章 + `Display size="s"` + `Lead`）：
  - **Getting started**：Before npm publication 提示（`Alert tone="info"`）→ 1 Install in a workspace → 2 Configure the app root（`import '@nui3/css'` 一次 + `ThemeProvider theme="auto"` + `ToastProvider`）→ 3 Compose components（Swap 示例）→ 4 Themes and embedding → 5 Verify（`pnpm build` / `pnpm test` / dapp 构建）。页尾链接另一篇 + "View Markdown →"。
  - **AI integration**：1 Provide the right context（读顺序：AGENTS.md → llms.txt → components.json → 相关 products 示例）→ 2 Add a persistent project rule → 3 Use a task prompt（Lending 页面示例）→ 4 Preserve domain rules（隐私 / 金额 / Explorer / 风险四条强调 Badge）→ 5 Close the loop（类型检查 + 测试 + 目视 paper/night、compact、键盘、移动端）。

---

## 5. 页头、导航、页脚

- `Header sticky bordered`，`brand = { name: 'Noir', sub: 'NUI3', href: '#/' }`，`menuLabel = 'Menu'`。
- Actions：语言 `Segmented`（EN / 中文）+ 主题 `Segmented`（Paper / Night / Custom）+ `Button variant="outline" size="sm"` "GitHub"。移动端把两个 Segmented 收进 Drawer 底部（`Stack gap={12}`）。
- 主导航（7 项）：Overview · Public Infrastructure · **Apps**（下拉：全部非基础设施产品，按 priority 排序，描述 `Phase n · tagline`）· **Build**（下拉：Build overview / Getting started / Component docs / AI integration）· Extend · Ecosystem · Contribute。
- 页脚：tagline "An open ecosystem for privacy-native applications. NUI3 reference interfaces use sample data only."；三列 **Discover**（Overview / Public Infrastructure / Apps & Phases / Ecosystem）、**Develop**（Build / Extend / Documentation / AI Integration）、**Participate**（Contribute / GitHub / Issues & RFCs / Roadmap）；legal "© 2026 Noir · Open ecosystem · Sample data only" + 免责声明 `Not affiliated with the Zcash Foundation or Electric Coin Company.`（中文：`与 Zcash 基金会及 Electric Coin Company 无隶属关系。`）

---

## 6. 12 个产品配方

### 6.1 共用外壳（`ProductShell`）

```
Shell(padding-bottom:96)
├─ 面包屑行（padding-top:32，compact 时 20）：Breadcrumb  Home / 分组 / 产品（有 crumbs 时产品才带链接）
├─ 标题行（flex，gap 24，align-items:end，padding 28px 0；compact 14px 0 18px）
│   ├─ 左列（min-width:0）：Eyebrow「产品名 · Phase n」→ Display size="s"（compact 时 30px）→ Lead（margin-top 12）
│   └─ 右列 aside（如主 CTA 或 State 徽章）
├─ SubNav（由 meta.pages 过滤 hidden 生成，current = 当前页）
└─ children：Stack gap={6}（= 24px），padding-top 28
```

`ProductShell` 是唯一提供面包屑/标题/子导航/入口间距的地方；页面内部区块之间 24px，`Split` 布局内面板之间 20px。

布局原语（产品页共用）：

| 原语 | 规则 |
| --- | --- |
| `Split` | `display:flex; flex-wrap:wrap; gap:20px; align-items:start` |
| `Main` | `flex: 2 1 460px; display:grid; gap:20px`（主内容列） |
| `Side` | `flex: 1 1 300px; display:grid; gap:20px`（侧栏） |
| `SectionTitle` | `Cluster justify="space-between"` + `Eyebrow as="h2"` + `margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid var(--nui-border)` |
| 未上线 | `ComingSoon`：`text-muted` "This product is being built." |

### 6.2 逐产品

每个产品给出：路由 → 索引页区块 → 子页区块 → 唯一 solid CTA → 风险披露 → 数据契约。

**Bridge**（assets / phase 1）`''`Transfer、`history`、`tx`(hidden)、`routes`、`recovery`
- Transfer：`Split` → Main `Panel "Transfer"`：`Grid cols={2}` 两个 `Select`（From/To 链，六条链互斥）→ `TokenAmountInput`（`aside` 为按源链推导的 `PrivacyBadge`）+ fiat → `Field "Recipient"` + 等宽 `Input`（hint：`Unified or Sapling keeps funds shielded.`）→ `DetailList`（Destination privacy 徽章 / Bridge fee `0.1%` / ETA `~12 min (10 blocks)` 或 `~2 min`）→ 离开 shielded 或落到公链时 `Alert tone="warning"` "Privacy changes on this route" → `Checkbox` 不可逆确认 → **solid `Bridge {amount} ZEC`**。Side：`Panel "In progress"`（`TxStatus` + `Stepper` 4 步：Deposit to shielded address → Confirmations on Zcash `3 / 10 blocks` → Mint nZEC on Noir → Available in wallet）+ `Meter "Daily route limit" 182/500 ZEC`；`Panel "Route health"` + `UptimeBar` 45 天。
- History：`DataTable`（id / route 用 `ChainBadge` 以 `→` 连接 / amount 数值 / value 可排序 / status `TxStatus` / age 数值）。详情行点击打开 `tx` 页。
- Transfer detail：`KeyValue`（Route / Amount `2.5 ZEC · $2,379` / Deposit address `Address` / Source tx `Hash` 链到 `#/explorer/tx/…` / Confirmations `3 / 10`）；失败或退回时 `Alert tone="negative"` + outline "Recover"。Side `Timeline` 四条 tone 事件。
- Routes & limits：`Grid cols={2}`，每个路由一张 `Panel`（`aside` 为目标链隐私徽章）+ `KeyValue`（Fee / ETA / Uptime · 90d）+ `Meter`（使用率 >80% 转 `warning`）+ `UptimeBar`。
- Recovery：`Panel "Recover a transfer"`：`Field "Transfer ID"`（等宽 Input，默认 `br-1039`）+ 失败/退回行 `DataTable` + **solid `Recover to source address`**；Side `Alert tone="info"`。
- 数据：`Route { from:'Zcash', to:'Noir', fee:0.1, eta:'~12 min', dailyLimit:500, used:182, uptime:99.99 }`；`Transfer { id:'br-1042', route:'Zcash → Noir', symbol:'ZEC', amount:'2.5', usd:2379, status:'confirming', age:'1 min', confirmations:3, required:10 }`。
- 隐私映射：Zcash → `shielded`；Noir → `confidential`；其余链 → `public`。

**TokenDeploy**（assets / phase 1）`''`Create、`tokens`、`token`(hidden)、`templates`
- Create：横向 `Stepper` 5 步（Template / Details / Supply / Features / Review）。0：两张 `Card interactive`（TKN / TKNX，选中卡 `Badge tone="accent"` "Selected" + ghost "Use template"）。1：`Field` 名称/符号 + `InputGroup end={symbol}` 总量 + `InputGroup` 精度。2：三个 `Slider`（Community/Liquidity/Team，0–100）+ 合计 ≠ 100 时 `Alert tone="negative"`。3：`Switch` 可增发；TKNX 专属 `InputGroup end="%"` 转账费 + 销毁 `Switch`。4：`KeyValue`（Token / Template / Supply `formatAmount` / Mintable / Deploy fee `5 USDC`）+ `CodeBlock language="json"` 配置 + `Alert tone="warning"` "Parameters are permanent" + `Checkbox` 确认。页脚：Back（ghost）/ Continue（outline）/ **solid `Deploy token`**。Side：`Panel "Preview" sunken`（`TokenIcon size="lg"` + 名称符号 + `DonutChart size={140}` 中心显示合计百分比）。
- My tokens：`DataTable`（token 图标+符号+名称链接 / Badge 模板 / supply、holders 数值 / mintable / 30d `Sparkline`）。
- Manage token：`Panel` 供应量 `LineChart`；`Panel flush` Top holders `DataTable`（地址等宽 / 份额数值）。Side `Panel "Owner actions"`（outline Mint more / Burn / Transfer ownership；`variant="danger"` Renounce ownership；href 按钮 Create DEX pool、Launch a sale）+ 两个 `Dialog`（mint、renounce，后者含 `Alert tone="negative"` "Irreversible"）。
- Templates：`DataTable` 特性矩阵（行：Fixed supply / Mintable / Transfer fee / Deflationary burn / Max wallet / Deploy cost；列：TKN、TKNX，值 `✓` / `—` / `5 USDC` / `12 USDC`）。
- 数据：`{ symbol:'BEAN', name:'Shielded Coffee', supply:1_000_000, holders:1240, template:'TKN', mintable:false }`。
- 校验：符号 `/^[A-Z0-9]{2,10}$/`、总量 `tryParseUnits`、分配合计 100。

**Explorer**（build / phase 1）`''`Overview、`txs`、`tx`(hidden)、`blocks`、`block`(hidden)、`address`(hidden)、`tokens`、`token`(hidden)、`bridge`、`anchors`
- Overview：搜索行（等宽 `Input` + outline "Search" + 行内错误）按前缀解析（地址 / 纯数字→区块 / 64 位十六进制→交易 / 符号→代币）→ `Stats divided` 四项（区块高度 `LiveValue`、ZEC 价格、Shielded pool `31.2%`、RPC uptime `99.98%`）→ `Split`：Main（每日交易 `LineChart`、最新交易 `DataTable` 5 列）+ Side（价值池 `DonutChart`、最新区块 `DataTable`）→ 全宽 `Alert tone="shielded"` "What the explorer shows"。
- Transactions：`ChipGroup` 类型筛选（All / Bridge in / Swap / Lend / Bridge out / Deploy）+ `DataTable`（默认按高度降序）+ `Pagination`。
- Transaction：`Panel`（标题为交易类型，`aside` 为 `TxStatus confirmations/required`）+ `KeyValue`（Hash `truncate={[14,10]}` / Block / From、To——私有交易一律显示字面量 `Shielded` / Amount / Fee `Amount 10000n`）+ 必要时 `Alert tone="shielded"`。Side `Panel "Execution"`（`PrivacyBadge` / `PoolBadge` / `Badge "NoirRoot verified"`）。
- Blocks / Block：24 行 `DataTable`（高度链接 / Hash / txs / size KB / shielded % / age）；区块详情为 `KeyValue` + 该区块交易 `DataTable` + `DonutChart`。
- Address：shielded 地址 → `Address truncate={false}` + `Alert tone="shielded"` "Balance and history are private"；透明地址 → `Stats`（Balance `Amount`、交易数、首次出现）+ 公开历史表 + `Alert tone="warning"` "Public address"。
- Tokens / Token detail：`DataTable`（供应量 `compactUsd`、holders、shielded %、`Badge tone="info"` Verified）；详情 = 供应量折线 + Top holders + Side `KeyValue` + "Trade on DEX"。
- Bridge status：`Grid cols={2}`，每个方向一张 `Panel`（`TxStatus` + 3 步 `Stepper`，失败中继时该步 `state:'error'` + `Hash` 链接）。
- Anchors：`Alert tone="info"` "State anchoring, not a ZK rollup" + `DataTable`（epoch / state root `Hash` / Zcash tx `Hash` / 高度 / 验证 `Badge dot` positive|warning）。
- 硬性：shielded 行不得出现金额、对手方、memo。

**DEX**（trade / phase 1）`''`Swap、`pools`、`pool`(hidden)、`add`、`positions`、`tokens`
- Swap：`Panel "Swap"`（`aside` = `PrivacyBadge level="confidential"`）：`Segmented` Market / `Limit · soon`（禁用）→ `Field "You pay" hideLabel` 包 `TokenAmountInput`（余额不足 → `error`）→ `SwapSwitch` → 只读 `TokenAmountInput` "You receive" → `DetailList`（Rate / Route `Noir → Rhea` / Fee `0.30%` / Max slippage 用内联 `Segmented` 0.1/0.5/1/3%）→ 滑点 ≥3% 时 `Alert tone="warning"` "High slippage" → **solid block `Review swap`** → `TokenPicker` 弹窗。Side：`Panel`（ZEC/USDC `Stats` + 面积 `LineChart`）、`Panel flush` 最近成交 `DataTable`（方向着色）、`Disclosure` "How routing and privacy work"。
- Pools：`Stats divided` 3 项 + `Cluster`（排序 `ChipGroup` TVL/Volume/APR + `SearchInput`）→ `DataTable`（池用 `TokenPair` + 费率 Badge / TVL / 24h 量 / APR 正值色 / 30d APR `Sparkline`），空态用 `EmptyState`。Side `BarChart` + `DonutChart`。
- Pool detail：`Stats divided`（TVL / 24h 量 / LP 费用）+ TVL 面积图 + `Timeline`；Side `KeyValue`（Pair / Fee tier / Execution `confidential` / Underlying venue `public` / Protocol `Rhea AMM`）+ **solid `Add liquidity`** + ghost Swap + `Alert tone="info"` "Impermanent loss"。
- Add liquidity：`Field` + 原生 `select.nui-select` 选池 → 两个 `TokenAmountInput` → `DetailList`（Deposit value / Share of pool `0.068%` / Est. APR）→ **solid block `Supply`**。Side `DonutChart` + `Meter`。
- My positions：`Grid cols={2}` 仓位 `Card`（`TokenPair` + `Badge tone="positive" dot` Active + `KeyValue`（Liquidity / Pool share / Unclaimed fees `Amount`）+ `Meter tone="positive"` + **solid `Claim fees`** + ghost Manage）。
- Tokens：`SearchInput` + `DataTable`（token / Verified Badge / price / 24h 带符号 % / volume / liquidity / 7d `Sparkline`）+ `Alert tone="warning"` "Unverified tokens"。
- 数据：`Pool { id:'zec-usdc', base:'ZEC', quote:'USDC', tvl:18_900_000, volume24h:3_420_000, fee:0.3, apr:14.2 }`。
- 原型说明：报价 = 静态价格 × 0.997，无路由计算。

**Lending**（earn / phase 2）`''`Dashboard、`markets`、`market`(hidden)、`liquidations`
- Dashboard：`Stats divided`（Net worth / Collateral `Amount nZEC` / Debt `Amount USDC`）→ `Panel "Health factor"`（`aside` 为 dot Badge）+ `HealthFactor` + `KeyValue`（ZEC mark price / Liquidation price / Borrow APY `7.40%`）+ `Cluster` **solid `Repay`** + ghost "Add collateral" → `Panel` ZEC 价格 `LineChart`（`referenceY` = 清算线）。Side：`DonutChart` 抵押/债务构成、`Panel` E-Mode `Switch`、`Alert tone="warning"` "Liquidation risk"（5% 罚金；confidential vs public 场所）。Repay/Supply 用 `Drawer`：`TokenAmountInput` + `HealthFactor "Health after repay"` + `DetailList`（Gas `0.0002 ZEC`、Execution `Noir · confidential`）+ solid `Confirm`。
- Markets：`DataTable`（默认按 supplied 降序）：asset 链接 / supplied / supply APY `PriceChange` / borrow APY / utilization `Meter`（>75% 转 warning）/ 30d APY `Sparkline`。
- Market detail：`Panel`（`aside` = `InfoTip`）利率模型 `LineChart`（`referenceX` "Kink 80%"、`markers` "Now"）+ APY 历史双序列（借款虚线）；Side `KeyValue`（Max LTV / Liquidation threshold `72%` / penalty `5%` / supply cap）+ `Meter` + **solid `Supply / borrow`** + ghost "Get USDC"。
- Liquidations：`Panel flush` `DataTable`（account 等宽 / seized collateral / debt / penalty / time）；Side `BarChart` 14d + `Disclosure` "How liquidation works"。
- 数据：`{ symbol:'USDC', supplyApy:5.1, borrowApy:7.4, supplied:12_850_000, utilization:78, ltv:80 }`；`DEBT=2400`、`COLLATERAL_ZEC=5`、`LIQ_THRESHOLD=0.72`；health = 抵押×阈值/债务。

**Perps**（trade / phase 2）`''`Trade（`compact` 密度）、`markets`、`portfolio`、`funding`
- Trade：Main `Panel flush` 自建头（市场 `select` + `LiveValue` 价格 + `PriceChange` + "Funding …% / 8h" + "OI $…"）+ `CandleChart height={360}`；第二个 `Panel flush` 用 `Tabs`/`TabPanel`（Positions 用 `PositionTable`（平仓走 toast）/ Open orders `DataTable` / Recent trades `DataTable`）。Side `Panel "Place order"`（`aside` = confidential 徽章）：`Segmented` Long/Short → 保证金 `TokenAmountInput` → 限价 `Field` → `LeverageSlider max={market.maxLeverage}` → `DetailList`（Position size / Notional / Est. liquidation 用 `warning` / Fee = notional×0.0005）→ **solid block `Open long` / `Open short`** → `Panel flush` `OrderBook`（点价填限价）。索引页底部 **`Alert tone="warning"` "Leverage risk"**。
- Markets：`DataTable`（market 链接 / max leverage `×` / funding 带符号着色 / OI / 24h 量 / 7d `Sparkline`）。
- Portfolio：`Stats divided`（Equity / Free collateral / 30d PnL）+ PnL `LineChart`（`referenceY` 起点）+ 资金费 `BarChart signed`；Side `DonutChart` 保证金分配 + `Panel` Risk `KeyValue`（账户杠杆 / 保证金率 / 最近强平）+ "Borrow margin with ZEC"。
- Funding：`Grid cols={2}` 每个市场一张 `Card`（符号 + 资金费 Badge + `BarChart signed` + 一句解释）+ `Disclosure`。
- 数据：`{ id:'zec-perp', symbol:'ZEC', maxLeverage:20, funding:0.012, openInterest:8_400_000, volume24h:12_600_000 }`；`Position { market:'ZEC-PERP', side:'long', size:'12.5 ZEC', entry:912.4, mark, liq:741.2, leverage:5, pnl, pnlPercent }`。

**Prediction**（trade / phase 2）`''`Markets、`market`(hidden)、`portfolio`
- Markets：`Cluster`（分类 `ChipGroup` All/Crypto/Macro/Politics/Sports + `SearchInput`）→ `Grid cols={2}` `Card interactive`（分类 Badge + `Countdown`、问题（h3 链接）、`ProbabilityBar`（Yes/No 或多元）、foot 成交量 + "Trade →"）。
- Market detail：Main（30 天概率 `LineChart`（`yMin 0 yMax 1`、legend）+ `Panel "Rules & resolution"`（两个 `Disclosure`，首个默认展开）+ `Panel "Activity"` `Timeline`）；Side `Panel "Trade"`（`aside` = public 徽章）：每个结果一个 `OutcomeButton` → `Segmented` Buy/Sell → `TokenAmountInput` → `DetailList`（Avg price `42.0¢` / Shares / Potential payout / Max profit `PnL`）→ **solid block `Place order`**；底部 `Alert tone="warning"` "You can lose the full stake"（失败方结算为 $0）。
- Portfolio：`Stats divided`（Position value / Unrealized PnL / Claimable）+ `DataTable`（market 链接 / shares / avg / now `LiveValue` / `PnL` 带百分比可排序）+ `Cluster` **solid `Claim winnings`** + ghost "Borrow USDC to trade"。
- 数据：`{ id:'zec-1500', question:'Will ZEC trade above $1,500 in 2026?', category:'Crypto', yes:0.42, volume:2_400_000, endsInDays:66, outcomes?: [{label, probability}] }`。
- 结算说明必须写清由外部市场（Polymarket / UMA）判定，本协议不裁决。

**LaunchPad**（earn / phase 4）`''`Projects、`project`(hidden)、`create`、`mine`
- Projects：`ChipGroup` Live/Upcoming/Ended → `Grid cols={2}` `Card interactive`（`TokenIcon size="lg"` + 状态 dot Badge + `Meter` 募资/硬顶（`marks` 标软顶）+ `KeyValue`（Current price `0.0217 USDC` / Audit / Ends `Countdown`）+ live 时 **solid `Participate`**，否则 ghost "View project"）。
- Project detail：`Stats divided`（Raised / Price now / Participants）+ `Panel` `BondingCurve`（`price`/`maxSupply`/`sold`/`nowLabel`）+ Tokenomics `DonutChart`（45/25/20/10）+ Vesting `LineChart curve="step"` + `Disclosure`；Side `Panel "Contribute"`（`aside` = `Countdown`）：`TokenAmountInput` + `KeyValue`（You receive (est.) / Price after your buy / Claimable at）+ **solid block `Contribute`**（非 live 禁用）+ `Panel` 项目信息 + `Alert tone="warning"` "High risk"（未审计合约、可能全损）。
- Create launch：`Stepper` 3 步（Token / Curve / Review）；0：符号 + 硬顶；1：两个 `Slider`（起始价 0.005–0.2 step 0.005、陡度 1–20）；2：`KeyValue` + `Alert tone="warning"` "Launch risk"；页脚 Back / Continue / **solid `Launch sale`**；Side `Panel "Curve preview"` `BondingCurve`。
- My contributions：`Grid cols={2}`（`Badge` Claimable/Locked + `KeyValue`（Contributed / Tokens `Amount decimals={6}` / Status）+ **solid `Claim`**（未结束禁用）+ ghost View）。
- 数据：`{ id:'bean', name:'Shielded Coffee', symbol:'BEAN', status:'live', raised:62000, softCap:50000, hardCap:150000, price0:0.02, slope:0.000004, maxSupply:1_000_000, sold:420000, endsInDays:4, audit:'Reviewed' }`；`priceAt = price0 + slope*supply`。

**NFTTrade**（assets / phase 4）`''`Explore、`collection`(hidden)、`item`(hidden)、`create`、`mine`
- Explore：`Grid cols={3}` 系列卡（`Identicon variant="art"` + Verified Badge + `Stats` Floor/Volume + `Sparkline` + "View"）→ `Cluster`（排序 `ChipGroup` + `SearchInput`）→ `Grid cols={4}` `NFTCard`（`price`、`meta` Listed/Not listed、`badge` accent "For sale"）→ `Pagination`。
- Collection：`Stats divided` 4 项 + 30 天地板价 `LineChart`（`yFormat` `{v} ZEC`）+ `Grid cols={4}` `NFTCard`。
- Item：Main（`Panel flush` 内 `Identicon size={640} className="nui-nft__art"` + 价格历史折线 + Offers `DataTable`）；Side `Panel`（名称 + accent Badge；`Stat` 价格；Last sale；**solid `Buy now`** + ghost "Make offer"；`KeyValue` Collection / Token standard `Noir NFT-1` / Royalty `2.5%`；Traits 两列边框格；Provenance `Timeline`）+ `Drawer` 出价（solid `Submit offer`，48h 托管说明）。
- Create：`FileDrop accept="image/*" maxSize={10_000_000}` + 名称 `Field` + 描述 `Textarea` + 版税 `Slider` 0–10 step 0.5 + **solid `Mint NFT`**；Side `NFTCard` 预览 + `Alert tone="info"`；确认 `Dialog`（`KeyValue` Mint fee `0.01 ZEC`）。
- My NFTs：`Grid cols={4}` `NFTCard` + `Button size="sm" block variant="outline"` "List for sale" → `Drawer`（solid `Confirm listing`）。

**Payroll**（pay / phase 3）`''`Overview、`new`、`run`(hidden)、`people`、`history`
- Overview：`Stats divided`（十月工资 `Amount` / People / 屏蔽比例 `75%`）+ `Panel "Next scheduled run"`（`aside` info Badge "Scheduled"；`Countdown`；**solid `Run now`**（href）；`KeyValue` Date `2026-10-31 09:00 UTC` / Recipients / Asset `ZEC · Orchard`）+ 6 个月 `BarChart`；Side `Alert tone="shielded"` "Salaries stay private" + `Panel` Recent runs `Timeline`。
- New run：`Stepper` 4 步（Recipients / Schedule / Review / Execute）。0：`Split`（`BatchPaymentTable` + Side "Load sample CSV" + `Alert tone="info"` memo/屏蔽说明）。1：`Grid cols={2}`（Schedule：`Select` now/monthly/weekly + 两个 `Switch`；`Disclosure` 说明）。≥2：`BatchPayments`（带 `statuses`）+ `KeyValue`（Total `Amount exact` / Network fee / Schedule / Privacy = `shielded`，若含非屏蔽地址再显示 `public`）。页脚：Back / Continue（outline，无效行 >0 或有效行 =0 时禁用）/ **solid `Sign & run payroll`**。
- Run detail：`Panel`（标题 run id + `TxStatus`）+ `KeyValue`（Date / Recipients / Total `exact` / Authorization `multisig 2/3`）+ solid "Export receipts" + ghost "View in wallet" + `BatchPayments`。
- People：`DataTable`（name / team / `Address` / 月度 `2.5 ZEC` 数值 / 隐私 `PrivacyBadge`（`tex…` 视为透明））。
- History：`DataTable`（run id 等宽链接 / date / recipients / total `Amount` / `TxStatus`）。
- 数据：`PaymentRow { name:'Ana', address: <sapling>, amount:'2.5', memo:'October salary' }`；`RUNS[{ id:'run-2026-10', date:'2026-10-25', recipients:4, total:870000000n, status:'confirmed' }]`。

**RPC**（build / phase 3）`''`Overview、`keys`、`usage`、`docs`、`plans`
- Overview：`Stats divided`（Requests · 30d `42.6 M` / Avg latency `52 ms` / Uptime `99.98%`）+ 延迟 `LineChart`（p50 实线 + p95 虚线 + legend）+ 每日请求 `BarChart`；Side 每个端点一张 `Panel`（positive dot Badge "Operational" + 等宽 URL + `UptimeBar`）。
- API keys：`Cluster`（说明段 + **solid `Create key`**）→ `Grid cols={2}` 每个 key 一张 `Panel`（scope Badge + `SecretField` + `KeyValue` Created/Last used + 小号 Rotate + `variant="danger"` 小号 Revoke）+ `Dialog` 创建（名称 `Input` + 两个 scope `Checkbox` + solid `Create`）。
- Usage：`Panel` 配额（三个 `Meter`：Requests `42.6M / 100M`、Compact block bandwidth `820 / 1000 GB`（`tone="warning"`）、API keys `1 / 5`）+ 错误率 `DataTable`（method 等宽 / error % / p95）；Side `DonutChart` + "Upgrade plan"。
- Quickstart：`Grid cols={2}` 多个 `Panel` + `CodeBlock`（`snippets` curl/JS/Python 标签页；JSON-RPC；屏蔽交易广播）+ `Alert tone="warning"` "Do not expose keys in the browser"。
- Plans：`Grid cols={3}`（Free $0 / Builder $49（当前）/ Scale $399）：`Badge tone="accent"` Current + `Stat` 价格 + `KeyValue`（Requests / API keys / Support / SLA）+ `Button`（当前为 outline "Manage"，其余 solid "Choose"）。

**Wallet**（pay / phase 1）`''`Overview、`send`、`receive`、`activity`、`settings`
- Overview：`Panel`（无标题）`Stats`（Total value / Shielded ZEC `Amount hidden` / 24h change）+ `SyncProgress`（height/tip/from/eta `4 min`）→ `Panel "Balances" flush`（`DataTable`：asset 图标+符号+链 / `PoolBadge orchard` / balance `Amount` / value；隐藏模式全部 `••••`）；Side `DonutChart` 资产分布 + `Panel` Recent activity `Timeline` + "All activity"。
- Send：`Panel "Send ZEC"`：等宽 `Input` 收件人（`isValidAddress(recipient,'mainnet')` 校验 + 错误）→ 有效时 `Address` 预览 → `Input` 金额 → `MemoInput recipient`（>512 字节 → `Alert tone="negative"`）→ `Segmented` 费率（Economy 0.00001 / Standard 0.0001 / Fast 0.001）→ **solid block `Review transaction`**；Side `Alert tone="shielded"` "Shielded by default"（Orchard）。确认 `Dialog dismissible={!signing}`：`KeyValue`（To `Address` / Amount `0.5 ZEC · $475.82` / Fee / Memo）+ Cancel + **solid `Sign & send`（`loading={signing}`）**。
- Receive：`Panel "Receive"`（`aside` 为 `PoolBadge`）：`Segmented` Unified/Sapling → `ReceiveQR size={200} caption="ZIP-321 · 0.25 ZEC"` → `Address truncate={[12,8]}` → `Field` 请求金额 → `Field` `MemoInput`；Side `Panel "Payment URI"` 原始 URI 字符串。
- Activity：`ChipGroup`（All/Received/Sent/Swap/Bridge）+ `SearchInput` + `Panel` `Timeline`（每条 description 为 `TxStatus confirmed`）+ `Pagination`。
- Settings：`Grid cols={2}`：`Panel "Privacy & display"`（Switch 隐藏余额（真实全局状态）/ 自动锁定 / Tor 路由 / `Segmented` 语言 / `Segmented` 主题）、`Panel "Viewing key"`（说明段 + `SecretField` 的 `zxviews…` + `KeyValue` Default pool / Birthday height `2,900,000` / Node `lightwalletd.noir.example:443`）。
- 数据：`TOKENS: TokenInfo[]`（`balance` 为 bigint，如 `1284500000n`，decimals 8）+ `PRICES` 映射。

### 6.3 示例数据与模拟层（必须如实标注）

- 所有产品用文件内静态数组（`TOKENS`、`PRICES`、`ADDR`、`MARKETS`、`POOLS` …）+ 确定性伪随机序列（`rng(seed)`、`walk(seed, n, base, vol)`）生成走势。
- 实时感来自模拟 hooks：`usePrices` / `usePrice` / `useHistory` / `useOrderBook` / `useTrades` / `useCandles` / `useTxProgress(required, ms, start)` / `useBlockHeight`，全部基于定时器漂移，**不发起网络请求**。
- 任何"提交"最终只调用 `toast()`；确认数增长是定时器模拟。
- 已知占位控件（实现时可保留，但必须无破坏性行为）：Bridge 历史行点击、Payroll "Export receipts"、RPC 套餐按钮、Payroll 调度开关、Explorer 分页未绑定数据。
- 缺失 id 的兜底：NFT/Explorer 区块会静默回落到第一条记录 —— 规格要求改为 `EmptyState`（这是已知缺陷，不要照抄）。

---

## 7. 内容规则

### 7.1 原型与范围标注

页面必须让读者知道这是参考实现：

- 目录/详情徽章只写 `Prototype` 或 `Planned`。
- Infrastructure、Ecosystem、Apps 详情页各有固定 `Alert`（见 §3）。
- Overview 的路线图不得暗示已完成生产交付；写 "Reference phase" / "Reference scope for this application; no production completion is implied."
- 禁止出现虚构的性能、审计、TVL、用户数等"事实"而未标注为示例。

### 7.2 协议叙事约束

- 模型：Noir 在 NEAR 上执行，状态锚定到 Zcash。**不得**表述为 ZK Rollup；Explorer 的 Anchors 页必须显式写 "State anchoring, not a ZK rollup"。
- 隐私三级必须逐处正确（`01 §R6`）：Bridge 显示跨链前后两个级别；DEX 用 `confidential`；Perps/Prediction/NFT 的公开场所用 `public`；Payroll/Wallet 的屏蔽流用 `shielded`。
- 结算/裁决归属写清：Prediction 由外部市场判定；Bridge 的中继与 mint 由 Noir 侧完成。

### 7.3 风险披露文案（必须具体）

| 页面 | 标题 | 正文要点 |
| --- | --- | --- |
| Bridge | Privacy changes on this route | 说明源链/目标链的隐私级别差异，目标链上资产不再受 Zcash 屏蔽保护 |
| Lending | Liquidation risk | 清算阈值、罚金（示例 5%）、抵押物价格波动 |
| Perps | Leverage risk | 杠杆放大亏损、资金费率、强平 |
| Prediction | You can lose the full stake | 失败方份额结算为 $0，只用可承受损失的资金 |
| LaunchPad | High risk | 合约未审计、可能损失全部投入、流动性风险 |
| TokenDeploy | Parameters are permanent | 供应量/精度/费率部署后不可改，附 `Checkbox` 确认 |
| RPC Quickstart | Do not expose keys in the browser | 私钥与查看密钥不得进前端，走自有后端或限流公共端点 |

### 7.4 金额与隐藏模式

- 列表/表格金额默认 4 位小数（`formatAmount`），确认页 `exact`。
- 全站隐藏模式（`hideBalances`）：所有余额、价值、图表中心数值显示 `••••` 或 `••••••`，`Amount hidden` 可读，不得只做视觉遮蔽。
- 汇率/估值用 `formatFiat`：`$2,379`、`$0.0217`（<0.01 时 4 位）。

---

## 8. 全局状态与响应式

| 状态 | 存储 | 默认 | 影响 |
| --- | --- | --- | --- |
| `lang` | `localStorage['{prefix}lang']` + URL `?lang=` | `en` | 所有文案 + `LocaleProvider` + `document.documentElement.lang` |
| `theme` | `localStorage['{prefix}theme']` + URL `?theme=` | `paper` | `document.documentElement.dataset.nuiTheme`；`jade` 为 `defineTheme` 生成的自定义主题 |
| `hideBalances` | `localStorage['{prefix}hide']` | `false` | 金额遮蔽 |

- 三者独立；主题与语言切换不刷新页面。
- 密度（`data-nui-density="compact"`）与主题正交，示例站在 Perps 等密集页使用。
- 首屏 lazy 加载：Portal 与 Docs 按需加载，fallback 用 `Shell padding:'56px 0'` + `Skeleton`（240×36 + 100%×320）。

响应式验收：

- 390px：无页面级横向滚动；表格在容器内滚动；五层技术栈重排为单列；Hero 单列。
- 768px：产品页 `Split` 折行为单列（`Main` 在上、`Side` 在下）。
- 1080px：门户网格 2 列、文档侧栏隐藏。
- 1100px：主导航折叠为抽屉。
