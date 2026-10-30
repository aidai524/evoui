# 01 · 设计原则与硬规则

这份文档定义"做成什么样才算对"。它优先于任何示例代码：与示例冲突时以本文为准。

## 1. 我们在设计什么

面向隐私原生应用（Noir 协议 + Zcash）的开放 UI 系统，被三类产品同时使用：

1. **应用**：钱包、跨链桥、DEX、借贷、永续、预测市场、发币、LaunchPad、NFT、工资支付、浏览器、RPC —— 12 类，都以示例数据形式提供参考实现。
2. **门户**：协议叙事、公共基础设施状态、应用目录、开发者入口、贡献入口。
3. **文档**：99 个组件的在线演示 + 接入指南 + AI 接入指南。

三者共用一套 token、一套组件、一套文案规则。**不允许**为某一类产品发明局部样式或第二套视觉语言。

参考坐标是 z.cash 的编辑式视觉语言（暖纸、梅紫墨色、单一金色强调、衬线大标题），但**不照抄**其文案与图片。

## 2. 设计语言 DNA（六条）

| # | 特征 | 具体做法 |
| --- | --- | --- |
| 1 | 暖纸 + 梅紫墨色，不是纯白纯黑 | 页面底 `#f3f1ef`（paper），主文字 `#271219`（plum）；卡片表面才是白色 |
| 2 | 只有一个强调色 | 金色 `#f3b724`；浅色底上作文字时降到 `#8a6100` 保证 4.5:1 |
| 3 | 衬线标题 + 无衬线 UI + 等宽数据 | DM Serif Display 仅用于页面/区块标题；Inter 承担正文、按钮、数字；IBM Plex Mono 承担地址、哈希、memo、序号 |
| 4 | 直角、发丝线、零投影 | 圆角 0（只有 logo、token 图标、状态点、步进圆点是圆形）；层级用 1px 边框 + 表面色，绝不用阴影 |
| 5 | 通气的正文行高、收紧的标签字距 | 正文行高 1.875；大写标签 12px / 字距 0.16em；按钮 13px / 字距 0.2em |
| 6 | 强调色当"规则"用，不当"填充"用 | 金色出现在下划线、左侧 2px 竖线、进度填充、选中态、焦点环、关键数字；整屏占比 ≤ 10% |

## 3. 十二条硬规则（逐条可检验）

### R1 只用 token，不用裸值

组件与页面样式里的颜色、字号、行高、半径、间距、动效、层级**必须**来自 `--nui-*` 变量。代码中不应出现十六进制色值、`rgb()`、像素半径、`box-shadow` 阴影。

例外（唯一允许的裸值）：QR 码的白色静区 `#fff` 与其说明文字 `#5c5357`；页脚在黑色底上的灰阶 `#cbcbcb / #9a9a9a / rgba(255,255,255,.16)`。

判据：对 CSS 做正则扫描，除上述例外外无颜色字面量；无 `box-shadow` 用作高度（`inset` 用作下划线、`0 0 0 Npx` 用作焦点环不算）。

### R2 一个视图只有一个 `solid` 主按钮

`solid` 表示"这一步唯一要做的事"：Swap、Bridge、Deploy、Repay、Sign & send、Place order。其余动作一律 `ghost`（默认）/ `outline` / `subtle` / `underline` / `danger`。

同一屏出现两个 solid（例如"存"和"借"并列）是错误；并列选择用 `Segmented`，不要两个实心按钮。

### R3 直角、零投影、零渐变

`--nui-radius-base` 与 `--nui-radius-control` 为 `0px`，`--nui-radius-pill` 为 `999px` 但只用于圆形元素。禁止渐变、毛玻璃、霓虹发光、卡片投影、圆形/胶囊按钮。

允许的"特殊效果"只有：hover 时底部 2px 金色规则从左侧展开（Card）、箭头右移 6px（Button）、切换图标旋转（SwapSwitch、Nav trigger）、数值变化闪烁（LiveValue）。

### R4 强调色 ≤ 10%

页面背景、区块背景、大面积卡片**绝不**使用强调色。金色只用于：主 CTA 填充、Tab/Chip 选中下划线、焦点环、图表第一序列、关键 KPI、卡片 hover 规则、左侧 2px 标记。

### R5 排版分工固定

