# Smart Money — 部署文档

## 概述

Smart Money 是一个 MCP (Model Context Protocol) Server，通过 stdio 传输协议与 AI Agent 通信。它追踪以太坊主网上的聪明钱钱包活动，生成交易信号。

## 技术栈

| 层级 | 技术 |
|---|---|
| 语言 | TypeScript (ES2022) |
| 运行时 | Node.js ≥ 18 |
| 协议 | MCP (stdio transport) |
| 数据源 | Moralis Web3 API |
| 存储 | SQLite (better-sqlite3) |
| 校验 | Zod |

## 环境要求

- Node.js ≥ 18
- npm / pnpm
- Moralis API Key (免费 Plan 即可启动)

## 快速部署

### 1. 安装依赖

```bash
cd smart-money
npm install
```

### 2. 编译

```bash
npm run build
```

### 3. 配置环境变量

```bash
export MORALIS_API_KEY="your_moralis_api_key_here"
export SMT_DATA_DIR="./data"  # 可选，默认 ./data
```

### 4. 启动 MCP Server

```bash
npm start
# 或直接
node dist/index.js
```

开发模式（无需编译）：
```bash
npm run dev
```

## MCP 客户端集成

### 标准 MCP 配置 (mcp.json)

```json
{
  "mcpServers": {
    "smart-money": {
      "command": "node",
      "args": ["path/to/smart-money/dist/index.js"],
      "env": {
        "MORALIS_API_KEY": "your_key_here",
        "SMT_DATA_DIR": "path/to/data"
      }
    }
  }
}
```

### NestJS 集成 (Antalpha MCP Server)

在 Antalpha 的 NestJS 项目中，可通过 `@modelcontextprotocol/sdk` 的 client 连接：

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["path/to/smart-money/dist/index.js"],
  env: {
    MORALIS_API_KEY: process.env.MORALIS_API_KEY,
    SMT_DATA_DIR: "./data/smart-money",
  },
});

const client = new Client({ name: "antalpha-client", version: "1.0.0" });
await client.connect(transport);

// 调用工具
const result = await client.callTool({
  name: "smart_money_signal",
  arguments: { level: "high", limit: 10 },
});
```

## 数据存储

- SQLite 数据库文件位于 `SMT_DATA_DIR/smart-money.db`
- 种子钱包列表：`SMT_DATA_DIR/watchlist.json`
- 钱包标签：`SMT_DATA_DIR/labels.json`

**持久化注意事项：**
- 确保 `SMT_DATA_DIR` 指向持久化存储路径
- SQLite 文件包含所有历史交易和信号数据
- 备份时只需备份整个 data 目录

## MCP Tools 列表

| Tool | 用途 |
|---|---|
| `smart_money_signal` | 获取最新交易信号（支持按级别过滤） |
| `smart_money_watch` | 查看监控钱包的近期活动 |
| `smart_money_add` | 添加钱包到监控列表 |
| `smart_money_remove` | 从监控列表移除钱包 |
| `smart_money_scan` | 手动触发扫描（拉取最新链上数据） |

## Moralis 免费 Plan 限制

- 40,000 Compute Units / 天
- 每次 API 调用消耗不同 CU（Transfer 查询 ~5 CU，Price 查询 ~3 CU）
- 20 个钱包全量扫描约消耗 ~500 CU
- **建议扫描频率：每 5-15 分钟一次**

## 信号级别定义

| 级别 | 条件 | 示例 |
|---|---|---|
| 🔴 HIGH | 大额买入 >$50K 或首次建仓 | Paradigm 首次买入 PEPE $127K |
| 🟡 MEDIUM | 24h 内同 token ≥2 笔买入，或大额卖出 >$50K | Jump Trading 持续加仓 ARB |
| 🟢 LOW | $1K-$50K 常规交易 | Wintermute 买入 UNI $8K |

## 目录结构

```
smart-money/
├── src/
│   ├── index.ts              # MCP Server 入口
│   ├── moralis/
│   │   └── client.ts         # Moralis API 封装
│   ├── engine/
│   │   ├── signal-engine.ts   # 信号判定引擎
│   │   └── scanner.ts         # 钱包扫描器
│   ├── storage/
│   │   └── db.ts             # SQLite 数据层
│   ├── tools/
│   │   ├── schemas.ts         # Zod 输入校验
│   │   └── handlers.ts        # Tool 处理逻辑
│   └── data/
│       └── loader.ts          # 种子数据加载
├── data/
│   ├── watchlist.json         # 20 个种子钱包
│   └── labels.json            # 钱包标签映射
├── dist/                      # 编译输出
├── SKILL.md                   # Skill 说明文档
├── DEPLOY.md                  # 本文档
├── package.json
└── tsconfig.json
```

## 故障排除

| 问题 | 解决方案 |
|---|---|
| `MORALIS_API_KEY is required` | 设置环境变量 |
| `Rate limit exceeded` | 降低扫描频率，或升级 Moralis Plan |
| `SQLite BUSY` | 确保只有一个实例运行 |
| Token 价格返回 0 | 可能是新 token，Moralis 尚无价格数据 |
