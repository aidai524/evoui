# 03 · 通用组件契约

这份文档是所有组件共享的规则：命名、尺寸、状态、键盘、表单接线、无障碍、图标、i18n。单个组件的具体规格在 `04-component-reference.md`，两者冲突时以 `01` 的硬规则为准。

## 1. 命名与 DOM 约定

```html
<!-- block + modifier + element -->
<button class="nui-btn nui-btn--solid">            <!-- 修饰符 -->
<div class="nui-card">
  <div class="nui-card__head">…</div>              <!-- 元素 -->
  <h3 class="nui-card__title">…</h3>
</div>
```

- block：`nui-<name>`，短横线分隔，全小写。
- modifier：`nui-<block>--<variant>`，只表达变体（`--solid`、`--sm`、`--lg`、`--block`、`--danger`、`--divided`、`--horizontal`）。
- element：`nui-<block>__<part>`，不嵌套超过一层（`nui-token-input__top`，不写 `__top__left`）。
- 状态一律用属性表达，不用 modifier 类：

| 状态 | 表达 |
| --- | --- |
| 选中（chip/tab/segmented/token 行） | `aria-selected="true"` / `aria-pressed="true"` / `aria-checked="true"`，或 `aria-current="page"` |
| 无效 | `aria-invalid="true"`；非表单控件用 `data-invalid="true"` |
| 忙碌 | `aria-busy="true"`（按钮显示转圈） |
| 业务状态 | `data-status`（tx）、`data-state`（step）、`data-zone`（health）、`data-level`（privacy）、`data-pool`（pool）、`data-kind`（address）、`data-tone`（timeline）、`data-side`（drawer/tooltip）、`data-copied`、`data-over`（filedrop/memo 计数）、`data-active`（slider mark） |

- 尺寸修饰符：`--sm` / `--lg`；默认即中等（不要写 `--md` 类）。
- 布局用属性/自定义变量传值：`style={{ '--nui-cols': 3 }}` 仅限 `Stack/Cluster/Grid` 这类封装内部；**不要**在页面里内联覆盖 token。

## 2. 尺寸体系

所有交互控件默认高 `--nui-control-h`（48px），`compact` 密度下自动变 36px。下表是默认（comfortable）值：

| 组件 | 高 | 内边距 | 字号 / 行高 |
| --- | --- | --- | --- |
| Button md | 48px | 0（ghost）/ 24px（solid/outline/subtle/danger） | 13px / 1，字距 .2em，大写，500 |
| Button sm | 36px | 16px | 11px |
| Button lg | 56px | 32px | 14px |
| IconButton | 32×32 | 0 | 图标 13–15px |
| IconButton sm | 24×24 | 0 | 图标 12–13px |
| Input / Select / Textarea | 48px（textarea 最小 104px） | 0 14px（textarea 上下 12px） | 15px / 1.4 |
| InputGroup | 48px | addon 0 14px | 15px |
| SearchInput | 自动（约 38px） | 10px 28px 10px 0 | 14px |
| Switch | 40×22 | 滑块 14×14，位移 18px | — |
| Checkbox | 16×16 | 与文字间距 10px | 14px / 1.5 |
| Chip | 自动 | 18px 0 | 12px / 1，字距 .14em，大写 |
| Tab | 自动 | 14px 0 | 14px / 1，600 |
| Segmented item | `control-h - 16`（32px） | 0 14px | 12px / 1，字距 .08em，大写 |
| Badge / PrivacyBadge | 22px | 0 8px（privacy 左 6px） | 11px / 1，字距 .1em，600 |
| Pagination button | 34×34 | 0 10px | 13px / 1 |

其余组件（表格、面板、图表）的高度由内容与 `--nui-card-pad` / `--nui-cell-py` 决定，见 `04`。

## 3. 状态矩阵

每个可交互组件必须实现这七态，缺一即不合格：