| 用途 | 字体 | 关键值 |
| --- | --- | --- |
| 页面/区块标题 | Display（衬线，400） | `display-l` 44–90px（clamp）、`display-m` 36–71px、`display-s` 28–42px，行高 1.1–1.15，字距 -0.01em |
| 分区标题 | Inter 700 | `h2` 26–37px，行高 1.3 |
| 卡片/小节标题 | Inter 600 | `h3` 24px / 1.2，`h4` 18px / 1.3 |
| 引导段落 | Inter 400 | 18px / 1.72，最大 52ch，颜色 `text-secondary` |
| 正文 | Inter 400 | 16px / 1.875（品牌签名行高） |
| UI 文字 | Inter 500–600 | 14px / 1.5；按钮 13px/1 大写 + 0.2em 字距 |
| 大写标签 | Inter 700 | 12px / 1.4 + 0.16em 字距，`text-muted` |
| 微标签 | Inter 600 | 11px，仅配合 `text-secondary` 或更深 |
| 数字 | Inter + `tabular-nums` | KPI 40px/900，大额 32px/800，其余跟随上下文 |
| 地址/哈希/memo/序号 | IBM Plex Mono 400 | 13px / 1.4；memo 输入 13px；序号 11px |

禁止：衬线体用于正文或按钮；大写标签字号低于 11px；数字不用等宽数字对齐。

### R6 隐私措辞固定（最容易出错的一条）

只允许三个隐私级别，语义**不可互换**：

| 级别 | 中文 | English | 含义 | 颜色 |
| --- | --- | --- | --- | --- |
| `shielded` | 屏蔽 | Shielded | 仅在 Zcash 屏蔽池内（Orchard / Sapling），链上加密 | `privacy-shielded`（纸白 `#8a6100` / 夜间 `#f3b724`） |
| `confidential` | 机密 | Confidential | Noir 机密执行，对公众不可见，但由执行环境处理，**不受 Zcash 屏蔽密码学保护** | `privacy-confidential`（`#2f4a8a` / `#9fb4ff`） |
| `public` | 公开 | Public | 透明地址、NEAR/EVM/Solana、外部协议（Rhea、Polymarket），地址金额历史全公开 | `privacy-public`（`#6b6667` / `#9d8f95`），边框为虚线 |

禁止措辞：把 `confidential` 或 `public` 称为 "private"、"anonymous"、"fully private"、"shielded"。

跨级别时（Bridge 从 Zcash 转到外部链）必须同时显示两个徽章 + 一条 `Alert tone="warning"` 说明隐私在哪一步改变。

标准描述文案（`LocaleProvider` 消息键）：

- `privacyShieldedDesc`：`Zcash shielded pool. Sender, recipient and amount are encrypted on-chain.`
- `privacyConfidentialDesc`：`Confidential execution. Balances and positions are hidden from the public, but are processed by the execution environment and are not protected by Zcash shielded cryptography.`
- `privacyPublicDesc`：`Public chain or external protocol. Addresses, amounts and history are visible to anyone.`

### R7 公开页面不泄露屏蔽数据

Explorer、应用目录、公共仪表盘、任何公开页面：遇到 shielded 交易，金额显示 `"Shielded"`，其余字段显示 `"Hidden by shielded pool"`。不显示发送方、接收方、memo、金额，也不显示"猜测量"。

### R8 金额是 bigint 基础单位

- 传输与计算：`bigint` 基础单位（ZEC = zatoshi，8 位小数；`ZATOSHI_PER_ZEC = 100000000n`）。
- 输入：保留用户键入的十进制字符串，提交前 `parseUnits(str, decimals)`。
- 展示：`formatAmount(value, { decimals, exact })`，列表最多 4 位小数并带千分位；确认页/收据才 `exact`。
- 禁止：对余额做 `parseFloat`、浮点加减乘除、把金额当 `number` 存储。
- 余额显示：非零但小于精度下限时显示 `<0.0001`，**不能**显示 `0`。
- 输入净化：只允许数字与一个小数点，小数位不超过 `decimals`，去掉前导零。

### R9 地址、memo、支付链接

- 地址展示统一用 `Address`：类型标签（Unified / Sapling / Transparent / TEX）+ 中间截断（默认 8…6）+ 复制按钮。
- 校验只做 UX：`isValidAddress(addr, network)` 检查格式与 bech32/bech32m 校验和，**永远**以钱包 SDK / 节点校验为准；Sprout 视为不可用。
- memo 只允许发给 shielded 接收方（Unified / Sapling / Sprout）。长度上限 512 字节（UTF-8 计字节，不是字符），超限截断不得切碎多字节字符。
- ZIP-321 URI：单收款人 `zcash:<addr>?amount=…&memo=…`，多收款人 `zcash:?address=…&amount=…&address.1=…`；memo 用 base64url（无 padding）。

### R10 商标与署名

- 产品名**不得**包含 "Zcash"。可以说 "for Zcash"、"works with Zcash"。
- 产品名比 Zcash 标记更显眼；`ZcashMark` 不得改色，链接 `https://z.cash/`。
- 页脚始终渲染：`Not affiliated with the Zcash Foundation or Electric Coin Company.`（可改写措辞，不可删除）。
- 文案写自己的话，不复制 z.cash 的句子与图像。

### R11 无障碍

