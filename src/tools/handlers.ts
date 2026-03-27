/**
 * MCP Tool Handlers
 * Business logic for each tool endpoint
 */
import {
  getRecentSignals,
  getSignalsSince,
  getRecentTransactions,
  getWalletLabel,
  addWallet,
  removeWallet,
  getActiveWallets,
  getAllWallets,
} from "../storage/db.js";
import { scanWallet, scanAllWallets } from "../engine/scanner.js";
import type {
  SignalInput,
  WatchInput,
  AddWalletInput,
  RemoveWalletInput,
  ListWalletsInput,
  ScanInput,
} from "./schemas.js";

// ─── smart_money_signal ───

export async function handleSignal(input: SignalInput) {
  const level = input.level === "all" ? undefined : input.level;

  const signals = input.since
    ? getSignalsSince(input.since)
    : getRecentSignals(level, input.limit);

  // Filter by level if "since" was used
  const filtered =
    input.since && level
      ? signals.filter((s) => s.level === level)
      : signals;

  const highCount = filtered.filter((s) => s.level === "high").length;
  const mediumCount = filtered.filter((s) => s.level === "medium").length;
  const lowCount = filtered.filter((s) => s.level === "low").length;

  return {
    signals: filtered.slice(0, input.limit).map((s) => ({
      level: s.level,
      wallet: s.walletAddress,
      label: s.walletLabel,
      action: s.action,
      token: s.tokenSymbol,
      amount_usd: s.amountUsd,
      tx_hash: s.txHash,
      timestamp: s.blockTimestamp,
      context: s.context,
    })),
    summary: `${filtered.length} signals: ${highCount} high, ${mediumCount} medium, ${lowCount} low`,
    last_updated: new Date().toISOString(),
  };
}

// ─── smart_money_watch ───

export async function handleWatch(input: WatchInput) {
  const label = getWalletLabel(input.address);
  const transactions = getRecentTransactions(input.address, input.limit);

  // Compute summary stats
  const buys = transactions.filter((t) => t.direction === "in");
  const sells = transactions.filter((t) => t.direction === "out");
  const totalBuyUsd = buys.reduce((sum, t) => sum + t.valueUsd, 0);
  const totalSellUsd = sells.reduce((sum, t) => sum + t.valueUsd, 0);

  // Unique tokens traded
  const uniqueTokens = [...new Set(transactions.map((t) => t.tokenSymbol))];

  return {
    wallet: input.address,
    label,
    recent_transactions: transactions.map((t) => ({
      direction: t.direction,
      token: t.tokenSymbol,
      amount_usd: t.valueUsd,
      tx_hash: t.txHash,
      timestamp: t.blockTimestamp,
    })),
    summary: {
      total_buys: buys.length,
      total_sells: sells.length,
      buy_volume_usd: totalBuyUsd,
      sell_volume_usd: totalSellUsd,
      tokens_traded: uniqueTokens,
    },
  };
}

// ─── smart_money_add ───

export async function handleAddWallet(input: AddWalletInput) {
  addWallet({
    address: input.address,
    label: input.label,
    category: input.category,
    addedAt: new Date().toISOString(),
    active: true,
  });

  return {
    success: true,
    message: `Added ${input.label} (${input.address}) to watchlist`,
    category: input.category,
  };
}

// ─── smart_money_remove ───

export async function handleRemoveWallet(input: RemoveWalletInput) {
  removeWallet(input.address);

  return {
    success: true,
    message: `Removed ${input.address} from watchlist`,
  };
}

// ─── smart_money_list ───

export async function handleListWallets(input: ListWalletsInput) {
  const wallets = input.includeInactive
    ? getAllWallets()
    : getActiveWallets();

  const byCategory = wallets.reduce(
    (acc, w) => {
      acc[w.category] = (acc[w.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    wallets: wallets.map((w) => ({
      address: w.address,
      label: w.label,
      category: w.category,
      active: w.active,
      added_at: w.addedAt,
    })),
    total: wallets.length,
    by_category: byCategory,
  };
}

// ─── smart_money_scan ───

export async function handleScan(input: ScanInput) {
  if (input.address) {
    const result = await scanWallet(input.address);
    return {
      scanned: 1,
      results: [result],
      summary: `Scanned 1 wallet: ${result.transfersFound} transfers, ${result.newSignals} new signals`,
    };
  }

  const results = await scanAllWallets();
  const totalTransfers = results.reduce((s, r) => s + r.transfersFound, 0);
  const totalSignals = results.reduce((s, r) => s + r.newSignals, 0);
  const errors = results.flatMap((r) => r.errors);

  return {
    scanned: results.length,
    results,
    summary: `Scanned ${results.length} wallets: ${totalTransfers} transfers, ${totalSignals} new signals${errors.length ? `, ${errors.length} errors` : ""}`,
  };
}
