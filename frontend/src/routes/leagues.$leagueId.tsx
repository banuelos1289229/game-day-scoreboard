import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { FavoriteButton } from "@/components/favorite-button";
import { Crest, MatchList } from "@/components/match-card";
import { PageHeader, Section } from "@/components/section";
import { EmptyState, ErrorState, LoadingList } from "@/components/states";
import { api, queryKeys } from "@/services";

export const Route = createFileRoute("/leagues/$leagueId")({
  head: () => ({
    meta: [
      { title: "League — Floodlight" },
      {
        name: "description",
        content: "League table, basic stats and fixtures: live, upcoming and recent matches.",
      },
      { property: "og:title", content: "League — Floodlight" },
      {
        property: "og:description",
        content: "Standings with played, won, drawn, lost, goals and points, plus fixtures.",
      },
    ],
  }),
  component: LeaguePage,
});

function LeaguePage() {
  const { leagueId } = Route.useParams();

  const detail = useQuery({
    queryKey: queryKeys.league(leagueId),
    queryFn: () => api.leagues.detail(leagueId),
  });
  const standings = useQuery({
    queryKey: queryKeys.standings(leagueId),
    queryFn: () => api.leagues.standings(leagueId),
  });
  const stats = useQuery({
    queryKey: queryKeys.leagueStats(leagueId),
    queryFn: () => api.leagues.stats(leagueId),
  });

  if (detail.isPending)
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <LoadingList rows={4} />
      </div>
    );
  if (detail.error)
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />
      </div>
    );

  const { league, live, upcoming, recent } = detail.data;

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      <PageHeader
        title={league.name}
        subtitle={league.country}
        action={<FavoriteButton kind="league" id={league.id} />}
      />

      <Section title="Table" eyebrow="Standings">
        {standings.isPending ? <LoadingList rows={6} /> : null}
        {standings.error ? (
          <ErrorState error={standings.error} onRetry={() => void standings.refetch()} />
        ) : null}
        {standings.data ? (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["#", "Team", "PL", "W", "D", "L", "GF", "GA", "GD", "PTS"].map((h) => (
                    <th key={h} className="label-eyebrow px-3 py-2 text-left font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings.data.map((row) => (
                  <tr key={row.team.id} className="border-b border-border last:border-0">
                    <td className="score-digits px-3 py-2 text-muted-foreground">{row.position}</td>
                    <td className="px-3 py-2">
                      <Link
                        to="/teams/$teamId"
                        params={{ teamId: row.team.id }}
                        className="flex items-center gap-2 text-foreground hover:text-primary"
                      >
                        <Crest team={row.team} size="sm" />
                        {row.team.shortName}
                      </Link>
                    </td>
                    <td className="score-digits px-3 py-2">{row.played}</td>
                    <td className="score-digits px-3 py-2">{row.won}</td>
                    <td className="score-digits px-3 py-2">{row.drawn}</td>
                    <td className="score-digits px-3 py-2">{row.lost}</td>
                    <td className="score-digits px-3 py-2">{row.goalsFor}</td>
                    <td className="score-digits px-3 py-2">{row.goalsAgainst}</td>
                    <td className="score-digits px-3 py-2">{row.goalDifference}</td>
                    <td className="score-digits px-3 py-2 font-semibold text-primary">
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Section>

      {stats.data ? (
        <Section title="Basic stats" eyebrow="Season totals">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Matches played", value: stats.data.played },
              { label: "Goals for", value: stats.data.goalsFor },
              { label: "Goals against", value: stats.data.goalsAgainst },
              { label: "Goal difference", value: stats.data.goalDifference },
              { label: "Wins", value: stats.data.won },
              { label: "Draws", value: stats.data.drawn },
              { label: "Losses", value: stats.data.lost },
            ].map((item) => (
              <div key={item.label} className="panel p-4">
                <p className="label-eyebrow">{item.label}</p>
                <p className="score-digits mt-1 text-2xl text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Live" eyebrow="In play">
        {live.length ? <MatchList matches={live} /> : <EmptyState title="No matches in play" />}
      </Section>

      <Section title="Upcoming" eyebrow="Fixtures">
        {upcoming.length ? (
          <MatchList matches={upcoming} />
        ) : (
          <EmptyState title="No scheduled fixtures" />
        )}
      </Section>

      <Section title="Recent" eyebrow="Results">
        {recent.length ? <MatchList matches={recent} /> : <EmptyState title="No results yet" />}
      </Section>
    </div>
  );
}