- 每个输入必须有 label：`Field` 包裹；需要视觉隐藏时用 `hideLabel`，不得移除。
- 错误信息 `role="alert"`，并通过 `aria-describedby` 关联控件；`aria-invalid="true"`。
- 焦点可见：`outline: 2px solid var(--nui-focus-ring); outline-offset: 3px`，不得移除。
- 图标按钮必须 `aria-label`；装饰图标 `aria-hidden`。
- 组合控件键盘可达：`ChipGroup`（role=group + roving tabindex）、`Tabs`（role=tablist/tab/tabpanel + 方向键）、`Segmented`（role=radiogroup/radio + 方向键）。
- Dialog / Drawer 用原生 `<dialog>` + `showModal()`，Esc 关闭；签名/提交中 `dismissible={false}`。
- 状态变化要有 live region：Toast 容器 `aria-live="polite"`，负向 toast `role="alert"`；`TxStatus` 播报状态；复制成功播报 `Copied`。
- 图表：容器 `tabIndex={0}` + 方向键移动读数；`svg` 带 `role="img"` 与 `aria-label` 摘要。
- 尊重 `prefers-reduced-motion`：把所有过渡/动画时长压到 0.01ms。
- 对比度下限见 `02`（正文 7:1，辅助 4.5:1，图表 3:1）。

### R12 纵向间距与节奏

- 门户页面：相邻内容区块间距 **32px**，由页面级 `Stack gap={8}` 统一提供；不要给子元素再加零散 margin。
- 产品页（`ProductShell` 内）：相邻内容区块间距 **24px**（`Stack gap={6}`）。
- 卡片/面板内部节奏独立：面板头 16px 上下 + 24px 左右，面板体 24px，面板脚 14px 上下。
- 区块纵向留白 `--nui-section-y`（64–130px clamp）只用于营销区块，不用于应用内页面。
- 表单字段之间 20px；字段 label 与控件 8px；操作区与内容 24px。

## 4. 间距尺度（唯一合法取值）

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 100 / 130`（token `space-1..32`）。

不允许出现 6px、10px、18px、22px、30px 这类"看着办"的间距（图表与图标内部的像素微调除外）。

## 5. 视图状态必须齐备

任何数据视图都要设计五种状态，不能只画"有数据"：

| 状态 | 做法 |
| --- | --- |
| 加载 | `Skeleton`（带 shimmer）或 `DataTable loading`（保留表头） |
| 空 | `EmptyState`（衬线小标题 + 一句话提示 + 一个动作） |
| 错误 | `Alert tone="negative"`（负向）+ 重试动作；表单错误贴近字段 |
| 无效/校验失败 | 字段级 `Field error` + `aria-invalid`；行级用 `data-invalid` + 负向文字 |
| 成功/进行中 | `TxStatus`（pending 闪动、confirmed 绿色、failed 红色）+ `Toast` |

## 6. 文案与语气

- 标题用陈述句，**以句号结尾**；不用感叹号，不用全大写（大写只给 12px 标签）。
- 标签、按钮、表头用大写 + 字距（英文），中文不加字距、不加空格。
- 英文：句子式大小写（Sentence case）用于标题与说明；UI 小标签全大写。
- 数字与单位之间保留空格：`1.2345 ZEC`、`52 ms`、`99.98%`。
- 不用营销夸张词（revolutionary、seamless、blazing）。用具体事实与限制。
- 原型必须自述示例性质：页面里出现 "Prototype" / "Sample data" 类标注，且不暗示已在生产部署。

## 7. 风险披露（强制）

以下五类页面必须在主操作附近放 `Alert tone="warning"`，说明具体风险而非套话：

| 场景 | 必须说明 |
| --- | --- |
| Bridge | 跨链后隐私级别如何变化；目标链上资产不再受 Zcash 屏蔽保护 |
| Lending | 清算价格与抵押率；抵押物价格波动会触发清算 |
| Perps | 杠杆放大亏损、资金费率、强平风险 |
| Prediction | 失败方份额结算为 0；仓位位于公开市场 |
| LaunchPad | 合约未经审计、可能损失全部投入、流动性风险 |

## 8. 反模式（出现即返工）

- 引入第二套 UI 库（MUI / Chakra / shadcn）与 NUI3 同屏。
- 渐变背景、玻璃拟态、发光边框、卡片阴影、胶囊按钮。
- 相邻两个深色区块叠放；或 `plum` 与 `navy` 两个深色区块紧邻。
- 一屏多个实心主按钮；或把强调色当页面/区块背景。
- 列表里显示 8 位小数（假精度）；把 `<0.0001` 显示成 `0`。
- 把 confidential/public 说成 private/anonymous。
- 无 label 的输入、被移除的焦点环、无 `aria-label` 的图标按钮。
- 为某个页面写一次性样式覆盖组件（应改 token 或加组件属性）。
- 深色区块里沿用浅色主题的辅助文字色（必须用 `inverse-*` 或 brand 覆盖规则）。
