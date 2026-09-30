/**
 * Domain types for the scoreboard app.
 *
 * These are intentionally provider-agnostic: no external sports API shape
 * leaks into the app. A real backend adapter must normalize into these.
 */

export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

export type MatchResult = "win" | "draw" | "loss";

export interface League {
  id: string;
  name: string;
  country: string;
  /** Brand colour used for crests/accents (data, not styling policy). */
  color: string;
  popularity: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  color: string;
  leagueId: string;
  leagueName: string;
  popularity: number;
}

export interface MatchTeam {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  color: string;
}

export interface Match {
  id: string;
  leagueId: string;
  leagueName: string;
  kickoff: string;
  status: MatchStatus;
  /** Minute of play for live matches, null otherwise. */
  minute: number | null;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  homeScore: number | null;
  awayScore: number | null;
  popularity: number;
}

export type MatchEventType = "goal" | "own-goal" | "yellow" | "red" | "sub";

export interface MatchEvent {
  id: string;
  minute: number;
  type: MatchEventType;
  teamId: string;
  player: string;
  detail: string | null;
}

/** null means "not available from the provider" — never fabricate it. */
export interface StatPair {
  home: number | null;
  away: number | null;
}

export interface MatchStatistics {
  possession: StatPair;
  shots: StatPair;
  shotsOnTarget: StatPair;
  corners: StatPair;
  fouls: StatPair;
  cards: StatPair;
}

export interface MatchDetail {
  match: Match;
  events: MatchEvent[];
  statistics: MatchStatistics | null;
}

export interface StandingRow {
  position: number;
  team: MatchTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface LeagueStats {
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
}

export interface LeagueDetail {
  league: League;
  live: Match[];
  upcoming: Match[];
  recent: Match[];
}

export interface TeamFormEntry {
  matchId: string;
  result: MatchResult;
  opponent: MatchTeam;
  home: boolean;
  scoreFor: number;
  scoreAgainst: number;
  kickoff: string;
  leagueName: string;
}

export interface TeamDetail {
  team: Team;
  league: League;
  isFavorite: boolean;
  form: TeamFormEntry[];
  upcoming: Match[];
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Session {
  token: string;
  user: User;
}

export interface Favorites {
  teams: Team[];
  leagues: League[];
}

export interface RecommendedMatch {
  match: Match;
  score: number;
  reasons: string[];
}

export interface Dashboard {
  favorites: Favorites;
  favoriteMatches: Match[];
  live: Match[];
  recommended: RecommendedMatch[];
}

export interface SearchResults {
  teams: Team[];
  leagues: League[];
}

export type ApiErrorKind =
  | "unauthorized"
  | "not-found"
  | "validation"
  | "provider-unavailable"
  | "backend";

export class ApiError extends Error {
  constructor(
    public kind: ApiErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
