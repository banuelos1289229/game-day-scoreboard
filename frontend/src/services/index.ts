import type { ScoreboardApi } from "./contract";
import { mockApi } from "./mock/mock-api";

/**
 * Single entry point for ALL backend access in the app.
 *
 * To plug in the real backend later: write `httpApi: ScoreboardApi` (one file,
 * fetch calls against /api/*) and swap the assignment below. No screen changes.
 */
export const api: ScoreboardApi = mockApi;

export type { ScoreboardApi } from "./contract";
export * from "./types";
export { DEMO_CREDENTIALS } from "./mock/store";

/** Stable query keys for every read in the services layer. */
export const queryKeys = {
  me: ["me"] as const,
  dashboard: ["dashboard"] as const,
  live: ["matches", "live"] as const,
  upcoming: ["matches", "upcoming"] as const,
  recent: ["matches", "recent"] as const,
  recommended: ["matches", "recommended"] as const,
  match: (id: string) => ["matches", id] as const,
  team: (id: string) => ["teams", id] as const,
  leagues: ["leagues"] as const,
  league: (id: string) => ["leagues", id] as const,
  standings: (id: string) => ["leagues", id, "standings"] as const,
  leagueStats: (id: string) => ["leagues", id, "stats"] as const,
  search: (q: string) => ["search", q] as const,
  favorites: ["favorites"] as const,
};
