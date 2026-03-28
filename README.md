# Smart Money Tracker v1.0.1

> AI Agent on-chain whale tracking skill. Track smart money wallets, get trading signals.

## Architecture (v2)

```
Agent (OpenClaw)  ──MCP──►  Antalpha Server  ──►  Moralis API
                              │                    │
                              └──  SQLite DB  ◄────┘
```

- **MCP remote mode**: Backend on Antalpha server, agents call via MCP protocol
- **Multi-tenant isolation**: Each agent gets a unique `agent_id`, private watchlists are isolated
- **Zero config**: No local API keys required for MCP mode

## MCP Tools (7)

| Tool | Description |
|------|-------------|
| `antalpha-register` | Register agent, get `agent_id` + `api_key` (call once) |
| `smart-money-signal` | Get trading signals (public pool + private addresses) |
| `smart-money-watch` | View specific wallet's recent activity |
| `smart-money-list` | List all monitored wallets |
| `smart-money-custom` | Add/remove private watchlist addresses (max 5) |
| `smart-money-scan` | Trigger on-demand scan of private addresses |
| `test-ping` | Connectivity check |

## MCP Server

```
https://mcp-skills.ai.antalpha.com/mcp
```

## Signal Levels

| Level | Trigger |
|-------|---------|
| 🔴 HIGH | Large buy >$50K, or first-time token position |
| 🟡 MEDIUM | Accumulation (≥2 buys of same token in 24h), or large sell >$50K |
| 🟢 LOW | Regular transfers $1K–$50K |

## Public Pool (19 wallets)

VC Funds, market makers, whales, DeFi protocols, and exchanges including:
Paradigm, a16z, Wintermute, Jump Trading, Cumberland DRW, Vitalik.eth, Justin Sun, Lido, Uniswap V2, Dragonfly Capital, and more.

## Data Source

- **Moralis Web3 API** — ERC20 transfers, native transfers, token prices
- **ETH Mainnet only** (V1)

## Changelog

### v1.0.1 (2026-03-28)
- Fix: `a]6z` typo → `a16z` in watchlist
- Fix: Jump Trading address inconsistency between watchlist and labels
- Fix: Normalize all addresses to lowercase for consistent lookup
- Fix: Remove unverified Vitalik address (`0xDbF5...`), keep only `vitalik.eth`
- Fix: SKILL.md proper frontmatter with single-line JSON metadata (OpenClaw registration)
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
