# NUI3 规格包（可移植实现规格）

这套文档把 NUI3 的设计意图、视觉数值、组件契约和页面配方写成**自成体系**的规格，供另一个模型/团队**不读源码**就能从零实现同等结果：一套 token + CSS + 组件库，以及用这套库搭出的生态门户与 12 个产品原型。

## 文件

| 文件 | 内容 | 主要读者 |
| --- | --- | --- |
| [`01-design-principles.md`](01-design-principles.md) | 设计语言、12 条硬规则、隐私/金额/无障碍/文案基线、反模式 | 所有人，**先读** |
| [`02-tokens-and-visual-spec.md`](02-tokens-and-visual-spec.md) | 全量 token 数值（含 paper/night 双主题）、主题机制、字体、栅格断点、运动、对比度矩阵 | 实现 token / CSS 层 |
| [`03-component-contract.md`](03-component-contract.md) | 通用组件契约：命名、状态矩阵、尺寸、无障碍基线、i18n 目录（en/zh 全量字符串） | 实现组件层 |
| [`04-component-reference.md`](04-component-reference.md) | 99 个组件逐条规格：用途、DOM/类名、属性、视觉数值、状态、a11y、所用 i18n key | 实现组件层 |
| [`05-page-recipes.md`](05-page-recipes.md) | 首页叙事、门户 8 个板块、组件文档站、12 个产品页配方、内容与风险提示规则 | 实现页面层 |

依赖顺序：`02` 是 `03/04` 的地基，`04` 是 `05` 的地基。实现顺序建议也是这个顺序。

## 目标产物（两种都做）

**A 组件库**（框架可换，但契约必须一致）

- 一个 DTCG 风格的 token 源文件，能生成 CSS 变量、JSON 与 Tailwind preset；两套内置主题 `paper` / `night` + `auto`（跟随系统）；一套 `compact` 密度覆盖。
- 一套 `nui-*` 前缀的 CSS（约 90 KB 未压缩），分为 `base`（全局 reset）/ `tokens` / `theme` / `components` 四层 `@layer`，另有一个不带全局 reset、可嵌入既有应用的版本。
- 一套组件：文本/布局原语 9 个、动作 6 个、表单 10 个、导航 6 个、容器与反馈 13 个、浮层 3 个、Zcash 域 14 个、DeFi 域 5 个、交易 6 个、图表 10 个、内容 9 个、支付 2 个、数据 2 个、预测 2 个、主题与 i18n 各 1 个，共 **99 个条目**（含 Hook 与别名）。
- 工具函数：定点金额（bigint 基础单位）、地址解析、memo、ZIP-321、批量支付 CSV、图表刻度、分页区间、i18n 消息。

**B 应用界面**

- 生态门户：首页 + `overview / infrastructure / apps / apps/:id / build / extend / ecosystem / contribute` 八个板块 + 组件文档站（含两篇指南）。
- 12 个产品参考实现：bridge、deploy（TokenDeploy）、explorer、dex、lending、perps、rpc、nft、launchpad、prediction、payroll、wallet，每个含索引页与 2–10 个子页。
- 全站中英双语、三套主题（paper / night / 自定义强调色）、可切换的“隐藏金额”模式。

## 交给实现模型时怎么用

1. 先让它读 `01`，这决定它会不会做出“模板感”的界面。硬规则里任意一条被破坏，产物就算不合格。
2. 再让它按 `02` 建 token 与基础 CSS，**不要**让它自由发明色值和间距。
3. `03` 是通用契约（状态、尺寸、无障碍、i18n），`04` 是逐组件规格。组件优先实现顺序：Button / IconButton / Field / Input / Panel / Card / Badge / Alert / DataTable / Address / Amount / TokenAmountInput / TxStatus。
4. `05` 用来搭页面。产品页必须复用第 3 步的组件，不允许为某个页面新写一次性样式。

## 验收清单（实现完成后逐条自测）

结构与纪律

- [ ] 组件与页面的样式值全部来自 token（`--nui-*`），代码里搜不到十六进制色值、像素圆角、`box-shadow` 阴影。
- [ ] 所有类名以 `nui-` 前缀；样式集中在 `@layer nui3.*`，业务 CSS 不加 `!important` 也能覆盖。
- [ ] 两套主题切换后无对比度回归：`text`/`bg` ≥ 7:1，`text-secondary`、`text-muted`、`accent-text`、`positive`、`negative`、`info`、三个隐私色 ≥ 4.5:1，五个图表色 ≥ 3:1。
- [ ] `compact` 密度下控件高 36px、卡片内边距 16px、单元格 8/12px。

视觉

- [ ] 圆角为 0（除 logo、token 图标、状态点、步进圆点）。
- [ ] 无渐变、无毛玻璃、无霓虹、无投影；层级靠边框 + 表面色区分。
- [ ] 每个视图只有一个 `solid` 主按钮。
- [ ] 强调色面积 ≤ 屏幕 10%，只出现在主 CTA、选中指示、焦点环、关键数字、下划线规则。
- [ ] Display 字体只用于页面/区块标题；正文、按钮、数字一律 Inter；地址、哈希、memo 用等宽。
- [ ] 数字用 `tabular-nums`；列表金额 ≤ 4 位小数，确认页才显示全精度。

内容与隐私

- [ ] `shielded` / `confidential` / `public` 不混用；未把 confidential 或 public 说成 “private”“anonymous”“fully private”“shielded”。
- [ ] 公开页面（Explorer、目录、结算页）不显示 shielded 的金额、发送方、接收方、memo，而是显示 `Shielded` / `Hidden by shielded pool`。
- [ ] Bridge / Lending / Perps / Prediction / LaunchPad 五类页面存在风险 `Alert`。
- [ ] 页脚固定渲染免责声明：`Not affiliated with the Zcash Foundation or Electric Coin Company.`
- [ ] 产品名不含 “Zcash”。

无障碍

- [ ] 每个输入都有 label（可视觉隐藏，不可移除），错误用 `role="alert"`，与控件 `aria-describedby` 关联。
- [ ] 焦点环可见（2px + 3px offset），未被移除。
- [ ] 所有图标按钮有 `aria-label`。
- [ ] 键盘可达：ChipGroup/Tabs/Segmented 用 roving tabindex + 方向键；Dialog/Drawer 用原生 `<dialog>` 语义，Esc 关闭（签名中除外）。
- [ ] 状态变化通过 live region 播报（Toast、TxStatus、复制成功）。
- [ ] 尊重 `prefers-reduced-motion`。

响应式

- [ ] 390px 视口无页面级横向滚动；表格在容器内滚动。
- [ ] 网格 3→2→1 列（1080px / 640px）；导航在 1100px/860px 折叠为抽屉。

## 术语与命名约定

| 概念 | 写法 |
| --- | --- |
| CSS 变量 | `--nui-<group>-<name>`，语义 token 无 group 前缀：`--nui-text`、`--nui-accent` |
| 类名 | `nui-<block>`、`nui-<block>--<modifier>`、`nui-<block>__<element>` |
| 状态属性 | `data-*`（`data-state`、`data-level`、`data-kind`、`data-zone`、`data-status`）或 ARIA（`aria-selected`、`aria-pressed`、`aria-checked`、`aria-current`、`aria-invalid`、`aria-busy`） |
| 组件名 | PascalCase，与 `04` 中一致；属性名 camelCase |
| 主题 | `data-nui-theme="paper | night | auto"`，`<html>` 或任意容器上 |
| 密度 | `data-nui-density="compact"` |
| 金额 | bigint 基础单位（ZEC 为 zatoshi，8 位小数）；输入过程中保留十进制字符串 |
