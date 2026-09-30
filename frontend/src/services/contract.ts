import type {
  Dashboard,
  Favorites,
  LeagueDetail,
  League,
  Match,
  MatchDetail,
  RecommendedMatch,
  SearchResults,
  Session,
  StandingRow,
  LeagueStats,
  TeamDetail,
  User,
} from "./types";

/**
 * The ONLY backend contract of the app.
 *
 * Every screen talks to this interface — never to fetch/axios/a provider SDK
 * directly. Swapping the mock for a real HTTP client means writing one new
 * implementation of `ScoreboardApi` and changing the export in ./index.ts.
 *
 * Method names map 1:1 to the planned REST endpoints (see docs in plan).
 */
export interface ScoreboardApi {
  auth: {
    /** POST /api/auth/register */
    register(input: { name: string; email: string; password: string }): Promise<Session>;
    /** POST /api/auth/login */
    login(input: { email: string; password: string }): Promise<Session>;
    /** POST /api/auth/logout */
    logout(): Promise<void>;
    /** GET /api/auth/me — null when there is no session. */
    me(): Promise<User | null>;
  };

  /** GET /api/dashboard */
  getDashboard(): Promise<Dashboard>;

  matches: {
    /** GET /api/matches/live */
    live(): Promise<Match[]>;
    /** GET /api/matches/upcoming */
    upcoming(): Promise<Match[]>;
    /** GET /api/matches/recent */
    recent(): Promise<Match[]>;
    /** GET /api/matches/recommended */
    recommended(): Promise<RecommendedMatch[]>;
    /** GET /api/matches/{id} */
    detail(id: string): Promise<MatchDetail>;
  };

  teams: {
    /** GET /api/teams/{id} */
    detail(id: string): Promise<TeamDetail>;
    /** GET /api/teams/{id}/matches */
    matches(id: string): Promise<Match[]>;
  };

  leagues: {
    /** GET /api/leagues */
    list(): Promise<League[]>;
    /** GET /api/leagues/{id} + /matches */
    detail(id: string): Promise<LeagueDetail>;
    /** GET /api/leagues/{id}/standings */
    standings(id: string): Promise<StandingRow[]>;
    /** Aggregated basic stats for a league. */
    stats(id: string): Promise<LeagueStats>;
  };

  /** GET /api/search?q= */
  search(query: string): Promise<SearchResults>;

  favorites: {
    /** GET /api/favorites */
    list(): Promise<Favorites>;
    /** POST/DELETE /api/favorites/teams/{id} */
    toggleTeam(id: string): Promise<Favorites>;
    /** POST/DELETE /api/favorites/leagues/{id} */
    toggleLeague(id: string): Promise<Favorites>;
  };
}
