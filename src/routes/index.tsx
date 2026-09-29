import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthGate } from "@/components/auth-gate";
import { Crest, MatchCard, MatchList } from "@/components/match-card";
import { PageHeader, Section } from "@/components/section";
import { EmptyState, ErrorState, LoadingList } from "@/components/states";
import { useAuth } from "@/hooks/useAuth";
import { api, queryKeys } from "@/services";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your dashboard — Floodlight" },
      {
        name: "description",
        content:
          "Live matches, your favourite teams and leagues, and recommended fixtures in one place.",
      },
      { property: "og:title", content: "Your dashboard — Floodlight" },
      {
        property: "og:description",
        content: "Live matches, favourites and recommended fixtures in one football scoreboard.",
      },
    ],
  }),
  component: () => (
    <AuthGate>
      <DashboardPage />
    </AuthGate>
  ),
});

function DashboardPage() {
  const { user } = useAuth();
  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.getDashboard(),
    refetchInterval: 30_000,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <PageHeader
        title={`Welcome back, ${user?.name.split(" ")[0]}`}
        subtitle="Everything you follow, plus what's worth watching right now."
      />

      {isPending ? <LoadingList rows={5} /> : null}
      {error ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

      {data ? (
        <>
          <Section title="Live now" eyebrow="In play">
            {data.live.length ? (
              <MatchList matches={data.live} />
            ) : (
              <EmptyState title="No matches in play" hint="Check upcoming fixtures instead." />
            )}
          </Section>

          <Section title="Your favourites" eyebrow="Following">
            <div className="flex flex-wrap gap-2">
              {data.favorites.teams.map((team) => (
                <Link
                  key={team.id}
                  to="/teams/$teamId"
                  params={{ teamId: team.id }}
                  className="panel flex items-center gap-2 px-3 py-2 text-sm hover:border-primary/60"
                >
                  <Crest team={team} size="sm" />
                  {team.shortName}
                </Link>
              ))}
              {data.favorites.leagues.map((league) => (
                <Link
                  key={league.id}
                  to="/leagues/$leagueId"
                  params={{ leagueId: league.id }}
                  className="panel px-3 py-2 text-sm hover:border-primary/60"
                >
                  {league.name}
                </Link>
              ))}
              {!data.favorites.teams.length && !data.favorites.leagues.length ? (
                <EmptyState
                  title="No favourites yet"
                  hint="Search for a team or league and follow it."
                />
              ) : null}
            </div>

            {data.favoriteMatches.length ? (
              <div className="mt-4">
                <p className="label-eyebrow mb-2">Next up for your favourites</p>
                <MatchList matches={data.favoriteMatches} />
              </div>
            ) : null}
          </Section>

          <Section title="Recommended" eyebrow="Picked for you">
            {data.recommended.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.recommended.map((rec) => (
                  <div key={rec.match.id} className="space-y-1">
                    <MatchCard match={rec.match} />
                    <p className="px-1 text-xs text-muted-foreground">
                      {rec.reasons.length ? rec.reasons.join(" · ") : "Popular fixture"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nothing to recommend right now"
                hint="Recommendations are based on live matches, your favourites and popularity."
              />
            )}
          </Section>
        </>
      ) : null}
    </div>
  );
}
