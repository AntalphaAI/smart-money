/**
 * Wallet Scanner
 * Periodically scans watched wallets for new transactions
 * and feeds them through the signal engine
 */
import {
  getTokenTransfers,
  getNativeTransfers,
  enrichTransfersWithPrices,
  type TokenTransfer,
} from "../moralis/client.js";
import { getActiveWallets } from "../storage/db.js";
import { processTransfers, type SignalConfig } from "./signal-engine.js";

export interface ScanResult {
  walletAddress: string;
  walletLabel: string;
  transfersFound: number;
  newSignals: number;
  errors: string[];
}

/**
 * Scan a single wallet for new transactions
 */
export async function scanWallet(
  address: string,
  chain: string = "0x1"
): Promise<ScanResult> {
  const errors: string[] = [];
  let allTransfers: TokenTransfer[] = [];

  try {
    const [tokenTx, nativeTx] = await Promise.all([
      getTokenTransfers(address, chain, 20).catch((e: Error) => {
        errors.push(`Token transfers: ${e.message}`);
        return [] as TokenTransfer[];
      }),
      getNativeTransfers(address, chain, 20).catch((e: Error) => {
        errors.push(`Native transfers: ${e.message}`);
        return [] as TokenTransfer[];
      }),
    ]);

    allTransfers = [...tokenTx, ...nativeTx];

    // Enrich with prices
    if (allTransfers.length > 0) {
      allTransfers = await enrichTransfersWithPrices(allTransfers, chain);
    }
  } catch (e: any) {
    errors.push(`Scan failed: ${e.message}`);
  }

  // Process through signal engine
  const signals = allTransfers.length > 0
    ? processTransfers(address, allTransfers)
    : [];

  return {
    walletAddress: address,
    walletLabel: "", // Filled by caller
    transfersFound: allTransfers.length,
    newSignals: signals.length,
    errors,
  };
}

/**
 * Scan all active wallets
 * Respects rate limits by adding delays between wallets
 */
export async function scanAllWallets(
  chain: string = "0x1",
  delayMs: number = 2000
): Promise<ScanResult[]> {
  const wallets = getActiveWallets();
  const results: ScanResult[] = [];

  for (const wallet of wallets) {
    const result = await scanWallet(wallet.address, chain);
    result.walletLabel = wallet.label;
    results.push(result);

    // Rate limit protection
    if (wallets.indexOf(wallet) < wallets.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
}