| 状态 | 视觉 | 实现要点 |
| --- | --- | --- |
| default | 见 `04` 各组件 | — |
| hover | 边框升一级（`border→border-strong`）或文字升一级（`text-muted→text`） | 只用颜色/边框变化，不加阴影；150–300ms |
| focus-visible | `outline: 2px solid var(--nui-focus-ring); outline-offset: 3px` | 必须用 `:focus-visible`，不要 `:focus`（输入框除外，见下） |
| active/selected | `accent` 下划线 2px、`accent` 填充、或 `inset 0 -2px 0 accent` | 与 hover 区分 |
| disabled | `opacity: .4`（按钮）/ `.5`（输入），`cursor: not-allowed`，`pointer-events: none` | 保留在 DOM 与可访问树中；不要用 `display:none` |
| loading | `aria-busy="true"`，前置 12px 转圈（1.5px 边框，右透明，0.8s linear） | 保持按钮宽度不跳；提交中禁用重复点击 |
| invalid | 边框 `negative`；文字错误块左 2px `negative` 竖线 | 同时 `aria-invalid` + `aria-describedby` 指向错误 |

输入类控件例外：`:focus` 时 `outline: none`，改为 `border-color: var(--nui-border-focus)` **加** `box-shadow: inset 0 -2px 0 var(--nui-accent)`（金色下划线，禁止蓝色光晕）。

## 4. 键盘与交互基线

| 交互 | 要求 |
| --- | --- |
| Tab 顺序 | 只让当前选中项可 Tab（roving tabindex），其余项 `tabIndex={-1}` |
| ChipGroup / Tabs / Segmented | ←/→ 移动焦点并切换选中（`role=group`+`aria-pressed` / `role=tablist` / `role=radiogroup`+`aria-checked`） |
| Dialog | 原生 `<dialog>` + `showModal()`；Esc 关闭（`dismissible={false}` 时忽略 Esc 与背板点击）；打开后焦点进入对话框，关闭后回到触发元素 |
| Drawer | 同上，`data-side="right"`（默认）/`"left"`；入场 ±24px 位移 |
| 下拉导航面板 | 悬停或点击打开；`aria-expanded` + `aria-controls`；鼠标移出、点击面板外、Esc、选中项点击后关闭；面板顶部有 24px 不可见"悬停桥"防误关 |
| Tooltip | hover 或 `focus-within` 显示；Esc 隐藏；`role="tooltip"` + `aria-describedby` 关联触发器 |
| SearchInput | `/` 聚焦（可选）；Esc 清空并保留焦点 |
| TokenPicker | `aria-haspopup="dialog"`，对话框内搜索框 `autoFocus`，列表 `role="listbox"` + 每行 `role="option"` + `aria-selected`，禁用项 `aria-disabled` |
| 图表 | 容器 `tabIndex={0}`，←/→ 移动读数索引，`blur` 复位；`<svg role="img" aria-label>` |
| Slider | 原生 `<input type="range">`，`aria-valuetext` 给出格式化读数；刻度点击可跳转 |
| 复制 | 点击后 1.5s 内显示已复制态（`data-copied`），并在 live region 播报 `Copied` |
| 长流程 | 提交中禁用导航与关闭；确认页 `KeyValue` 展示完整数值（`exact`） |

## 5. 表单契约（Field）

`Field` 是唯一允许包裹输入的容器，它通过 context 自动接线：

| 自动行为 | 说明 |
| --- | --- |
| `id` | 生成稳定 id，控件的 `<label for>` 指向它 |
| label | 11–12px 大写、字距 .12em、`text-muted`；`hideLabel` 只做视觉隐藏（`sr-only`），**不移除** |
| hint | 13px、`text-muted`、行高 1.5，与 label 同行右对齐用 `labelAside` |
| error | 13px、`negative`、左侧 2px 竖线、`role="alert"`；有 error 时不显示 hint |
| `aria-describedby` | 依次拼接 hint id 与 error id |
| `aria-invalid` | 有 error 时自动 `true` |
| 布局 | 纵向 flex，label 与控件间距 8px；字段之间 20px |

