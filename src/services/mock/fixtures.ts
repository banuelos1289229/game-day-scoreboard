import type {
  League,
  Match,
  MatchEvent,
  MatchStatistics,
  MatchTeam,
  Team,
} from "../types";

/** Deterministic PRNG — no Math.random, no module-scope side effects. */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const LEAGUE_SEED: Array<Omit<League, "id"> & { id: string; teams: Array<[string, string, string, string]> }> = [
  {
    id: "pl",
    name: "Premier League",
    country: "England",
    color: "#38d39f",
    popularity: 98,
    teams: [
      ["pl-ars", "Arsenal", "Arsenal", "ARS"],
      ["pl-mci", "Manchester City", "Man City", "MCI"],
      ["pl-liv", "Liverpool", "Liverpool", "LIV"],
      ["pl-che", "Chelsea", "Chelsea", "CHE"],
      ["pl-tot", "Tottenham Hotspur", "Tottenham", "TOT"],
      ["pl-new", "Newcastle United", "Newcastle", "NEW"],
    ],
  },
  {
    id: "ll",
    name: "La Liga",
    country: "Spain",
    color: "#f2b33d",
    popularity: 94,
    teams: [
      ["ll-rma", "Real Madrid", "Real Madrid", "RMA"],
      ["ll-fcb", "FC Barcelona", "Barcelona", "BAR"],
      ["ll-atm", "Atlético de Madrid", "Atlético", "ATM"],
      ["ll-sev", "Sevilla FC", "Sevilla", "SEV"],
      ["ll-ath", "Athletic Club", "Athletic", "ATH"],
      ["ll-rso", "Real Sociedad", "R. Sociedad", "RSO"],
    ],
  },
  {
    id: "sa",
    name: "Serie A",
    country: "Italy",
    color: "#5b8dee",
    popularity: 88,
    teams: [
      ["sa-int", "Inter", "Inter", "INT"],
      ["sa-mil", "AC Milan", "Milan", "MIL"],
      ["sa-juv", "Juventus", "Juventus", "JUV"],
      ["sa-nap", "Napoli", "Napoli", "NAP"],
      ["sa-rom", "AS Roma", "Roma", "ROM"],
      ["sa-ata", "Atalanta", "Atalanta", "ATA"],
    ],
  },
];

const TEAM_COLORS: Record<string, string> = {
  "pl-ars": "#ef4444",
  "pl-mci": "#38bdf8",
  "pl-liv": "#dc2626",
  "pl-che": "#3b82f6",
  "pl-tot": "#e2e8f0",
  "pl-new": "#a3a3a3",
  "ll-rma": "#f8fafc",
  "ll-fcb": "#a21caf",
  "ll-atm": "#e11d48",
  "ll-sev": "#f43f5e",
  "ll-ath": "#ea580c",
  "ll-rso": "#2563eb",
  "sa-int": "#2563eb",
  "sa-mil": "#dc2626",
  "sa-juv": "#e5e7eb",
  "sa-nap": "#0ea5e9",
  "sa-rom": "#b91c1c",
  "sa-ata": "#60a5fa",
};

const FIRST_NAMES = ["Marco", "Luis", "Tom", "Ivan", "Diego", "Noah", "Elias", "Aron", "Sami", "Rui"];
const LAST_NAMES = ["Silva", "Moreno", "Keller", "Okafor", "Rossi", "Duarte", "Novak", "Haugen", "Bakker", "Costa"];

function playerName(rand: () => number) {
  return `${FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]} ${
    LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]
  }`;
}

/** Circle-method round robin: returns rounds of disjoint [home, away] pairs. */
function roundRobin(ids: string[]): Array<Array<[string, string]>> {
  const n = ids.length;
  const list = [...ids];
  const rounds: Array<Array<[string, string]>> = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i] as string;
      const b = list[n - 1 - i] as string;
      pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    list.splice(1, 0, list.pop() as string);
  }
  return rounds;
}

export interface MockStore {
  leagues: League[];
  teams: Team[];
  matches: Match[];
  events: Record<string, MatchEvent[]>;
  statistics: Record<string, MatchStatistics | null>;
}

function toMatchTeam(team: Team): MatchTeam {
  return {
    id: team.id,
    name: team.name,
    shortName: team.shortName,
    abbreviation: team.abbreviation,
    color: team.color,
  };
}

function buildEvents(
  match: Match,
  rand: () => number,
): MatchEvent[] {
  const events: MatchEvent[] = [];
  const cap = match.status === "live" ? (match.minute ?? 45) : 90;
  const push = (
    type: MatchEvent["type"],
    teamId: string,
    minute: number,
    detail: string | null,
  ) => {
    events.push({
      id: `${match.id}-e${events.length}`,
      minute: Math.max(1, Math.min(cap, minute)),
      type,
      teamId,
      player: playerName(rand),
      detail,
    });
  };

  for (let i = 0; i < (match.homeScore ?? 0); i++) {
    push("goal", match.homeTeam.id, Math.floor(rand() * cap) + 1, null);
  }
  for (let i = 0; i < (match.awayScore ?? 0); i++) {
    push("goal", match.awayTeam.id, Math.floor(rand() * cap) + 1, null);
  }
  const cards = Math.floor(rand() * 4);
  for (let i = 0; i < cards; i++) {
    const teamId = rand() > 0.5 ? match.homeTeam.id : match.awayTeam.id;
    push(rand() > 0.85 ? "red" : "yellow", teamId, Math.floor(rand() * cap) + 1, "Foul");
  }
  const subs = match.status === "finished" ? 3 : 1;
  for (let i = 0; i < subs; i++) {
    const teamId = rand() > 0.5 ? match.homeTeam.id : match.awayTeam.id;
    push("sub", teamId, 55 + Math.floor(rand() * 30), `on for ${playerName(rand)}`);
  }
  return events.sort((a, b) => a.minute - b.minute);
}

