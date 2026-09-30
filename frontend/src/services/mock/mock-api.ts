import type { ScoreboardApi } from "../contract";
import {
  ApiError,
  type Dashboard,
  type Favorites,
  type League,
  type LeagueStats,
  type Match,
  type MatchDetail,
  type RecommendedMatch,
  type SearchResults,
  type StandingRow,
  type TeamDetail,
  type TeamFormEntry,
} from "../types";
import { getMockStore } from "./fixtures";
import {
  authenticate,
  clearSession,
  createUser,
  currentSession,
  favoritesOf,
  requireSession,
  setFavorites,
  toggle,
} from "./store";

/** Simulated network latency so loading states are real and visible. */
const LATENCY = 220;
const delay = (ms = LATENCY) => new Promise<void>((r) => setTimeout(r, ms));

function isLive(m: Match) {
  return m.status === "live";
}

function sortByKickoff(list: Match[], direction: 1 | -1 = 1) {
  return [...list].sort((a, b) => direction * a.kickoff.localeCompare(b.kickoff));
}

function favoriteState() {
  const session = requireSession();
  return { session, state: favoritesOf(session.user.id) };
}

function resolveFavorites(teams: string[], leagues: string[]): Favorites {
  const store = getMockStore();
  return {
    teams: store.teams.filter((t) => teams.includes(t.id)),
    leagues: store.leagues.filter((l) => leagues.includes(l.id)),
  };
}

function scoreMatch(
  match: Match,
  favTeams: string[],
  favLeagues: string[],
): RecommendedMatch {
  let score = 0;
  const reasons: string[] = [];

  if (favTeams.includes(match.homeTeam.id) || favTeams.includes(match.awayTeam.id)) {
    score += 50;
    reasons.push("Favourite team playing");
  }
  if (favLeagues.includes(match.leagueId)) {
    score += 25;
    reasons.push("Favourite league");
  }
  score += Math.round(match.popularity / 5);
  if (match.popularity >= 80) reasons.push("High-profile fixture");

  const diff = Math.abs((match.homeScore ?? 0) - (match.awayScore ?? 0));
  if (isLive(match) && diff <= 1) {
    score += 15;
    reasons.push("Tight scoreline");
  }
  if (isLive(match) && (match.minute ?? 0) >= 70) {
    score += 10;
    reasons.push("Final stretch");
  }
  return { match, score, reasons };
}

function standingsFor(leagueId: string): StandingRow[] {
  const store = getMockStore();
  const league = store.leagues.find((l) => l.id === leagueId);
  if (!league) throw new ApiError("not-found", "League not found.");

  const rows = new Map<string, StandingRow>();
  for (const team of store.teams.filter((t) => t.leagueId === leagueId)) {
    rows.set(team.id, {
      position: 0,
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        abbreviation: team.abbreviation,
        color: team.color,
      },
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const match of store.matches) {
    if (match.leagueId !== leagueId) continue;
    if (match.status !== "finished") continue;
    if (match.homeScore === null || match.awayScore === null) continue;
    const home = rows.get(match.homeTeam.id);
    const away = rows.get(match.awayTeam.id);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won++;
      away.lost++;
      home.points += 3;
    } else if (match.homeScore < match.awayScore) {
      away.won++;
      home.lost++;
      away.points += 3;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  }

  const list = [...rows.values()].map((row) => ({
    ...row,
    goalDifference: row.goalsFor - row.goalsAgainst,
  }));
  list.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.team.name.localeCompare(b.team.name),
  );
  return list.map((row, index) => ({ ...row, position: index + 1 }));
}

