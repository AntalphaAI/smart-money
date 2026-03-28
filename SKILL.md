---
name: smart-money
version: 1.0.2
description: Smart money whale tracking skill. Activate when user mentions smart money, whale tracking, 聪明钱, 鲸鱼追踪, fund tracking, on-chain signals, what are whales buying, track wallet, Paradigm, a16z, Wintermute, token buy sell signals, DEX trader monitoring.
metadata: {"openclaw":{"requires":{},"mcp":{"antalpha":{"url":"https://mcp-skills.ai.antalpha.com/mcp","tools":["antalpha-register","smart-money-signal","smart-money-watch","smart-money-list","smart-money-custom","smart-money-scan"]}}}}
---

# Smart Money Tracker

Track smart money (whale, VC fund, market maker) wallet activities on Ethereum mainnet. Get real-time trading signals when watched wallets make significant moves.

## MCP Endpoint

```
https://mcp-skills.ai.antalpha.com/mcp
```

Protocol: MCP Streamable HTTP (JSON-RPC over HTTP with `mcp-session-id` header).

### Connection Flow

```
1. POST /mcp → initialize (get mcp-session-id from response header)
2. POST /mcp → tools/call  (with mcp-session-id header)
```

## Setup — Agent Registration

Before using any smart-money tools, register once:

```
Tool:  antalpha-register
Args:  {}
Returns: { agent_id, api_key, created_at }
```

**Persist both `agent_id` and `api_key` locally:**
- Store at `~/.smart-money/agent.json`
- `agent_id` — pass in all subsequent tool calls
- `api_key` — when server-side API key auth is enabled, send as HTTP header `x-antalpha-agent-api-key` on every MCP request

Example `agent.json`:
```json
{
  "agent_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "api_key": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "created_at": "2026-03-28T09:00:00.000Z"
}
```

On first use:
1. Check if `~/.smart-money/agent.json` exists
2. If not, call `antalpha-register`, save both `agent_id` and `api_key`
3. Use `agent_id` for all MCP calls; include `api_key` as header if auth is enabled

## MCP Tools (7)

### antalpha-register
Register a new agent. Returns unique `agent_id` and `api_key`. Call once, persist both.

### smart-money-signal
Get trading signals from monitored wallets (public pool + your private addresses).

**Parameters:**
- `agent_id` (required): Your agent ID
- `level` (optional): `high` / `medium` / `low` / `all` (default: `all`)
- `limit` (optional): 1-100 (default: 20)
- `since` (optional): ISO 8601 timestamp

**Signal Levels:**
- 🔴 **HIGH**: Large buy >$50K or first-time token position
- 🟡 **MEDIUM**: Accumulation (≥2 buys of same token in 24h) or large sell >$50K
- 🟢 **LOW**: Regular transfers $1K-$50K

### smart-money-watch
View a specific wallet's recent trading activity.

**Parameters:**
- `agent_id` (required): Your agent ID
- `address` (required): Ethereum address (must be in public pool or your private list)
- `limit` (optional): 1-50 (default: 10)

### smart-money-list
List all monitored wallets (public + private, labeled).

**Parameters:**
- `agent_id` (required): Your agent ID

### smart-money-custom
Manage your private watchlist (add/remove, max 5 per agent).

**Parameters:**
- `agent_id` (required): Your agent ID
- `action` (required): `add` or `remove`
- `address` (required): Ethereum address
- `label` (optional): Human-readable name (required for add)
- `category` (optional): `fund` / `whale` / `dex_trader` / `nft_trader` / `other`

### smart-money-scan
Trigger on-demand scan of your private addresses. Public pool is scanned automatically by the server.

**Parameters:**
- `agent_id` (required): Your agent ID

### test-ping
Connectivity check. Returns service name and server time.

## Workflow

### Query Signals (most common)

```
1. smart-money-signal { agent_id, level: "high", limit: 10 }
2. Present signals to user with level/token/amount/context
```

### Add Custom Wallet

```
1. smart-money-custom { agent_id, action: "add", address: "0x...", label: "My Whale", category: "whale" }
2. smart-money-scan { agent_id }  ← trigger first scan
3. smart-money-signal { agent_id } ← check results
```

### Periodic Monitoring

