import { idbGetAll, idbPut, idbDelete, idbClear } from "../db/vault-idb";
import { Platform, ScoreLevel } from "../types";

export interface VaultEntry {
  id: string;
  platformId: Platform["id"];
  password: string;
  savedAt: number; // Date.now()
  bits: number;
  level: ScoreLevel;
  breached?: boolean; // future: set via HIBP k-anonymity check
}

export type FilterKey = "all" | "strong" | "needs-attention";

const MAX_ENTRIES = 50;
const MAX_KB = 50;

class VaultStore extends EventTarget {
  entries: VaultEntry[] = [];
  private _ready = false;

  async init(): Promise<void> {
    if (this._ready) {
      // Already loaded — just notify so late subscribers get the current state
      this.dispatchEvent(new CustomEvent("vault:change"));
      return;
    }
    this._ready = true;
    const raw = await idbGetAll();
    this.entries = raw.sort((a, b) => b.savedAt - a.savedAt);
    this.dispatchEvent(new CustomEvent("vault:change"));
  }

  async add(entry: Omit<VaultEntry, "id">): Promise<void> {
    const next: VaultEntry = { ...entry, id: crypto.randomUUID() };
    this.entries = [next, ...this.entries].slice(0, MAX_ENTRIES);
    await idbPut(next);
    this.dispatchEvent(new CustomEvent("vault:change"));
  }

  async remove(id: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.id !== id);
    await idbDelete(id);
    this.dispatchEvent(new CustomEvent("vault:change"));
  }

  async clearAll(): Promise<void> {
    this.entries = [];
    await idbClear();
    this.dispatchEvent(new CustomEvent("vault:change"));
  }

  has(platformId: string, password: string): boolean {
    return this.entries.some((e) => e.platformId === platformId && e.password === password);
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  filtered(filter: FilterKey): VaultEntry[] {
    if (filter === "strong") return this.entries.filter((e) => e.bits >= 80);
    if (filter === "needs-attention") return this.entries.filter((e) => e.bits < 80);
    return this.entries;
  }

  counts(): { all: number; strong: number; needsAttention: number } {
    return {
      all: this.entries.length,
      strong: this.entries.filter((e) => e.bits >= 80).length,
      needsAttention: this.entries.filter((e) => e.bits < 80).length,
    };
  }

  storageMetrics(): { usedKB: number; maxKB: number; pct: number; remaining: number } {
    const bytes = new TextEncoder().encode(JSON.stringify(this.entries)).length;
    const usedKB = bytes / 1024;
    const pct = Math.min((usedKB / MAX_KB) * 100, 100);
    const avgBytes = this.entries.length > 0 ? bytes / this.entries.length : 200;
    const remaining = Math.max(0, Math.floor((MAX_KB * 1024 - bytes) / avgBytes));
    return {
      usedKB: Math.round(usedKB * 10) / 10,
      maxKB: MAX_KB,
      pct,
      remaining,
    };
  }

  exportBackup(): void {
    const headers = ["Platform", "Password", "Bits", "Saved at", "Breached"];
    const rows = this.entries.map((e) => [
      e.platformId.toLocaleUpperCase(),
      e.password,
      e.bits,
      new Date(e.savedAt).toISOString(),
      e.breached ?? false,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `pass-vault-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const vault = new VaultStore();
