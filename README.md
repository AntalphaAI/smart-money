[🇺🇸 English](#english) · [🇨🇳 中文](#chinese)

---

<a name="english"></a>

# Smart Money Tracker

> AI Agent on-chain whale tracking skill. Track smart money wallets, get real-time trading signals including LP pool entries and custom address subscriptions.

**v1.2**: Add up to 5 personal wallets for real-time monitoring. Same address shared across agents uses one Moralis Stream (Reference Counting) — no duplicate billing.  
**v1.1**: Whale LP activity tracking — detect when smart money adds/removes liquidity on Uniswap V2/V3.

## Install

```bash
openclaw skill install https://github.com/AntalphaAI/smart-money
```

## Architecture

```
Agent (OpenClaw)  ──MCP──►  Antalpha Server  ──►  Moralis API
                              │                    (Streams + REST)
                  agent_id    ├── smart_money_watchlist
                              ├── agent_watched_wallets   ← v1.2 new
                              └── sm_stream_registry      ← v1.2 new (RC)
```

- **MCP remote mode**: Backend on Antalpha server, agents call via MCP protocol
- **Multi-tenant isolation**: Each agent gets a unique `agent_id`, custom watchlists are isolated per agent
- **Zero config**: No local API keys required for MCP mode
- **RC-based Streams**: Same wallet address across multiple agents shares one Moralis Stream

## Quick Start

```
# Step 1: Register (once)
Tool: antalpha-register
→ Save agent_id + api_key to ~/.smart-money/agent.json

# Step 2: Get whale signals
Tool: smart-money-signal
Args: { agent_id: "...", level: "high" }

# Step 3 (v1.2): Add your own address
Tool: smart-money-custom
Args: { agent_id: "...", action: "add", address: "0x...", label: "My Whale" }
→ Moralis Stream auto-created, stream_id back-filled

# Step 4: Query merged signals (public + your custom)
Tool: smart-money-signal
Args: { agent_id: "...", level: "all" }
```

## MCP Server

```
https://mcp-skills.ai.antalpha.com/mcp
```

## MCP Tools

| Tool | v | Description |
|------|---|-------------|
| `antalpha-register` | v1 | Register agent, get `agent_id` + `api_key` (call once) |
| `smart-money-signal` | v1.2 | Get trading signals — public pool **+** your custom addresses merged |
| `smart-money-watch` | v1 | View a specific wallet's recent activity |
| `smart-money-list` | v1 | List all monitored wallets (public + custom) |
| `smart-money-custom` | v1.2 | **Add / remove / list** custom addresses with auto Moralis Streams RC |
| `smart-money-scan` | v1 | Trigger on-demand scan of custom addresses |
| `smart-money-pool` | v1.1 | Query whale LP activity on Uniswap V2/V3 |

## User Scenarios

### 🔍 Scenario 1 — Daily whale signal check

> "What are smart money wallets buying today?"

```
smart-money-signal { agent_id, level: "high", limit: 20 }
```

Response:
```
🔴 HIGH Signal | Paradigm Fund
Buy PEPE — $127.5K · First position ever
TX: 0xabc...def | 2026-04-17 08:00 UTC

🟡 MEDIUM Signal | Wintermute
Accumulating ARB — $45K · 3rd buy in 24h
TX: 0x123...456 | 2026-04-17 06:20 UTC

Powered by Antalpha AI
```

---

### 👁 Scenario 2 — Track a specific wallet's activity

> "Show me what Paradigm has been doing lately"

```
smart-money-watch { agent_id, address: "0xParadigm...", limit: 10 }
```

---

### ➕ Scenario 3 — Add a personal wallet to monitor (v1.2)

> "Track this address for me: 0xABC... — it's my target whale"

```
# Add to custom list (Moralis Stream auto-created)
smart-money-custom {
  agent_id,
  action: "add",
  address: "0xABC...",
  label: "Target Whale"
}

# Trigger first scan
smart-money-scan { agent_id }

# Get combined signals (public pool + your custom)
smart-money-signal { agent_id, level: "all" }
```

**Result**: Your custom address is now monitored via Moralis Streams alongside the public whale pool. Signals from both sources are returned in one merged response.

---

### 📋 Scenario 4 — List and manage custom addresses (v1.2)

> "Which addresses am I watching? How many slots are left?"

```
smart-money-custom { agent_id, action: "list" }
```

Response:
```json
{
  "private_count": 2,
  "remaining_slots": 3,
  "wallets": [
    { "address": "0xABC...", "label": "Target Whale", "stream_id": "abc-123", "added_at": "2026-04-17T08:00:00Z" },
    { "address": "0xDEF...", "label": "Fund X",       "stream_id": "def-456", "added_at": "2026-04-16T12:00:00Z" }
  ]
}
```

---

### ➖ Scenario 5 — Remove a custom address (v1.2)

> "Stop tracking 0xABC..."

```
smart-money-custom { agent_id, action: "remove", address: "0xABC..." }
```

**Result**: Address removed, Moralis Stream deregistered (if no other agents are watching the same address via Reference Counting).

---

### 🏊 Scenario 6 — Whale LP pool activity

> "Is Paradigm adding liquidity anywhere recently?"

```
smart-money-pool {
  agent_id,
  address: "0xParadigm...",
  event_type: "POOL_IN",
  dex: "uniswap_v3",
  limit: 5
}
```

Response:
```
🔴 HIGH Signal | Paradigm Fund
POOL_IN — USDC/ETH (Uniswap V3) · $215K
Pool: 0x88e6A...  TX: 0xabc...def | 2026-04-14 04:00 UTC
```

---

### ⏰ Scenario 7 — Set up recurring monitoring (OpenClaw)

> "Alert me every hour if any high-level signals appear"

```bash
openclaw cron add \
  --name "whale-alert" \
  --cron "0 * * * *" \
  --message "Check smart-money-signal for agent <id>, level high. Alert me if new signals since last check."
```

---

### 🔄 Scenario 8 — Multiple agents, same address (RC behavior)

> Agent A and Agent B both add `0xVitalik...`

- Agent A adds → Moralis Stream created, `ref_count = 1`
- Agent B adds → **same Stream reused**, `ref_count = 2`, no duplicate billing
- Agent A removes → `ref_count = 1`, Stream still alive
- Agent B removes → `ref_count = 0`, Stream deleted automatically

---

## Signal Levels

**Transfer / Swap signals:**

| Level | Trigger |
|-------|---------|
| 🔴 HIGH | Large buy > $50K, or first-time token position |
| 🟡 MEDIUM | Accumulation (≥2 buys of same token in 24h), or large sell > $50K |
| 🟢 LOW | Regular transfers $1K–$50K |

**Pool signals (POOL_IN / POOL_OUT):**

| Level | Trigger |
|-------|---------|
| 🔴 HIGH | Pool entry > $100K |
| 🟡 MEDIUM | Pool entry $10K–$100K |
| 🟢 LOW | Pool entry < $10K |

## Public Pool (19 wallets)

VC Funds: Paradigm, a16z, Polychain Capital, Dragonfly Capital, DeFiance Capital  
Market Makers: Wintermute, Jump Trading, Cumberland DRW  
Whales: Vitalik.eth, Justin Sun, James Fickel  
DeFi: Uniswap V2 ETH/USDT, Lido stETH, 0x Protocol  
Exchanges: Binance Hot Wallet 14, Robinhood  
Other: Nansen Smart Money 1, Alameda Research (Remnant), Celsius (Remnant)

## Data Source

- **Moralis Web3 API** — ERC20 transfers, native transfers, token prices
- **Moralis Streams API** — real-time LP events + custom address webhooks (v1.1+)
- **ETH Mainnet only** (V1)

## Security Notes

- Agent identity via UUID — no private keys involved
- `api_key` is secret; store securely, never expose in logs or prompts
- Custom watchlist addresses are isolated per `agent_id` (multi-tenant)
- Moralis Stream deregistered automatically on `remove` (no zombie streams, RC-guarded)
- All data comes from public blockchain; no user funds are touched

## Changelog

### v1.2.0 (2026-04-17)
- `smart-money-custom` upgraded: supports `add` / `remove` / `list` with Moralis Streams auto-registration
- Reference Counting (RC): same address across multiple agents shares ONE Moralis Stream; auto-cleanup when last reference released
- New DB tables: `agent_watched_wallets`, `sm_stream_registry`
- `smart-money-signal` merges public pool + agent custom addresses in one response

### v1.1.0 (2026-04-14)
- New: `smart-money-pool` — whale LP add/remove events (Uniswap V2/V3)
- New: `POOL_IN` / `POOL_OUT` signal types in `smart-money-signal`
- New: Moralis Streams API integration for real-time LP webhook ingestion

### v1.0.2
- Add: monitoring setup guide, agent behavior rules

### v1.0.1 (2026-03-28)
- Various bugfixes and address normalization

### v1.0.0 (2026-03-28)
- Initial release

## License

MIT

---

<a name="chinese"></a>

# Smart Money 聪明钱追踪器

> AI Agent 链上鲸鱼追踪技能。追踪聪明钱钱包动向，获取实时交易信号（含 LP 入池信号与自定义地址订阅）。

**v1.2 新增**：自定义地址订阅 — 最多添加 5 个个人监控地址，通过 Moralis Streams 实时推送信号。相同地址跨多个 Agent 共享一个 Stream（引用计数），避免重复计费。  
**v1.1 新增**：鲸鱼 LP 行为追踪 — 当聪明钱在 Uniswap V2/V3 添加流动性时自动生成高强度信号。

## 安装

```bash
openclaw skill install https://github.com/AntalphaAI/smart-money
```

## 架构

```
Agent (OpenClaw)  ──MCP──►  Antalpha 服务器  ──►  Moralis API
                              │                    (Streams + REST)
                  agent_id    ├── smart_money_watchlist
                              ├── agent_watched_wallets   ← v1.2 新增
                              └── sm_stream_registry      ← v1.2 新增（引用计数）
```

- **MCP 远程模式**：后端部署在 Antalpha 服务器，Agent 通过 MCP 协议调用
- **多租户隔离**：每个 Agent 获得唯一 `agent_id`，自定义监控列表相互隔离
- **零配置**：MCP 模式无需本地 API Key
- **引用计数 Stream**：多 Agent 监控同一地址时共享一个 Moralis Stream

## 快速上手

```
# 第一步：注册（仅需一次）
工具：antalpha-register
→ 保存 agent_id + api_key 到 ~/.smart-money/agent.json

# 第二步：获取鲸鱼信号
工具：smart-money-signal
参数：{ agent_id: "...", level: "high" }

# 第三步（v1.2）：添加自定义地址
工具：smart-money-custom
参数：{ agent_id: "...", action: "add", address: "0x...", label: "目标鲸鱼" }
→ Moralis Stream 自动创建，stream_id 回填

# 第四步：查询合并信号（公共池 + 自定义地址）
工具：smart-money-signal
参数：{ agent_id: "...", level: "all" }
```

## MCP 服务器

```
https://mcp-skills.ai.antalpha.com/mcp
```

## MCP 工具

| 工具 | 版本 | 说明 |
|------|------|------|
| `antalpha-register` | v1 | 注册 Agent，获取 `agent_id` + `api_key`（仅需一次） |
| `smart-money-signal` | v1.2 | 获取交易信号（公共池 **+** 自定义地址合并） |
| `smart-money-watch` | v1 | 查看指定钱包的近期活动 |
| `smart-money-list` | v1 | 列出所有监控钱包（公共 + 自定义） |
| `smart-money-custom` | v1.2 | **添加 / 删除 / 查看**自定义地址，自动管理 Moralis Streams（引用计数） |
| `smart-money-scan` | v1 | 手动触发自定义地址扫描 |
| `smart-money-pool` | v1.1 | 查询鲸鱼 LP 活动（Uniswap V2/V3 入池/退池） |

## 用户场景

### 🔍 场景一 — 日常鲸鱼信号查看

> "今天聪明钱在买什么？"

```
smart-money-signal { agent_id, level: "high", limit: 20 }
```

返回示例：
```
🔴 高强度信号 | Paradigm Fund
买入 PEPE — $127.5K · 首次建仓
TX: 0xabc...def | 2026-04-17 08:00 UTC

🟡 中强度信号 | Wintermute
累积 ARB — $45K · 24h 内第 3 次买入
TX: 0x123...456 | 2026-04-17 06:20 UTC

由 Antalpha AI 提供聚合服务
```

---

### 👁 场景二 — 查看特定钱包动向

> "Paradigm 最近在做什么？"

```
smart-money-watch { agent_id, address: "0xParadigm...", limit: 10 }
```

---

### ➕ 场景三 — 添加个人监控地址（v1.2）

> "帮我追踪这个地址：0xABC...，这是我盯的目标鲸鱼"

```
# 添加到自定义列表（Moralis Stream 自动创建）
smart-money-custom {
  agent_id,
  action: "add",
  address: "0xABC...",
  label: "目标鲸鱼"
}

# 触发首次扫描
smart-money-scan { agent_id }

# 获取合并信号（公共池 + 自定义地址）
smart-money-signal { agent_id, level: "all" }
```

**效果**：自定义地址通过 Moralis Streams 实时监控，与公共鲸鱼池信号在同一接口合并返回，上层无感知。

---

### 📋 场景四 — 查看并管理自定义地址（v1.2）

> "我现在在追踪哪些地址？还剩几个名额？"

```
smart-money-custom { agent_id, action: "list" }
```

返回示例：
```json
{
  "private_count": 2,
  "remaining_slots": 3,
  "wallets": [
    { "address": "0xABC...", "label": "目标鲸鱼", "stream_id": "abc-123", "added_at": "2026-04-17T08:00:00Z" },
    { "address": "0xDEF...", "label": "Fund X",   "stream_id": "def-456", "added_at": "2026-04-16T12:00:00Z" }
  ]
}
```

---

### ➖ 场景五 — 取消监控某个地址（v1.2）

> "不想追踪 0xABC... 了"

```
smart-money-custom { agent_id, action: "remove", address: "0xABC..." }
```

**效果**：地址从列表中移除，对应 Moralis Stream 自动注销（引用计数归零时才真正删除）。

---

### 🏊 场景六 — 鲸鱼 LP 入池检测

> "Paradigm 最近有没有往流动性池里加钱？"

```
smart-money-pool {
  agent_id,
  address: "0xParadigm...",
  event_type: "POOL_IN",
  dex: "uniswap_v3",
  limit: 5
}
```

返回示例：
```
🔴 高强度信号 | Paradigm Fund
POOL_IN — USDC/ETH（Uniswap V3）· $215K
池子：0x88e6A...  TX: 0xabc...def | 2026-04-14 04:00 UTC
```

---

### ⏰ 场景七 — 设置定时监控（OpenClaw）

> "每小时提醒我一次高强度信号"

```bash
openclaw cron add \
  --name "鲸鱼报警" \
  --cron "0 * * * *" \
  --message "用 agent_id <id> 检查 smart-money-signal，level 为 high，只取上次检查后的新信号，有新信号时通知我。"
```

---

### 🔄 场景八 — 多 Agent 共享地址的引用计数行为（v1.2）

> Agent A 和 Agent B 都添加了 `0xVitalik...`

- Agent A 添加 → Moralis Stream 创建，`ref_count = 1`
- Agent B 添加 → **复用同一 Stream**，`ref_count = 2`，无重复计费
- Agent A 删除 → `ref_count = 1`，Stream 继续存活
- Agent B 删除 → `ref_count = 0`，Stream 自动删除

---

## 信号等级

**转账 / 交换信号：**

| 等级 | 触发条件 |
|------|---------|
| 🔴 高 | 单笔买入 > $50K，或首次持仓某 Token |
| 🟡 中 | 24h 内同一 Token 累计买入 ≥ 2 次，或单笔卖出 > $50K |
| 🟢 低 | 常规转账 $1K–$50K |

**LP 池子信号（POOL_IN / POOL_OUT）：**

| 等级 | 触发条件 |
|------|---------|
| 🔴 高 | 入池金额 > $100K |
| 🟡 中 | 入池金额 $10K–$100K |
| 🟢 低 | 入池金额 < $10K |

## 公共监控池（19 个钱包）

VC 基金：Paradigm、a16z、Polychain Capital、Dragonfly Capital、DeFiance Capital  
做市商：Wintermute、Jump Trading、Cumberland DRW  
巨鲸：Vitalik.eth、孙宇晨、James Fickel  
DeFi 协议：Uniswap V2 ETH/USDT、Lido stETH、0x Protocol  
交易所：Binance 热钱包 14、Robinhood  
其他：Nansen Smart Money 1、Alameda Research（残余）、Celsius（残余）

## 数据来源

- **Moralis Web3 API** — ERC20 转账、原生代币转账、Token 价格
- **Moralis Streams API** — 实时 LP 事件 + 自定义地址 Webhook（v1.1+）
- **仅支持以太坊主网**（V1）

## 安全说明

- Agent 身份通过 UUID 标识，不涉及私钥
- `api_key` 为私密凭据，请安全存储，切勿在日志或提示词中暴露
- 自定义监控列表按 `agent_id` 隔离（多租户）
- `remove` 操作自动注销 Moralis Stream（引用计数保护，无僵尸 Stream）
- 所有数据均来自公开链上数据，不涉及用户资金

## 更新日志

### v1.2.0（2026-04-17）
- 升级：`smart-money-custom` 支持 `add` / `remove` / `list`，自动管理 Moralis Streams
- 新增：引用计数（RC）— 多 Agent 监控同一地址共享一个 Stream，最后一个引用释放时自动删除
- 新增：数据表 `agent_watched_wallets`、`sm_stream_registry`
- 升级：`smart-money-signal` 合并公共池 + 自定义地址两路结果，统一返回

### v1.1.0（2026-04-14）
- 新增：`smart-money-pool` 工具，查询鲸鱼 LP 添加/移除活动（Uniswap V2/V3）
- 新增：`POOL_IN` / `POOL_OUT` 信号类型
- 新增：Moralis Streams API 集成，实时接收 LP 事件

### v1.0.2
- 新增监控设置指南和 Agent 行为规则

### v1.0.1（2026-03-28）
- 多项 Bug 修复及地址规范化

### v1.0.0（2026-03-28）
- 初始版本

## 许可证

MIT
