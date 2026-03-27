# Smart Money

🦐 AI Agent 专用的以太坊聪明钱追踪 MCP Server。

追踪鲸鱼/基金/做市商的链上交易活动，生成分级信号（🔴高/🟡中/🟢低），通过 MCP 协议供 AI Agent 调用。

## 功能

- **实时扫描** — 监控 20+ 聪明钱钱包的 ERC20 和 ETH 交易
- **信号分级** — 自动判定交易重要性（大额买入、首次建仓、持续加仓）
- **钱包管理** — 动态添加/移除监控钱包
- **标签系统** — 预置钱包身份标签（基金/鲸鱼/做市商）

## 6 个 MCP Tools

| Tool | 说明 |
|---|---|
| `smart_money_signal` | 获取最新交易信号（支持按级别过滤） |
| `smart_money_watch` | 查看指定钱包的交易活动概览 |
| `smart_money_scan` | 触发即时扫描 |
| `smart_money_add` | 添加钱包到监控列表 |
| `smart_money_remove` | 移除钱包 |
| `smart_money_list` | 查看监控列表 |

## 快速开始

```bash
# 安装依赖
npm install

# 编译
npm run build

# 运行 (需要 Moralis API Key)
MORALIS_API_KEY=your_key npm start
```

## 信号规则

| 级别 | 触发条件 |
|---|---|
| 🔴 HIGH | 大额买入 >$50K，或首次建仓新 token |
| 🟡 MEDIUM | 24h 内同 token ≥2 笔加仓，或大额卖出 >$50K |
| 🟢 LOW | $1K-$50K 常规交易 |

## 预置钱包 (20个)

Wintermute, Paradigm, a16z, Jump Trading, Cumberland DRW, DeFiance Capital, Polychain, Justin Sun, Vitalik.eth, Binance, KuCoin, Gemini, Robinhood 等。

## 技术栈

- TypeScript + Node.js
- MCP SDK (`@modelcontextprotocol/sdk`)
- Moralis Web3 API
- SQLite (better-sqlite3)
- Zod (输入校验)

## 部署

详见 [DEPLOY.md](./DEPLOY.md) — 包含 Antalpha NestJS 集成指南。

## License

MIT
