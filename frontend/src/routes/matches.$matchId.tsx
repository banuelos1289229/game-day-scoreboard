import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftRight, Square } from "lucide-react";

import { Crest, StatusBadge } from "@/components/match-card";
import { ErrorState, LoadingList, NotAvailable } from "@/components/states";
import { kickoffFull } from "@/lib/format";
import { api, queryKeys, type MatchEvent, type StatPair } from "@/services";

export const Route = createFileRoute("/matches/$matchId")({
  head: () => ({
    meta: [
      { title: "Match detail — Floodlight" },
      {
        name: "description",
        content: "Score, events and match statistics: possession, shots, corners, fouls, cards.",
      },
      { property: "og:title", content: "Match detail — Floodlight" },
      {
        property: "og:description",
        content: "Score, goals, cards and full match statistics.",
      },
    ],
  }),
  component: MatchDetailPage,
});

const STAT_ROWS: Array<{ key: keyof import("@/services").MatchStatistics; label: string }> = [
  { key: "possession", label: "Possession %" },
  { key: "shots", label: "Shots" },
  { key: "shotsOnTarget", label: "Shots on target" },
  { key: "corners", label: "Corners" },
  { key: "fouls", label: "Fouls" },
  { key: "cards", label: "Cards" },
];

function StatRow({ label, pair }: { label: string; pair: StatPair }) {
  const total = (pair.home ?? 0) + (pair.away ?? 0);
  const homePct = total > 0 ? ((pair.home ?? 0) / total) * 100 : 50;
  const unavailable = pair.home === null || pair.away === null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="score-digits text-base text-foreground">
          {pair.home ?? <NotAvailable />}
        </span>
        <span className="label-eyebrow">{label}</span>
        <span className="score-digits text-base text-foreground">
          {pair.away ?? <NotAvailable />}
        </span>
      </div>
      {unavailable ? (
        <div className="h-1.5 rounded-full bg-muted" />
      ) : (
        <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="bg-primary" style={{ width: `${homePct}%` }} />
          <div className="bg-accent" style={{ width: `${100 - homePct}%` }} />
        </div>
      )}
    </div>
  );
}

function EventIcon({ type }: { type: MatchEvent["type"] }) {
  if (type === "goal" || type === "own-goal")
    return <span className="text-base leading-none">⚽</span>;
  if (type === "yellow") return <Square className="h-4 w-4 fill-draw text-draw" />;
  if (type === "red") return <Square className="h-4 w-4 fill-loss text-loss" />;
  return <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />;
}

function MatchDetailPage() {
  const { matchId } = Route.useParams();
  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.match(matchId),
    queryFn: () => api.matches.detail(matchId),
    refetchInterval: 20_000,
  });

  if (isPending)
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <LoadingList rows={4} />
      </div>
    );
  if (error)
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );

  const { match, events, statistics } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="panel p-6">
        <div className="flex items-center justify-between">
          <Link
            to="/leagues/$leagueId"
            params={{ leagueId: match.leagueId }}
            className="label-eyebrow hover:text-foreground"
          >
            {match.leagueName}
          </Link>
          <StatusBadge match={match} />
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {[match.homeTeam, match.awayTeam].map((team, index) => (
            <div key={team.id} className={index === 1 ? "order-3 text-right" : ""}>
              <Link
                to="/teams/$teamId"
                params={{ teamId: team.id }}
                className={`flex items-center gap-3 ${index === 1 ? "flex-row-reverse" : ""}`}
              >
                <Crest team={team} />
                <span className="font-display text-2xl tracking-wide text-foreground">
                  {team.shortName}
                </span>
              </Link>
            </div>
          ))}
          <div className="order-2 text-center">
            <p className="score-digits text-5xl text-foreground">
              {match.homeScore ?? "–"} : {match.awayScore ?? "–"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{kickoffFull(match.kickoff)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-xl text-foreground">Events</h2>
          {events.length ? (
            <ul className="mt-4 space-y-3">
              {events.map((event) => {
                const home = event.teamId === match.homeTeam.id;
                return (
                  <li key={event.id} className="flex items-center gap-3 text-sm">
                    <span className="score-digits w-8 text-muted-foreground">{event.minute}'</span>
                    <EventIcon type={event.type} />
                    <span className="truncate text-foreground">{event.player}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {home ? match.homeTeam.abbreviation : match.awayTeam.abbreviation}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No events yet for this match.
            </p>
          )}
        </section>

        <section className="panel p-5">
          <h2 className="text-xl text-foreground">Statistics</h2>
          {statistics ? (
            <div className="mt-4 space-y-4">
              {STAT_ROWS.map((row) => (
                <StatRow key={row.key} label={row.label} pair={statistics[row.key]} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Statistics are not available for this match.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