需要多个输入共用一个 label 时（金额 + 代币选择器），用 `Group` 语义（`role="group"` + `aria-labelledby`），不要重复 label。

## 6. 无障碍基线（按组件类）

| 类别 | 要求 |
| --- | --- |
| Button | 有文字用 `<button>`；纯图标必须 `IconButton label`；链接用 `href` 渲染 `<a>`（外链自动 `target="_blank" rel="noopener noreferrer"` 并有 `opensInNewTab` 提示）；loading 时 `aria-busy` 且禁用 |
| Tabs | `role="tablist"` + `role="tab"` + `aria-controls` + `role="tabpanel"` + `aria-labelledby`；未激活面板 `hidden` 但保留 `tabIndex={0}` |
| Card（可点击） | 用 stretched link：整个卡片可点，但 DOM 里只有一个真实 `<a>`（`::before` 铺满），保证屏幕阅读器只读到一个链接 |
| DataTable | `<table>` 语义 + `<th scope="col">`；排序列 `aria-sort="ascending|descending"`；数字列 `.is-num` 右对齐 + `tabular-nums`；加载中 `aria-busy` 且保留表头；空态渲染 `EmptyState` 而非空表 |
| Alert / Toast | `positive/info` → `role="status"`；`negative` → `role="alert"`；toast 容器 `role="region" aria-live="polite" aria-label="Notifications"` |
| TxStatus | `aria-live="polite"`，文本随状态变化（Pending/Confirming/Confirmed/Failed/Expired/Refunded） |
| Amount | 隐藏模式：`••••••` 加 `aria-hidden="true"`，并用 `.sr-only` 文本读 `Amount hidden`（不要给整块加 `aria-hidden`，否则读屏用户以为没有金额） |
| Address/Hash | 完整值放在 `title` 与可聚焦文本中；截断只影响视觉（`truncate=[head,tail]`），复制永远复制完整值 |
| 图表 | 见上文；空数据渲染虚线边框的空状态并给出 `chartEmpty` 文案 |
| 骨架 | `aria-hidden="true"`，避免读屏读出占位块 |
| 图标 | 一律 `aria-hidden="true" focusable="false"`，除非图标是唯一内容（此时用 `IconButton` 的 label） |

## 7. 图标规范

- 内联 SVG，`viewBox` 按图标定义，`fill: none`，`stroke: currentColor`，`stroke-width: 1.4`，方头线帽（不使用圆头）。
- 尺寸档：10（chevron）、12（状态/徽章内）、13–14（行内操作）、15–16（搜索/交换）、18（菜单/按钮箭头）。
- 颜色永远继承 `currentColor`，不写死颜色。
- 必需图标集（12 个）：Arrow（18×10，`M1 5h15M12 1l4 4-4 4`）、External、Copy、Check、Close、Search、Swap（上下箭头）、Shield、Lock、Eye、Menu、Chevron。
- 品牌标记 `ZcashMark` 单独处理：官方图形，不改色，`size` 默认 40，`variant: 'color' | 'mono'`，有 `title` 时 `role="img"`。

## 8. i18n 契约

- provider：`<LocaleProvider locale="zh">`（任意 BCP-47 tag）；`base` 指定整套基础包，`messages` 做局部覆盖；未提供时按 `zh-*` 选中文包，其余英文包。
- 数字与日期格式跟随 provider 的 `locale`（`Intl.NumberFormat`），货币默认 USD。
- 应用侧文案不要硬编码：内容数据用 `{en, zh}` 对象 + `[lang]` 取值，或 `t('English','中文')`。
- 语言切换时同步 `document.documentElement.lang`。

### 消息目录（键 → en / zh）