export const mockApi: ScoreboardApi = {
  auth: {
    async register(input) {
      await delay();
      return createUser(input);
    },
    async login(input) {
      await delay();
      return authenticate(input);
    },
    async logout() {
      await delay(80);
      clearSession();
    },
    async me() {
      await delay(80);
      return currentSession()?.user ?? null;
    },
  },

  async getDashboard(): Promise<Dashboard> {
    await delay();
    const { state } = favoriteState();
    const store = getMockStore();
    const favorites = resolveFavorites(state.teams, state.leagues);

    const favoriteMatches = sortByKickoff(
      store.matches.filter(
        (m) =>
          (state.teams.includes(m.homeTeam.id) ||
            state.teams.includes(m.awayTeam.id) ||
            state.leagues.includes(m.leagueId)) &&
          m.status !== "finished",
      ),
    ).slice(0, 6);

    const live = store.matches.filter(isLive);
    const recommended = live
      .map((m) => scoreMatch(m, state.teams, state.leagues))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return { favorites, favoriteMatches, live, recommended };
  },

  matches: {
    async live() {
      await delay();
      return getMockStore().matches.filter(isLive);
    },
    async upcoming() {
      await delay();
      const now = Date.now();
      return sortByKickoff(
        getMockStore().matches.filter(
          (m) => m.status === "scheduled" && Date.parse(m.kickoff) >= now,
        ),
      ).slice(0, 30);
    },
    async recent() {
      await delay();
      return sortByKickoff(
        getMockStore().matches.filter((m) => m.status === "finished"),
        -1,
      ).slice(0, 30);
    },
    async recommended() {
      await delay();
      const session = currentSession();
      const state = session
        ? favoritesOf(session.user.id)
        : { teams: [], leagues: [] };
      return getMockStore()
        .matches.filter(isLive)
        .map((m) => scoreMatch(m, state.teams, state.leagues))
        .sort((a, b) => b.score - a.score);
    },
    async detail(id): Promise<MatchDetail> {
      await delay();
      const store = getMockStore();
      const match = store.matches.find((m) => m.id === id);
      if (!match) throw new ApiError("not-found", "Match not found.");
      return {
        match,
        events: store.events[id] ?? [],
        statistics: store.statistics[id] ?? null,
      };
    },
  },

  teams: {
    async detail(id): Promise<TeamDetail> {
      await delay();
      const store = getMockStore();
      const team = store.teams.find((t) => t.id === id);
      if (!team) throw new ApiError("not-found", "Team not found.");
      const league = store.leagues.find((l) => l.id === team.leagueId)!;

      const played = sortByKickoff(
        store.matches.filter(
          (m) =>
            m.status === "finished" &&
            m.homeScore !== null &&
            (m.homeTeam.id === id || m.awayTeam.id === id),
        ),
        -1,
      ).slice(0, 6);

      const form: TeamFormEntry[] = played.map((m) => {
        const home = m.homeTeam.id === id;
        const scoreFor = (home ? m.homeScore : m.awayScore) ?? 0;
        const scoreAgainst = (home ? m.awayScore : m.homeScore) ?? 0;
        return {
          matchId: m.id,
          result:
            scoreFor > scoreAgainst ? "win" : scoreFor === scoreAgainst ? "draw" : "loss",
          opponent: home ? m.awayTeam : m.homeTeam,
          home,
          scoreFor,
          scoreAgainst,
          kickoff: m.kickoff,
          leagueName: m.leagueName,
        };
      });

      const session = currentSession();
      const isFavorite = session
        ? favoritesOf(session.user.id).teams.includes(id)
        : false;

      const upcoming = sortByKickoff(
        store.matches.filter(
          (m) =>
            (m.status === "scheduled" || m.status === "live") &&
            (m.homeTeam.id === id || m.awayTeam.id === id),
        ),
      ).slice(0, 5);

      return { team, league, isFavorite, form, upcoming };
    },
    async matches(id) {
      await delay();
      return sortByKickoff(
        getMockStore().matches.filter(
          (m) => m.homeTeam.id === id || m.awayTeam.id === id,
        ),
      );
    },
  },

  leagues: {
    async list(): Promise<League[]> {
      await delay(80);
      return getMockStore().leagues;
    },
    async detail(id) {
      await delay();
      const store = getMockStore();
      const league = store.leagues.find((l) => l.id === id);
      if (!league) throw new ApiError("not-found", "League not found.");
      const all = store.matches.filter((m) => m.leagueId === id);
      return {
        league,
        live: all.filter(isLive),
        upcoming: sortByKickoff(all.filter((m) => m.status === "scheduled")).slice(0, 8),
        recent: sortByKickoff(all.filter((m) => m.status === "finished"), -1).slice(0, 8),
      };
    },
    async standings(id) {
      await delay();
      return standingsFor(id);
    },
    async stats(id): Promise<LeagueStats> {
      await delay();
      const rows = standingsFor(id);
      return rows.reduce<LeagueStats>(
        (acc, row) => ({
          goalsFor: acc.goalsFor + row.goalsFor,
          goalsAgainst: acc.goalsAgainst + row.goalsAgainst,
          goalDifference: acc.goalDifference + row.goalDifference,
          played: acc.played + row.played,
          won: acc.won + row.won,
          drawn: acc.drawn + row.drawn,
          lost: acc.lost + row.lost,
        }),
        { goalsFor: 0, goalsAgainst: 0, goalDifference: 0, played: 0, won: 0, drawn: 0, lost: 0 },
      );
    },
  },

  async search(query): Promise<SearchResults> {
    await delay(160);
    const q = query.trim().toLowerCase();
    if (!q) return { teams: [], leagues: [] };
    const store = getMockStore();
    return {
      teams: store.teams.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.shortName.toLowerCase().includes(q) ||
          t.abbreviation.toLowerCase().includes(q),
      ),
      leagues: store.leagues.filter(
        (l) => l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q),
      ),
    };
  },

  favorites: {
    async list() {
      await delay(120);
      const { state } = favoriteState();
      return resolveFavorites(state.teams, state.leagues);
    },
    async toggleTeam(id) {
      await delay(120);
      const { session, state } = favoriteState();
      if (!getMockStore().teams.some((t) => t.id === id))
        throw new ApiError("not-found", "Team not found.");
      const next = { ...state, teams: toggle(state.teams, id) };
      setFavorites(session.user.id, next);
      return resolveFavorites(next.teams, next.leagues);
    },
    async toggleLeague(id) {
      await delay(120);
      const { session, state } = favoriteState();
      if (!getMockStore().leagues.some((l) => l.id === id))
        throw new ApiError("not-found", "League not found.");
      const next = { ...state, leagues: toggle(state.leagues, id) };
      setFavorites(session.user.id, next);
      return resolveFavorites(next.teams, next.leagues);
    },
  },
};
