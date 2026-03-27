/**
 * SQLite Storage Layer
 * Handles persistence of transactions, signals, and watchlist
 */
import Database from "better-sqlite3";
import path from "path";

export interface WatchlistEntry {
  address: string;
  label: string;
  category: string; // fund, whale, dex_trader, nft_trader, other
  addedAt: string;
  active: boolean;
}

export interface StoredTransaction {
  txHash: string;
  walletAddress: string;
  direction: "in" | "out";
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
  valueUsd: number;
  blockNumber: number;
  blockTimestamp: string;
  createdAt: string;
}

export interface StoredSignal {
  id: number;
  level: "high" | "medium" | "low";
  walletAddress: string;
  walletLabel: string;
  action: string;
  tokenSymbol: string;
  tokenAddress: string;
  amountUsd: number;
  txHash: string;
  context: string;
  blockTimestamp: string;
  createdAt: string;
}

let db: Database.Database;

export function initDb(dataDir: string): void {
  const dbPath = path.join(dataDir, "smart-money.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      address TEXT PRIMARY KEY,
      label TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'other',
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS transactions (
      tx_hash TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('in', 'out')),
      token_symbol TEXT NOT NULL,
      token_name TEXT NOT NULL,
      token_address TEXT NOT NULL,
      value_usd REAL NOT NULL DEFAULT 0,
      block_number INTEGER NOT NULL,
      block_timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (tx_hash, wallet_address)
    );

    CREATE TABLE IF NOT EXISTS signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL CHECK(level IN ('high', 'medium', 'low')),
      wallet_address TEXT NOT NULL,
      wallet_label TEXT NOT NULL DEFAULT '',
      action TEXT NOT NULL,
      token_symbol TEXT NOT NULL,
      token_address TEXT NOT NULL,
      amount_usd REAL NOT NULL DEFAULT 0,
      tx_hash TEXT NOT NULL,
      context TEXT NOT NULL DEFAULT '',
      block_timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tx_wallet ON transactions(wallet_address);
    CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON transactions(block_timestamp);
    CREATE INDEX IF NOT EXISTS idx_signals_level ON signals(level);
    CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON signals(created_at);
  `);
}

// ─── Watchlist ───

export function addWallet(entry: WatchlistEntry): void {
  db.prepare(`
    INSERT OR REPLACE INTO watchlist (address, label, category, added_at, active)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    entry.address.toLowerCase(),
    entry.label,
    entry.category,
    entry.addedAt,
    entry.active ? 1 : 0
  );
}

export function removeWallet(address: string): void {
  db.prepare("UPDATE watchlist SET active = 0 WHERE address = ?").run(
    address.toLowerCase()
  );
}

export function getActiveWallets(): WatchlistEntry[] {
  return db
    .prepare("SELECT * FROM watchlist WHERE active = 1")
    .all()
    .map(rowToWatchlistEntry);
}

export function getWalletLabel(address: string): string {
  const row = db
    .prepare("SELECT label FROM watchlist WHERE address = ?")
    .get(address.toLowerCase()) as { label: string } | undefined;
  return row?.label ?? shortenAddress(address);
}

export function getAllWallets(): WatchlistEntry[] {
  return db.prepare("SELECT * FROM watchlist").all().map(rowToWatchlistEntry);
}

// ─── Transactions ───

export function txExists(txHash: string, walletAddress: string): boolean {
  const row = db
    .prepare(
      "SELECT 1 FROM transactions WHERE tx_hash = ? AND wallet_address = ?"
    )
    .get(txHash, walletAddress.toLowerCase());
  return !!row;
}