| key | en | zh |
| --- | --- | --- |
| `copy` | Copy | 复制 |
| `copied` | Copied | 已复制 |
| `copyAddress` | Copy address | 复制地址 |
| `copyHash` | Copy hash | 复制哈希 |
| `close` | Close | 关闭 |
| `dismiss` | Dismiss | 关闭 |
| `notifications` | Notifications | 通知 |
| `cancel` | Cancel | 取消 |
| `confirm` | Confirm | 确认 |
| `menu` | Menu | 菜单 |
| `primaryNav` | Primary | 主导航 |
| `breadcrumb` | Breadcrumb | 面包屑 |
| `selectToken` | Select token | 选择代币 |
| `searchTokens` | Search tokens | 搜索代币 |
| `searchTokensPlaceholder` | Search name, symbol or address | 搜索名称、符号或地址 |
| `noTokensMatch` | No tokens match | 没有匹配的代币 |
| `tokens` | Tokens | 代币 |
| `balance` | Balance | 余额 |
| `max` | Max | 最大 |
| `amount` | Amount | 数量 |
| `switchTokens` | Switch tokens | 交换方向 |
| `amountHidden` | Amount hidden | 金额已隐藏 |
| `increase` | increase | 上涨 |
| `decrease` | decrease | 下跌 |
| `opensInNewTab` | opens in a new tab | 在新标签页打开 |
| `open` | Open | 打开 |
| `noResults` | No results | 没有结果 |
| `syncing` | Syncing | 同步中 |
| `synced` | Synced | 已同步 |
| `memoPlaceholder` | Optional encrypted memo | 可选的加密备注 |
| `memoTransparent` | Memos can only be sent to shielded addresses | 只有屏蔽地址可以接收备注 |
| `bytes` | bytes | 字节 |
| `qrFor` | QR code for | 二维码： |
| `healthFactor` | Health factor | 健康系数 |
| `zoneSafe` | safe | 安全 |
| `zoneWarning` | at risk | 有风险 |
| `zoneDanger` | liquidatable | 可被清算 |
| `txPending` | Pending | 待处理 |
| `txConfirming` | Confirming | 确认中 |
| `txConfirmed` | Confirmed | 已确认 |
| `txFailed` | Failed | 失败 |
| `txExpired` | Expired | 已过期 |
| `txRefunded` | Refunded | 已退回 |
| `privacyShielded` | Shielded | 屏蔽 |
| `privacyShieldedDesc` | Zcash shielded pool. Sender, recipient and amount are encrypted on-chain. | Zcash 屏蔽池。发送方、接收方和金额在链上加密。 |
| `privacyConfidential` | Confidential | 机密 |
| `privacyConfidentialDesc` | Confidential execution. Balances and positions are hidden from the public, but are processed by the execution environment and are not protected by Zcash shielded cryptography. | 机密执行。余额和仓位对公众不可见，但由执行环境处理，不受 Zcash 屏蔽密码学保护。 |
| `privacyPublic` | Public | 公开 |
| `privacyPublicDesc` | Public chain or external protocol. Addresses, amounts and history are visible to anyone. | 公链或外部协议。地址、金额和历史对所有人可见。 |
| `poolOrchard` / `poolSapling` / `poolTransparent` | Orchard / Sapling / Transparent | Orchard / Sapling / 透明 |
| `disclaimer` | Not affiliated with the Zcash Foundation or Electric Coin Company. | 与 Zcash 基金会及 Electric Coin Company 无隶属关系。 |
| `stepPending` / `stepActive` / `stepComplete` / `stepError` | pending / in progress / complete / error | 未开始 / 进行中 / 已完成 / 出错 |
| `price` `size` `total` `spread` `bids` `asks` `lastPrice` | Price Size Total Spread Bids Asks Last price | 价格 数量 累计 价差 买单 卖单 最新价 |
| `leverage` `long` `short` `entry` `mark` `liqPrice` `pnl` `market` `side` `closePosition` | Leverage Long Short Entry Mark Liq. price PnL Market Side Close | 杠杆 做多 做空 开仓价 标记价 强平价 盈亏 市场 方向 平仓 |
| `previous` `next` `page` | Previous Next Page | 上一页 下一页 第 |
| `reveal` `hide` | Reveal Hide | 显示 隐藏 |
| `dropFiles` `browse` `fileTooLarge` | Drop a file here, or / browse / File is too large | 把文件拖到这里，或 / 选择文件 / 文件过大 |
| `days` `hours` `minutes` `seconds` `ended` | d h m s Ended | 天 时 分 秒 已结束 |
| `operational` `degraded` `outage` `noData` | Operational Degraded Outage No data | 正常 降级 故障 无数据 |
| `recipient` `memo` `status` `remove` `valid` `rowsInvalid` `recipients` | Recipient Memo Status Remove Valid rows need attention recipients | 收款人 备注 状态 移除 有效 行需要处理 位收款人 |
| `invalidAddress` `invalidAmount` `memoNotAllowed` `memoTooLong` | Invalid address / Invalid amount / Memos need a shielded address / Memo over 512 bytes | 地址无效 / 金额无效 / 备注需要屏蔽地址 / 备注超过 512 字节 |
| `pasteCsv` `pasteCsvHint` `importCsv` `noCsvRows` | Paste CSV / Columns: name, address, amount, memo. The header is optional. / Import CSV / No payment rows found | 粘贴 CSV / 列：name、address、amount、memo；表头可省略。 / 导入 CSV / 未找到付款记录 |
| `chartEmpty` | No data for this range | 该时间段没有数据 |

