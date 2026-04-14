[🇺🇸 English](#english) · [🇨🇳 中文](#chinese)

---

<a name="english"></a>

# Smart Money Tracker

> AI Agent on-chain whale tracking skill. Track smart money wallets, get real-time trading signals including LP pool entries.

**v1.1**: Now tracks whale LP activity — detect when smart money adds/removes liquidity on Uniswap V2/V3.

## Install

```bash
openclaw skill install https://github.com/AntalphaAI/smart-money
```

## Architecture

```
Agent (OpenClaw)  ──MCP──►  Antalpha Server  ──►  Moralis API
                              │                    │
                              └──  SQLite DB  ◄────┘
```

- **MCP remote mode**: Backend on Antalpha server, agents call via MCP protocol
- **Multi-tenant isolation**: Each agent gets a unique `agent_id`, private watchlists are isolated
- **Zero config**: No local API keys required for MCP mode

## MCP Tools (8)

| Tool | Description |
|------|-------------|
| `antalpha-register` | Register agent, get `agent_id` + `api_key` (call once) |
| `smart-money-signal` | Get trading signals (public pool + private addresses) |
| `smart-money-watch` | View specific wallet's recent activity |
| `smart-money-list` | List all monitored wallets |
| `smart-money-custom` | Add/remove private watchlist addresses (max 5) |
| `smart-money-scan` | Trigger on-demand scan of private addresses |
| `smart-money-pool` | **v1.1** Query whale LP activity on Uniswap V2/V3 |
| `test-ping` | Connectivity check |

## MCP Server

```
https://mcp-skills.ai.antalpha.com/mcp
```

## Setup — Agent Registration

Before using any smart-money tools, register once:

```
Tool:  antalpha-register
Args:  {}
Returns: { agent_id, api_key, created_at }
```

Persist both `agent_id` and `api_key` to `~/.smart-money/agent.json`.

## Signal Levels

**Transfer / Swap signals:**

| Level | Trigger |
|-------|---------|
| 🔴 HIGH | Large buy >$50K, or first-time token position |
| 🟡 MEDIUM | Accumulation (≥2 buys of same token in 24h), or large sell >$50K |
| 🟢 LOW | Regular transfers $1K–$50K |

**Pool signals (v1.1 — POOL_IN / POOL_OUT):**

| Level | Trigger |
|-------|--------|
| 🔴 HIGH | Pool entry > $100K |
| 🟡 MEDIUM | Pool entry $10K–$100K |
| 🟢 LOW | Pool entry < $10K |

## Public Pool (19 wallets)

VC Funds, market makers, whales, DeFi protocols, and exchanges including:  
Paradigm, a16z, Wintermute, Jump Trading, Cumberland DRW, Vitalik.eth, Justin Sun, Lido, Uniswap V2, Dragonfly Capital, and more.

## Data Source

- **Moralis Web3 API** — ERC20 transfers, native transfers, token prices
- **ETH Mainnet only** (V1)

## Security Notes

- Agent identity via UUID — no private keys involved
- `api_key` is secret; store securely, never expose in logs or prompts
- Private watchlist addresses are isolated per `agent_id` (multi-tenant)
- All data comes from public blockchain; no user funds are touched

## Changelog

### v1.1.0 (2026-04-14)
- New: `smart-money-pool` tool — query whale LP add/remove activity on Uniswap V2/V3
- New: `smart-money-signal` extended with `POOL_IN` / `POOL_OUT` signal types
- New: Pool signal levels (>$100K → HIGH, $10K-$100K → MEDIUM, <$10K → LOW)
- New: Moralis Streams API integration for real-time LP event ingestion
- V3 tick range fields (`tick_lower` / `tick_upper`) included when available

### v1.0.2
- Add: SKILL.md version bump and description refinement

### v1.0.1 (2026-03-28)
- Fix: `a]6z` typo → `a16z` in watchlist
- Fix: Jump Trading address inconsistency between watchlist and labels
- Fix: Normalize all addresses to lowercase for consistent lookup
- Fix: Remove unverified Vitalik address (`0xDbF5...`), keep only `vitalik.eth`
- Fix: SKILL.md proper frontmatter with single-line JSON metadata
- Fix: Document `api_key` usage from `antalpha-register` return
- Fix: Consistent agent storage path (`~/.smart-money/agent.json`)
- Fix: README + SKILL.md tool count updated to 7 (was 5)
- Improve: Replace 3 exchange hot wallets with Uniswap V2, Lido stETH, Dragonfly Capital
- Improve: README rewritten in English
- Improve: Added Security Notes section

### v1.0.0 (2026-03-28)
- Initial release: MCP remote mode, 20 pre-loaded wallets, signal/watch/list/custom/scan tools

## License

MIT

---

<a name="chinese"></a>

# Smart Money 聪明钱追踪器

> AI Agent 链上鲸鱼追踪技能。追踪聪明钱钱包动向，获取实时交易信号（含 LP 入池信号）。

*v1.1 新增*：追踪鲸鱼 LP 行为 — 当聪明钱在 Uniswap V2/V3 添加流动性时自动弹出高强度建仓信号。

## 安装

```bash
openclaw skill install https://github.com/AntalphaAI/smart-money
```

## 架构

```
Agent (OpenClaw)  ──MCP──►  Antalpha 服务器  ──►  Moralis API
                              │                    │
                              └──  SQLite DB  ◄────┘
```

- **MCP 远程模式**：后端部署在 Antalpha 服务器，Agent 通过 MCP 协议调用
- **多租户隔离**：每个 Agent 获得唯一 `agent_id`，私有监控列表相互隔离
- **零配置**：MCP 模式无需本地 API Key

## MCP 工具（共 8 个）

| 工具 | 说明 |
|------|------|
| `antalpha-register` | 注册 Agent，获取 `agent_id` + `api_key`（只需调用一次） |
| `smart-money-signal` | 获取交易信号（公共池 + 私有地址） |
| `smart-money-watch` | 查看指定钱包的近期活动 |
| `smart-money-list` | 列出所有监控钱包 |
| `smart-money-custom` | 添加/移除私有监控地址（最多 5 个） |
| `smart-money-scan` | 手动触发私有地址扫描 |
| `smart-money-pool` | *v1.1* 查询鲸鱼 LP 活动（Uniswap V2/V3 入池/退池） |
| `test-ping` | 连通性检查 |

## MCP 服务器地址

```
https://mcp-skills.ai.antalpha.com/mcp
```

## 初始化 — Agent 注册

首次使用前调用一次注册接口：

```
工具：  antalpha-register
参数：  {}
返回值：{ agent_id, api_key, created_at }
```

将 `agent_id` 和 `api_key` 持久化存储到 `~/.smart-money/agent.json`。

## 信号等级

| 等级 | 触发条件 |
|------|---------|
| 🔴 高 | 单笔买入 >$50K，或首次持仓某 Token |
| 🟡 中 | 24h 内同一 Token 累计买入 ≥2 次，或单笔卖出 >$50K |
| 🟢 低 | 常规转账 $1K–$50K |

## 公共监控池（19 个钱包）

涵盖 VC 基金、做市商、巨鲸、DeFi 协议及交易所，包括：  
Paradigm、a16z、Wintermute、Jump Trading、Cumberland DRW、Vitalik.eth、孙宇晨、Lido、Uniswap V2、Dragonfly Capital 等。

## 数据来源

- **Moralis Web3 API** — ERC20 转账、原生代币转账、Token 价格
- **Moralis Streams API**（v1.1）— 实时 LP 事件（Uniswap V2/V3 Mint/Burn Webhook 落库）
- **仅支持以太坊主网**（V1）

## 安全说明

- Agent 身份通过 UUID 标识，不涉及私钥
- `api_key` 为私密凭据，请安全存储，切勿在日志或提示词中暴露
- 私有监控列表按 `agent_id` 隔离（多租户）
- 所有数据均来自公开链上数据，不涉及用户资金

## 更新日志

### v1.1.0（2026-04-14）
- 新增：`smart-money-pool` 工具 — 查询鲸鱼在 Uniswap V2/V3 的 LP 添加/移除活动
- 新增：`smart-money-signal` 支持 `POOL_IN` / `POOL_OUT` 信号类型
- 新增：Pool 信号强度等级（>$100K → HIGH，$10K-$100K → MEDIUM，<$10K → LOW）
- 新增：Moralis Streams API 集成，实时接收 LP 事件并落库
- V3 tick range 字段（`tick_lower` / `tick_upper`）可选返回

### v1.0.2
- 更新：SKILL.md 版本号及描述优化

### v1.0.1（2026-03-28）
- 修复：`a]6z` 拼写错误 → `a16z`
- 修复：Jump Trading 地址在监控列表和标签中不一致
- 修复：所有地址统一转为小写，确保查找一致性
- 修复：移除未验证的 Vitalik 地址（`0xDbF5...`），仅保留 `vitalik.eth`
- 修复：SKILL.md 前置元数据规范化（单行 JSON）
- 修复：补充 `antalpha-register` 返回的 `api_key` 使用说明
- 修复：统一 Agent 存储路径（`~/.smart-money/agent.json`）
- 修复：README + SKILL.md 工具数量更新为 7（原为 5）
- 优化：将 3 个交易所热钱包替换为 Uniswap V2、Lido stETH、Dragonfly Capital
- 优化：README 全面重写（英文版）
- 优化：新增安全说明章节

### v1.0.0（2026-03-28）
- 初始版本：MCP 远程模式，预载 20 个钱包，含 signal/watch/list/custom/scan 工具

## 许可证

MIT