export function insertTransaction(tx: StoredTransaction): void {
  db.prepare(`
    INSERT OR IGNORE INTO transactions 
    (tx_hash, wallet_address, direction, token_symbol, token_name, token_address, value_usd, block_number, block_timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tx.txHash,
    tx.walletAddress.toLowerCase(),
    tx.direction,
    tx.tokenSymbol,
    tx.tokenName,
    tx.tokenAddress,
    tx.valueUsd,
    tx.blockNumber,
    tx.blockTimestamp
  );
}

export function getRecentTransactions(
  walletAddress: string,
  limit: number = 20
): StoredTransaction[] {
  return db
    .prepare(
      `SELECT * FROM transactions WHERE wallet_address = ? 
       ORDER BY block_timestamp DESC LIMIT ?`
    )
    .all(walletAddress.toLowerCase(), limit)
    .map(rowToTransaction);
}

/**
 * Count transactions for a wallet+token within a time window
 * Used for detecting accumulation patterns
 */
export function countRecentTokenTx(
  walletAddress: string,
  tokenAddress: string,
  direction: "in" | "out",
  hoursBack: number = 24
): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) as cnt FROM transactions 
       WHERE wallet_address = ? AND token_address = ? AND direction = ?
       AND block_timestamp > datetime('now', ? || ' hours')`
    )
    .get(
      walletAddress.toLowerCase(),
      tokenAddress.toLowerCase(),
      direction,
      `-${hoursBack}`
    ) as { cnt: number };
  return row.cnt;
}

/**
 * Check if wallet has ever held a token before
 */
export function hasEverHeldToken(
  walletAddress: string,
  tokenAddress: string
): boolean {
  const row = db
    .prepare(
      `SELECT 1 FROM transactions 
       WHERE wallet_address = ? AND token_address = ? AND direction = 'in'
       LIMIT 1`
    )
    .get(walletAddress.toLowerCase(), tokenAddress.toLowerCase());
  return !!row;
}

// ─── Signals ───

export function insertSignal(signal: Omit<StoredSignal, "id" | "createdAt">): number {
  const result = db.prepare(`
    INSERT INTO signals 
    (level, wallet_address, wallet_label, action, token_symbol, token_address, amount_usd, tx_hash, context, block_timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    signal.level,
    signal.walletAddress.toLowerCase(),
    signal.walletLabel,
    signal.action,
    signal.tokenSymbol,
    signal.tokenAddress,
    signal.amountUsd,
    signal.txHash,
    signal.context,
    signal.blockTimestamp
  );
  return Number(result.lastInsertRowid);
}

export function getRecentSignals(
  level?: "high" | "medium" | "low",
  limit: number = 20
): StoredSignal[] {
  if (level) {
    return db
      .prepare(
        "SELECT * FROM signals WHERE level = ? ORDER BY created_at DESC LIMIT ?"
      )
      .all(level, limit)
      .map(rowToSignal);
  }
  return db
    .prepare("SELECT * FROM signals ORDER BY created_at DESC LIMIT ?")
    .all(limit)
    .map(rowToSignal);
}

export function getSignalsSince(since: string): StoredSignal[] {
  return db
    .prepare(
      "SELECT * FROM signals WHERE created_at > ? ORDER BY created_at DESC"
    )
    .all(since)
    .map(rowToSignal);
}

// ─── Helpers ───

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function rowToWatchlistEntry(row: any): WatchlistEntry {
  return {
    address: row.address,
    label: row.label,
    category: row.category,
    addedAt: row.added_at,
    active: row.active === 1,
  };
}

function rowToTransaction(row: any): StoredTransaction {
  return {
    txHash: row.tx_hash,
    walletAddress: row.wallet_address,
    direction: row.direction,
    tokenSymbol: row.token_symbol,
    tokenName: row.token_name,
    tokenAddress: row.token_address,
    valueUsd: row.value_usd,
    blockNumber: row.block_number,
    blockTimestamp: row.block_timestamp,
    createdAt: row.created_at,
  };
}

function rowToSignal(row: any): StoredSignal {
  return {
    id: row.id,
    level: row.level,
    walletAddress: row.wallet_address,
    walletLabel: row.wallet_label,
    action: row.action,
    tokenSymbol: row.token_symbol,
    tokenAddress: row.token_address,
    amountUsd: row.amount_usd,
    txHash: row.tx_hash,
    context: row.context,
    blockTimestamp: row.block_timestamp,
    createdAt: row.created_at,
  };
}

export function closeDb(): void {
  if (db) db.close();
}
