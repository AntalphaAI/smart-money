/**
 * Data Loader
 * Loads seed watchlist and labels into the database on startup
 */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { addWallet, getActiveWallets } from "../storage/db.js";

interface WatchlistSeed {
  address: string;
  label: string;
  category: string;
  source: string;
}

export async function loadWatchlist(dataDir: string): Promise<number> {
  const watchlistPath = path.join(dataDir, "watchlist.json");

  if (!existsSync(watchlistPath)) {
    console.error("[loader] No watchlist.json found, starting empty");
    return 0;
  }

  // Only seed if DB is empty
  const existing = getActiveWallets();
  if (existing.length > 0) {
    console.error(`[loader] Watchlist already has ${existing.length} wallets, skipping seed`);
    return existing.length;
  }

  const raw = readFileSync(watchlistPath, "utf-8");
  const seeds: WatchlistSeed[] = JSON.parse(raw);

  let loaded = 0;
  for (const seed of seeds) {
    addWallet({
      address: seed.address.toLowerCase(),
      label: seed.label,
      category: seed.category as any,
      addedAt: new Date().toISOString(),
      active: true,
    });
    loaded++;
  }

  console.error(`[loader] Loaded ${loaded} wallets from watchlist.json`);
  return loaded;
}
