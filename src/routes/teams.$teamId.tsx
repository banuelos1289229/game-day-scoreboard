import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { FavoriteButton } from "@/components/favorite-button";
import { Crest, FormPill, MatchList } from "@/components/match-card";
import { PageHeader, Section } from "@/components/section";
import { EmptyState, ErrorState, LoadingList } from "@/components/states";
import { kickoffDate } from "@/lib/format";
import { api, queryKeys } from "@/services";

export const Route = createFileRoute("/teams/$teamId")({
  head: () => ({
    meta: [
      { title: "Team — Floodlight" },
      {
        name: "description",
        content: "Team profile with recent form, upcoming fixtures and competition.",
      },
      { property: "og:title", content: "Team — Floodlight" },
      {
        property: "og:description",
        content: "Recent form with win/draw/loss results and upcoming fixtures.",
      },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { teamId } = Route.useParams();
  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.team(teamId),
    queryFn: () => api.teams.detail(teamId),
  });

  if (isPending)
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <LoadingList rows={4} />
      </div>
    );
  if (error)
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );

  const { team, league, form, upcoming } = data;

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      <PageHeader
        title={team.name}
        subtitle={`${league.name} · ${league.country}`}
        action={<FavoriteButton kind="team" id={team.id} />}
      />

      <div className="flex items-center gap-3">
        <Crest team={team} />
        <Link
          to="/leagues/$leagueId"
          params={{ leagueId: league.id }}
          className="text-sm text-accent hover:underline"
        >
          View {league.name} table
        </Link>
      </div>

      <Section title="Recent form" eyebrow="Last matches">
        {form.length ? (
          <div className="panel divide-y divide-border">
            <div className="flex gap-1.5 p-4">
              {form.map((entry) => (
                <FormPill key={entry.matchId} result={entry.result} />
              ))}
            </div>
            {form.map((entry) => (
              <Link
                key={entry.matchId}
                to="/matches/$matchId"
                params={{ matchId: entry.matchId }}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-raised"
              >
                <FormPill result={entry.result} />
                <span className="text-muted-foreground">{entry.home ? "vs" : "at"}</span>
                <span className="truncate text-foreground">{entry.opponent.shortName}</span>
                <span className="score-digits ml-auto text-base text-foreground">
                  {entry.scoreFor}–{entry.scoreAgainst}
                </span>
                <span className="hidden w-24 text-right text-xs text-muted-foreground sm:block">
                  {kickoffDate(entry.kickoff)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No finished matches yet" />
        )}
      </Section>

      <Section title="Upcoming" eyebrow="Fixtures">
        {upcoming.length ? (
          <MatchList matches={upcoming} />
        ) : (
          <EmptyState title="No scheduled fixtures" />
        )}
      </Section>
    </div>
  );
}