## 9. 组件清单（99 条目）

| 分组 | 数量 | 条目 |
| --- | --- | --- |
| theme | 1 | ThemeProvider |
| foundation | 9 | Display, Heading, Eyebrow, Lead, Shell, Section, Stack, Cluster, Grid |
| actions | 6 | Button, IconButton, ChipGroup, Tabs, TabPanel, Segmented |
| forms | 10 | Field, Input, Textarea, Select, InputGroup, SearchInput, Switch, Checkbox, Slider, FileDrop |
| navigation | 6 | ZcashMark, Brand, Header, Breadcrumb, Footer, SubNav |
| surfaces | 13 | Card, ProjectCard, Panel, Stats, Stat, Badge, Alert, DataTable, KeyValue, Stepper, Progress, Skeleton, EmptyState |
| overlays | 3 | Dialog, Drawer, ToastProvider/useToast |
| zcash | 14 | Address, Hash, CopyButton/useCopy, Amount, PriceChange, PrivacyBadge, PoolBadge, ChainBadge, TokenIcon/TokenPair, TxStatus, SyncProgress, MemoInput, ReceiveQR, usePrivacyLevel |
| defi | 5 | TokenAmountInput, TokenPicker, SwapSwitch, HealthFactor, DetailList |
| trading | 6 | OrderBook, LeverageSlider, PnL, PositionTable, LiveValue, Countdown |
| charts | 10 | LineChart, PriceChart, CandleChart, BarChart, DonutChart, DepthChart, BondingCurve, BondingCurveChart, Sparkline, Legend |
| data | 2 | Meter, UptimeBar |
| prediction | 2 | OutcomeButton, ProbabilityBar |
| content | 9 | CodeBlock, SecretField, Timeline, Pagination, Tooltip, InfoTip, Disclosure, Identicon, NFTCard |
| payments | 2 | BatchPayments, BatchPaymentTable |
| i18n | 1 | LocaleProvider/useNuiLocale |

## 10. 工具函数契约

组件依赖以下纯函数，必须与组件一起实现（形态可以是任意语言，行为必须一致）。

### 定点金额

