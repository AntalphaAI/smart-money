# Smart Money

Track whale and smart money wallet activities on Ethereum mainnet. Generates trading signals when watched wallets make significant moves.

## Tools

### smart_money_signal
Get latest trading signals from monitored wallets.

**Parameters:**
- `level` (optional): Filter by signal level - `high`, `medium`, `low`, or `all` (default: `all`)
- `limit` (optional): Max signals to return (default: 20, max: 100)
- `since` (optional): ISO timestamp - only return signals after this time

**Signal Levels:**
- 🔴 **HIGH**: Large buy (>$50K) or first-time token position
- 🟡 **MEDIUM**: Accumulation pattern (≥2 buys of same token in 24h) or large sell (>$50K)  
- 🟢 **LOW**: Regular transfers above $1K

### smart_money_watch
View monitored wallets and their recent activities.

**Parameters:**
- `address` (optional): Specific wallet address. Omit for overview of all watched wallets
- `limit` (optional): Recent transactions to show per wallet (default: 10)

### smart_money_add
Add a new wallet to the watchlist.

**Parameters:**
- `address` (required): Ethereum address (0x...)
- `label` (optional): Human-readable name (e.g., "Paradigm Fund")
- `category` (optional): `fund`, `whale`, `dex_trader`, `nft_trader`, `other`

### smart_money_remove
Remove a wallet from the watchlist.

**Parameters:**
- `address` (required): Ethereum address to remove

### smart_money_scan
Trigger a manual scan for new transactions.

**Parameters:**
- `address` (optional): Scan a specific wallet. Omit to scan all watched wallets.

## Pre-loaded Wallets (20)

The tracker comes with 20 pre-loaded smart money wallets including:
- **VC Funds**: Paradigm, a16z, Dragonfly Capital, Multicoin Capital
- **Market Makers**: Wintermute, Jump Trading
- **Whales**: Vitalik Buterin, Justin Sun
- **Exchanges**: Binance, OKX, Huobi (for flow analysis)

## Data Source

- **Moralis Web3 API** — ERC20 transfers, native transfers, token prices
- **ETH Mainnet only** (V1)