When the user asks to "monitor", "track", "watch", "set alert", "定时监控", "设置提醒":

**Step 1 — Set up the watchlist:**
```
1. smart-money-custom { action: "add", address: "0x...", label: "...", category: "whale" }
2. smart-money-scan { agent_id }  ← initial scan
3. Confirm to user: "Added and scanned. Setting up monitoring."
```

**Step 2 — Create recurring check (adapt to agent capabilities):**

**If agent supports cron/scheduled tasks (e.g. OpenClaw):**
```
Create a cron job:
- Schedule: every 1 hour (or user-specified interval)
- Task: 
  1. smart-money-scan { agent_id }
  2. smart-money-signal { agent_id, level: "high", since: <last_check_time> }
  3. If new signals found → send alert to user
  4. If no signals → stay silent
- Store last_check_time in ~/.smart-money/monitor-state.json
```

OpenClaw cron prompt example (agent can use this directly):
```
Create a cron job that runs every hour:
1. Call smart-money-scan with my agent_id
2. Call smart-money-signal with level "high" and since = last check time
3. If there are new signals, send me a summary
4. Save the check timestamp for next run
```

**If agent does NOT support cron:**
```
1. Save monitoring intent to ~/.smart-money/monitor-config.json:
   { "enabled": true, "interval": "1h", "level": "high", "last_check": "..." }
2. On every new session/conversation start, check if monitoring is enabled
3. If enabled and enough time has passed since last_check:
   - Run smart-money-scan + smart-money-signal
   - Update last_check
   - Report any new signals
4. Tell user: "I'll check for new signals each time we chat.
   For real-time alerts, consider an agent platform with scheduled tasks."
```

**Step 3 — Monitor state file:**

`~/.smart-money/monitor-state.json`:
```json
{
  "agent_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "monitoring": true,
  "interval_minutes": 60,
  "min_level": "high",
  "last_check": "2026-03-28T16:00:00Z",
  "addresses_monitored": 2
}
```

## Agent Behavior Rules

### On "Monitor this address" / "设置提醒"
1. Add address via `smart-money-custom` (if not already added)
2. Run `smart-money-scan` immediately
3. Ask user preferred check interval (default: 1 hour) and alert level (default: high)
4. Set up recurring check using best available method (cron > session-start > manual)
5. Confirm setup with: monitoring target, interval, alert level

### On session start (if monitoring is enabled)
1. Read `~/.smart-money/monitor-state.json`
2. If `monitoring: true` and `now - last_check > interval`:
   - Run scan + signal check silently
   - Only speak up if new signals found
   - Update `last_check`

### On "Stop monitoring" / "取消监控"
1. Set `monitoring: false` in state file
2. Optionally remove addresses via `smart-money-custom { action: "remove" }`
3. Cancel cron job if one exists
4. Confirm: "Monitoring stopped."

## Message Template

When presenting signals to the user:

```
🔴 HIGH Signal | Paradigm Fund
Buy PEPE — $127.5K
First position (never held before)
TX: 0xabc...def | 2026-03-28 16:30 UTC

🟡 MEDIUM Signal | Jump Trading
Accumulating ARB — $45K
3rd buy in 24h
TX: 0x123...456 | 2026-03-28 15:20 UTC
```

## Public Pool (19 wallets)

VC Funds: Paradigm, a16z, Polychain Capital, Dragonfly Capital, DeFiance Capital
Market Makers: Wintermute, Jump Trading, Cumberland DRW
Whales: Vitalik.eth, Justin Sun, James Fickel
DeFi: Uniswap V2 ETH/USDT, Lido stETH, 0x Protocol
Exchanges: Binance Hot Wallet 14, Robinhood
Other: Nansen Smart Money 1, Alameda Research (Remnant), Celsius (Remnant)

## Data Source

- **Moralis Web3 API** — ERC20 transfers, native transfers, token prices
- **ETH Mainnet only** (V1)

## Security Notes

- Agent identity via UUID — no private keys involved
- `api_key` is secret; store securely, never expose in logs or prompts
- Private watchlist addresses are isolated per agent_id (multi-tenant)
- All data comes from public blockchain; no user funds are touched

---

*Powered by Antalpha AI on-chain analytics*