| 函数 | 行为 |
| --- | --- |
| `formatUnits(value, decimals)` | bigint/整数字符串 → 精确十进制字符串，去掉末尾 0；`123450000n, 8 → "1.2345"` |
| `parseUnits(str, decimals)` | 十进制字符串 → bigint；去掉 `, _ 空格`；小数位超过 `decimals` 抛错；非法输入抛错 |
| `tryParseUnits` | 同上，失败返回 `null`（用于实时校验） |
| `sanitizeAmountInput(raw, decimals)` | 逗号转点、去非数字字符、只保留第一个点、截断多余小数位、去除多余前导 0（`^0\d` → 去 0） |
| `formatAmount(value, opts)` | 千分位分组；默认最多 4 位小数；非零但过小时返回 `<0.0001`（负数 `>-0.0001`）；`exact` 显示全精度；`compact` 用于 `>4` 位整数部分（1.2K/3.4M） |
| `formatFiat(n, currency, locale)` | `<$0.01` 时 4 位小数，否则 2 位 |
| `formatPercent` / `formatCompact` | 百分数与紧凑记数 |
| 常量 | `ZEC_DECIMALS = 8`，`ZATOSHI_PER_ZEC = 100000000n` |

### 地址

| 函数 | 行为 |
| --- | --- |
| `parseAddress(input)` | 返回 `{ kind, network, shielded, checksum }` 或 `null`；kind ∈ unified/sapling/transparent/tex/sprout；bech32/bech32m 校验（大小写混写视为非法），base58 透明地址不做校验和（`checksum: null`） |
| `isValidAddress(addr, network?)` | 格式合法 + 校验和通过（可校验时）+ 网络匹配 + 拒绝已废弃的 Sprout |
| `isShieldedAddress` / `addressKind` | 快捷判断 |
| `verifyBech32(addr, variant)` | 不做 90 字符长度限制（Unified 地址超长） |
| `truncateMiddle(v, head=8, tail=6)` | `u1abcd…wxyz`，长度不足则不截断 |
| `ADDRESS_KIND_LABEL` | Unified / Sapling / Transparent / TEX / Sprout |

### memo / ZIP-321 / 批量支付

| 函数 | 行为 |
| --- | --- |
| `MEMO_MAX_BYTES = 512` | 按 UTF-8 字节计 |
| `memoByteLength` / `isMemoValid` | 字节长度与校验 |
| `truncateMemo(text, maxBytes)` | 按字符边界截断，不切碎多字节字符 |
| `encodeMemoBase64Url(text)` | base64url 去 padding |
| `buildPaymentUri(req \| req[])` | 单收款人 `zcash:<addr>?amount=…&memo=…`；多收款人 `zcash:?address=…&amount=…&address.1=…`；金额限 `^\d{1,8}(\.\d{1,8})?$`；memo 只能给 shielded 地址；非法输入抛错 |
| `parseCsv(text)` | RFC 4180：引号、转义引号、引号内逗号与换行；过滤全空行 |
| `parsePaymentCsv(text)` | 有表头（name/recipient/employee/姓名/收款人、address/addr/wallet/地址、amount/zec/value/金额、memo/note/reference/备注，顺序任意，大小写不敏感）或无表头 `address,amount[,memo]`；去 BOM |
| `validatePayments(rows, {decimals, network})` | 每行返回 `{ line, issues[], units, shielded }`，issues ∈ `address / amount / memoNotAllowed / memoTooLong / duplicate`；同时返回总数与有效/无效计数 |

### 其他

| 函数 | 行为 |
| --- | --- |
| `niceTicks(min, max, count)` | 图表轴刻度取整 |
| `paginationRange(page, pages, siblings)` | 带省略号的页码序列（`1 … 4 5 6 … 20`） |
| `contrastRatio(fg, bg)` / `checkContrast(tokens)` | WCAG 对比度与矩阵校验 |
| `PRIVACY_LEVELS` / `DEFAULT_DISCLAIMER` | 隐私级别元数据（含描述）与页脚免责声明常量 |
