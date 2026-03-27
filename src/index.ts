/**
 * Smart Money Tracker — MCP Server Entry Point
 * 
 * Exposes tools via Model Context Protocol for AI agents
 * to track and analyze smart money wallet activities on Ethereum.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initMoralis } from "./moralis/client.js";
import { initDb } from "./storage/db.js";
import { loadWatchlist } from "./data/loader.js";
import {
  SignalInputSchema,
  WatchInputSchema,
  AddWalletInputSchema,
  RemoveWalletInputSchema,
  ListWalletsInputSchema,
  ScanInputSchema,
} from "./tools/schemas.js";
import {
  handleSignal,
  handleWatch,
  handleAddWallet,
  handleRemoveWallet,
  handleListWallets,
  handleScan,
} from "./tools/handlers.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // ─── Config ───
  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    console.error("MORALIS_API_KEY environment variable is required");
    process.exit(1);
  }

  const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "data");

  // ─── Initialize ───
  console.error("[smart-money] Initializing Moralis...");
  await initMoralis(apiKey);

  console.error("[smart-money] Initializing database...");
  initDb(dataDir);

  console.error("[smart-money] Loading watchlist...");
  await loadWatchlist(dataDir);

  // ─── MCP Server ───
  const server = new McpServer({
    name: "smart-money",
    version: "0.1.0",
  });

  // Tool: smart_money_signal
  server.tool(
    "smart_money_signal",
    "Get latest smart money trading signals. Returns recent whale/fund trading activities with severity levels (high/medium/low). Use to monitor what smart money is buying or selling.",
    SignalInputSchema.shape,
    async (input) => {
      const result = await handleSignal(SignalInputSchema.parse(input));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: smart_money_watch
  server.tool(
    "smart_money_watch",
    "Inspect a specific wallet's recent trading activity. Shows recent transactions, buy/sell summary, and tokens traded. Use to deep-dive into a particular smart money wallet.",
    WatchInputSchema.shape,
    async (input) => {
      const result = await handleWatch(WatchInputSchema.parse(input));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: smart_money_add
  server.tool(
    "smart_money_add",
    "Add a wallet address to the smart money watchlist. Provide a label and category for identification.",
    AddWalletInputSchema.shape,
    async (input) => {
      const result = await handleAddWallet(AddWalletInputSchema.parse(input));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: smart_money_remove
  server.tool(
    "smart_money_remove",
    "Remove a wallet address from the smart money watchlist.",
    RemoveWalletInputSchema.shape,
    async (input) => {
      const result = await handleRemoveWallet(RemoveWalletInputSchema.parse(input));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: smart_money_list
  server.tool(
    "smart_money_list",
    "List all wallets in the smart money watchlist with their labels and categories.",
    ListWalletsInputSchema.shape,
    async (input) => {
      const result = await handleListWallets(ListWalletsInputSchema.parse(input));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: smart_money_scan
  server.tool(
    "smart_money_scan",
    "Trigger an immediate scan of watched wallets for new transactions. Scans a specific wallet or all active wallets, processes transactions through the signal engine, and returns results.",
    ScanInputSchema.shape,
    async (input) => {
      const result = await handleScan(ScanInputSchema.parse(input));
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Start ───
  console.error("[smart-money] Starting MCP server on stdio...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[smart-money] Server running.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