function buildStats(rand: () => number, incomplete: boolean): MatchStatistics {
  const possession = 35 + Math.floor(rand() * 30);
  const pair = (min: number, max: number) => ({
    home: min + Math.floor(rand() * (max - min)),
    away: min + Math.floor(rand() * (max - min)),
  });
  const stats: MatchStatistics = {
    possession: { home: possession, away: 100 - possession },
    shots: pair(4, 22),
    shotsOnTarget: pair(1, 9),
    corners: pair(1, 11),
    fouls: pair(5, 18),
    cards: pair(0, 5),
  };
  if (incomplete) {
    // Providers do not always expose everything. Never invent it.
    stats.corners = { home: null, away: null };
    stats.fouls = { home: null, away: null };
  }
  return stats;
}

let cached: MockStore | null = null;

/** Lazily built so nothing runs at module scope (Worker-safe). */
export function getMockStore(): MockStore {
  if (cached) return cached;

  const rand = lcg(20260929);
  const now = Date.now();
  const DAY = 86_400_000;

  const leagues: League[] = LEAGUE_SEED.map(({ teams: _teams, ...league }) => league);
  const teams: Team[] = [];
  const matches: Match[] = [];
  const events: Record<string, MatchEvent[]> = {};
  const statistics: Record<string, MatchStatistics | null> = {};

  for (const seed of LEAGUE_SEED) {
    for (const [id, name, shortName, abbreviation] of seed.teams) {
      teams.push({
        id,
        name,
        shortName,
        abbreviation,
        color: TEAM_COLORS[id] ?? seed.color,
        leagueId: seed.id,
        leagueName: seed.name,
        popularity: 50 + Math.floor(rand() * 50),
      });
    }
  }

  const byId = new Map(teams.map((t) => [t.id, t]));

  for (const [leagueIndex, seed] of LEAGUE_SEED.entries()) {
    const ids = seed.teams.map(([id]) => id);
    const firstLeg = roundRobin(ids);
    const secondLeg = firstLeg.map((round) =>
      round.map(([h, a]): [string, string] => [a, h]),
    );
    const rounds = [...firstLeg, ...secondLeg]; // 10 rounds

    rounds.forEach((round, roundIndex) => {
      // rounds 0-5 finished, round 6 today (live), rounds 7-9 upcoming
      round.forEach((pair, pairIndex) => {
        const home = byId.get(pair[0])!;
        const away = byId.get(pair[1])!;
        const id = `${seed.id}-r${roundIndex}-${pairIndex}`;

        let status: Match["status"] = "scheduled";
        let minute: number | null = null;
        let homeScore: number | null = null;
        let awayScore: number | null = null;
        let kickoff: number;

        if (roundIndex <= 5) {
          status = "finished";
          kickoff = now - (6 - roundIndex) * 7 * DAY + pairIndex * 2 * 3_600_000;
          homeScore = Math.floor(rand() * 4);
          awayScore = Math.floor(rand() * 4);
          if (rand() > 0.96) {
            status = "postponed";
            homeScore = null;
            awayScore = null;
          }
        } else if (roundIndex === 6) {
          const isLive = pairIndex < 2;
          kickoff = isLive ? now - 40 * 60_000 : now + (4 + pairIndex) * 3_600_000;
          if (isLive) {
            status = "live";
            minute = 24 + Math.floor(rand() * 60) + leagueIndex * 3;
            homeScore = Math.floor(rand() * 3);
            awayScore = Math.floor(rand() * 3);
          }
        } else {
          kickoff = now + (roundIndex - 6) * 7 * DAY + pairIndex * 3 * 3_600_000;
        }

        const match: Match = {
          id,
          leagueId: seed.id,
          leagueName: seed.name,
          kickoff: new Date(kickoff).toISOString(),
          status,
          minute,
          homeTeam: toMatchTeam(home),
          awayTeam: toMatchTeam(away),
          homeScore,
          awayScore,
          popularity: Math.round((home.popularity + away.popularity) / 2),
        };
        matches.push(match);

        if (status === "finished" || status === "live") {
          events[id] = buildEvents(match, rand);
          statistics[id] = buildStats(rand, rand() > 0.85);
        } else {
          events[id] = [];
          statistics[id] = null;
        }
      });
    });
  }

  matches.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  cached = { leagues, teams, matches, events, statistics };
  return cached;
}
