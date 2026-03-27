/**
 * MCP Tool Schemas (Zod)
 * Defines input/output schemas for all Smart Money Tracker tools
 */
import { z } from "zod";

// ─── smart_money_signal ───
export const SignalInputSchema = z.object({
  level: z
    .enum(["high", "medium", "low", "all"])
    .default("all")
    .describe("Signal level filter. 'all' returns all levels."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Max number of signals to return"),
  since: z
    .string()
    .optional()
    .describe("ISO timestamp — only return signals after this time"),
});

// ─── smart_money_watch ───
export const WatchInputSchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
    .describe("Wallet address to inspect"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe("Number of recent transactions to show"),
});

// ─── smart_money_add ───
export const AddWalletInputSchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
    .describe("Wallet address to add to watchlist"),
  label: z
    .string()
    .min(1)
    .max(100)
    .describe("Human-readable label (e.g. 'Paradigm Fund')"),
  category: z
    .enum(["fund", "whale", "dex_trader", "nft_trader", "other"])
    .default("other")
    .describe("Wallet category"),
});

// ─── smart_money_remove ───
export const RemoveWalletInputSchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
    .describe("Wallet address to remove from watchlist"),
});

// ─── smart_money_list ───
export const ListWalletsInputSchema = z.object({
  includeInactive: z
    .boolean()
    .default(false)
    .describe("Include deactivated wallets"),
});

// ─── smart_money_scan ───
export const ScanInputSchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
    .optional()
    .describe("Scan a specific wallet. Omit to scan all active wallets."),
});

export type SignalInput = z.infer<typeof SignalInputSchema>;
export type WatchInput = z.infer<typeof WatchInputSchema>;
export type AddWalletInput = z.infer<typeof AddWalletInputSchema>;
export type RemoveWalletInput = z.infer<typeof RemoveWalletInputSchema>;
export type ListWalletsInput = z.infer<typeof ListWalletsInputSchema>;
export type ScanInput = z.infer<typeof ScanInputSchema>;
