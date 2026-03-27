/**
 * Signal Engine
 * Analyzes transactions and generates trading signals with severity levels
 * 
 * Signal Levels:
 * - HIGH:   Large buy (>$50K) or first-time token position
 * - MEDIUM: Accumulation (≥2 buys of same token in 24h) or large sell (>$50K)
 * - LOW:    Regular transfers, small amounts
 */
import type { TokenTransfer } from "../moralis/client.js";
import {
  getWalletLabel,
  hasEverHeldToken,
  countRecentTokenTx,
  insertSignal,
  txExists,
  insertTransaction,
  type StoredSignal,
} from "../storage/db.js";

export interface SignalConfig {
  highValueThresholdUsd: number;   // Default: 50000
  accumulationWindowHours: number; // Default: 24
  accumulationMinTxCount: number;  // Default: 2
  lowValueFloorUsd: number;        // Below this, skip entirely. Default: 1000
}

const DEFAULT_CONFIG: SignalConfig = {
  highValueThresholdUsd: 50000,
  accumulationWindowHours: 24,
  accumulationMinTxCount: 2,
  lowValueFloorUsd: 1000,
};

export function processTransfers(
  walletAddress: string,
  transfers: TokenTransfer[],
  config: SignalConfig = DEFAULT_CONFIG
): Omit<StoredSignal, "id" | "createdAt">[] {
  const signals: Omit<StoredSignal, "id" | "createdAt">[] = [];
  const walletLabel = getWalletLabel(walletAddress);
  const walletLower = walletAddress.toLowerCase();

  for (const tx of transfers) {
    // Skip if already processed
    if (txExists(tx.txHash, walletAddress)) continue;

    // Determine direction relative to our watched wallet
    const direction = tx.toAddress.toLowerCase() === walletLower ? "in" : "out";
    const action = direction === "in" ? "buy" : "sell";

    // Store transaction
    insertTransaction({
      txHash: tx.txHash,
      walletAddress: walletLower,
      direction,
      tokenSymbol: tx.tokenSymbol,
      tokenName: tx.tokenName,
      tokenAddress: tx.tokenAddress,
      valueUsd: tx.valueUsd,
      blockNumber: tx.blockNumber,
      blockTimestamp: tx.blockTimestamp,
      createdAt: new Date().toISOString(),
    });

    // Skip dust / low value
    if (tx.valueUsd < config.lowValueFloorUsd) continue;

    // ─── Signal Classification ───

    let level: "high" | "medium" | "low";
    let context: string;

    // Check 1: First-time token position (HIGH)
    const isFirstPosition =
      direction === "in" && !hasEverHeldToken(walletAddress, tx.tokenAddress);

    // Check 2: Large value (HIGH for buy, MEDIUM for sell)
    const isLargeValue = tx.valueUsd >= config.highValueThresholdUsd;

    // Check 3: Accumulation pattern (MEDIUM)
    const recentBuyCount = countRecentTokenTx(
      walletAddress,
      tx.tokenAddress,
      "in",
      config.accumulationWindowHours
    );
    const isAccumulation =
      direction === "in" &&
      recentBuyCount >= config.accumulationMinTxCount;

    if (isFirstPosition && isLargeValue) {
      level = "high";
      context = `首次建仓 ${tx.tokenSymbol}，大额买入 $${formatUsd(tx.valueUsd)}`;
    } else if (isFirstPosition) {
      level = "high";
      context = `首次建仓 ${tx.tokenSymbol}，此前未持有该 token`;
    } else if (isLargeValue && direction === "in") {
      level = "high";
      context = `大额买入 ${tx.tokenSymbol}，金额 $${formatUsd(tx.valueUsd)}`;
    } else if (isLargeValue && direction === "out") {
      level = "medium";
      context = `大额卖出 ${tx.tokenSymbol}，金额 $${formatUsd(tx.valueUsd)}`;
    } else if (isAccumulation) {
      level = "medium";
      context = `持续加仓 ${tx.tokenSymbol}，${config.accumulationWindowHours}h 内第 ${recentBuyCount + 1} 笔买入`;
    } else {
      level = "low";
      context = `${action === "buy" ? "买入" : "卖出"} ${tx.tokenSymbol}，$${formatUsd(tx.valueUsd)}`;
    }

    const signal: Omit<StoredSignal, "id" | "createdAt"> = {
      level,
      walletAddress: walletLower,
      walletLabel,
      action,
      tokenSymbol: tx.tokenSymbol,
      tokenAddress: tx.tokenAddress,
      amountUsd: tx.valueUsd,
      txHash: tx.txHash,
      context,
      blockTimestamp: tx.blockTimestamp,
    };

    insertSignal(signal);
    signals.push(signal);
  }

  return signals;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(2);
}
