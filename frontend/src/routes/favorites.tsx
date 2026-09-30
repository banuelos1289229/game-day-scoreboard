import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

import { AuthGate } from "@/components/auth-gate";
import { Crest } from "@/components/match-card";
import { PageHeader, Section } from "@/components/section";
import { EmptyState, ErrorState, LoadingList } from "@/components/states";
import { Button } from "@/components/ui/button";
import { api, queryKeys } from "@/services";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favourites — Floodlight" },
      {
        name: "description",
        content: "The teams and leagues you follow on Floodlight.",
      },
      { property: "og:title", content: "Favourites — Floodlight" },
      {
        property: "og:description",
        content: "Manage the football teams and leagues you follow.",
      },
    ],
  }),
  component: () => (
    <AuthGate>
      <FavoritesPage />
    </AuthGate>
  ),
});

function FavoritesPage() {
  const queryClient = useQueryClient();
  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: () => api.favorites.list(),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };

  const unfollowTeam = useMutation({
    mutationFn: (id: string) => api.favorites.toggleTeam(id),
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.favorites, next);
      invalidate();
    },
  });
  const unfollowLeague = useMutation({
    mutationFn: (id: string) => api.favorites.toggleLeague(id),
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.favorites, next);
      invalidate();
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8">
      <PageHeader
        title="Favourites"
        subtitle="Everything you follow. Unfollow with the star."
        action={
          <Link to="/search">
            <Button variant="outline" size="sm">
              Find more
            </Button>
          </Link>
        }
      />

      {isPending ? <LoadingList rows={3} /> : null}
      {error ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

      {data ? (
        <>
          <Section title="Teams" eyebrow={`${data.teams.length} followed`}>
            {data.teams.length ? (
              <div className="panel divide-y divide-border">
                {data.teams.map((team) => (
                  <div key={team.id} className="flex items-center gap-3 px-4 py-3">
                    <Crest team={team} size="sm" />
                    <Link
                      to="/teams/$teamId"
                      params={{ teamId: team.id }}
                      className="text-sm font-medium text-foreground hover:text-primary"
                    >
                      {team.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{team.leagueName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      disabled={unfollowTeam.isPending}
                      onClick={() => unfollowTeam.mutate(team.id)}
                    >
                      <Star className="h-4 w-4 fill-primary text-primary" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No favourite teams"
                hint="Search for a team and follow it from its page."
              />
            )}
          </Section>

          <Section title="Leagues" eyebrow={`${data.leagues.length} followed`}>
            {data.leagues.length ? (
              <div className="panel divide-y divide-border">
                {data.leagues.map((league) => (
                  <div key={league.id} className="flex items-center gap-3 px-4 py-3">
                    <Link
                      to="/leagues/$leagueId"
                      params={{ leagueId: league.id }}
                      className="text-sm font-medium text-foreground hover:text-primary"
                    >
                      {league.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{league.country}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      disabled={unfollowLeague.isPending}
                      onClick={() => unfollowLeague.mutate(league.id)}
                    >
                      <Star className="h-4 w-4 fill-primary text-primary" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No favourite leagues"
                hint="Open a league and follow it from its page."
              />
            )}
          </Section>
        </>
      ) : null}
    </div>
  );
}
