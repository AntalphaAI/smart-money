/**
 * Moralis API Client
 * Handles all interactions with Moralis Web3 API
 */
import Moralis from "moralis";

export interface TokenTransfer {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
  value: string;
  valueUsd: number;
  blockNumber: number;
  blockTimestamp: string;
}

export interface WalletBalance {
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
  balance: string;
  balanceUsd: number;
  decimals: number;
}

let initialized = false;

export async function initMoralis(apiKey: string): Promise<void> {
  if (initialized) return;
  await Moralis.start({ apiKey });
  initialized = true;
}

/**
 * Get ERC20 token transfers for a wallet
 */
export async function getTokenTransfers(
  address: string,
  chain: string = "0x1",
  limit: number = 50
): Promise<TokenTransfer[]> {
  const response = await Moralis.EvmApi.token.getWalletTokenTransfers({
    address,
    chain: chain as any,
    limit,
    order: "DESC",
  });

  return response.result.map((tx) => {
    const json = tx.toJSON();
    return {
      txHash: json.transactionHash,
      fromAddress: json.fromAddress.toLowerCase(),
      toAddress: json.toAddress.toLowerCase(),
      tokenSymbol: (json as any).tokenSymbol ?? (json as any).tokenName ?? "UNKNOWN",
      tokenName: (json as any).tokenName ?? "Unknown Token",
      tokenAddress: json.address.toLowerCase(),
      value: json.value,
      valueUsd: 0,
      blockNumber: Number(json.blockNumber),
      blockTimestamp: json.blockTimestamp instanceof Date
        ? json.blockTimestamp.toISOString()
        : String(json.blockTimestamp),
    };
  });
}

/**
 * Get native ETH transfers for a wallet
 */
export async function getNativeTransfers(
  address: string,
  chain: string = "0x1",
  limit: number = 50
): Promise<TokenTransfer[]> {
  const response = await Moralis.EvmApi.transaction.getWalletTransactions({
    address,
    chain: chain as any,
    limit,
    order: "DESC",
  });

  return response.result
    .filter((tx) => {
      const json = tx.toJSON();
      return json.value && BigInt(json.value) > 0n;
    })
    .map((tx) => {
      const json = tx.toJSON();
      return {
        txHash: json.hash,
        fromAddress: json.from.toLowerCase(),
        toAddress: (json.to ?? "").toLowerCase(),
        tokenSymbol: "ETH",
        tokenName: "Ethereum",
        tokenAddress: "0x0000000000000000000000000000000000000000",
        value: json.value ?? "0",
        valueUsd: 0,
        blockNumber: Number(json.blockNumber),
        blockTimestamp: typeof json.blockTimestamp === "object" && json.blockTimestamp !== null
          ? (json.blockTimestamp as Date).toISOString()
          : String(json.blockTimestamp),
      };
    });
}

/**
 * Get ERC20 token balances for a wallet
 */
export async function getTokenBalances(
  address: string,
  chain: string = "0x1"
): Promise<WalletBalance[]> {
  const response = await Moralis.EvmApi.token.getWalletTokenBalances({
    address,
    chain: chain as any,
  });

  return response.result.map((token) => {
    const json = token.toJSON();
    return {
      tokenSymbol: json.token?.symbol ?? "UNKNOWN",
      tokenName: json.token?.name ?? "Unknown",
      tokenAddress: (json.token?.contractAddress ?? "").toLowerCase(),
      balance: json.value ?? "0",
      balanceUsd: 0,
      decimals: json.token?.decimals ?? 18,
    };
  });
}

/**
 * Get token price and decimals
 */
export async function getTokenPriceAndDecimals(
  tokenAddress: string,
  chain: string = "0x1"
): Promise<{ price: number; decimals: number }> {
  try {
    const response = await Moralis.EvmApi.token.getTokenPrice({
      address: tokenAddress,
      chain: chain as any,
    });
    const json = response.toJSON() as any;
    return {
      price: json.usdPrice ?? 0,
      decimals: json.tokenDecimals ?? 18,
    };
  } catch {
    return { price: 0, decimals: 18 };
  }
}

export async function getTokenPrice(
  tokenAddress: string,
  chain: string = "0x1"
): Promise<number> {
  const { price } = await getTokenPriceAndDecimals(tokenAddress, chain);
  return price;
}

/**
 * Batch enrich transfers with USD values
 * Now correctly handles per-token decimals (e.g. USDC=6, WBTC=8, ETH=18)
 */
export async function enrichTransfersWithPrices(
  transfers: TokenTransfer[],
  chain: string = "0x1"
): Promise<TokenTransfer[]> {
  const uniqueTokens = [...new Set(transfers.map((t) => t.tokenAddress))];
  const metaCache = new Map<string, { price: number; decimals: number }>();

  for (const tokenAddr of uniqueTokens) {
    if (tokenAddr === "0x0000000000000000000000000000000000000000") {
      // ETH price via WETH
      const wethAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
      const meta = await getTokenPriceAndDecimals(wethAddr, chain);
      metaCache.set(tokenAddr, { price: meta.price, decimals: 18 });
    } else {
      metaCache.set(tokenAddr, await getTokenPriceAndDecimals(tokenAddr, chain));
    }
    // Rate limit protection for free plan
    await new Promise((r) => setTimeout(r, 250));
  }

  return transfers.map((tx) => {
    const meta = metaCache.get(tx.tokenAddress) ?? { price: 0, decimals: 18 };
    let valueNum: number;
    try {
      valueNum = Number(BigInt(tx.value)) / Math.pow(10, meta.decimals);
    } catch {
      valueNum = 0;
    }
    return {
      ...tx,
      valueUsd: valueNum * meta.price,
    };
  });
}
