import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { z } from "zod";

import { Crest } from "@/components/match-card";
import { PageHeader, Section } from "@/components/section";
import { EmptyState, ErrorState, LoadingList } from "@/components/states";
import { Input } from "@/components/ui/button";
import { api, queryKeys } from "@/services";

const searchSchema = z.object({ q: z.string().optional().catch("") });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search — Floodlight" },
      {
        name: "description",
        content: "Search football teams and leagues to follow them or open their pages.",
      },
      { property: "og:title", content: "Search — Floodlight" },
      {
        property: "og:description",
        content: "Find teams and leagues across all covered competitions.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate();

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.search(q),
    queryFn: () => api.search(q),
    enabled: q.trim().length > 0,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <PageHeader title="Search" subtitle="Teams and leagues across all competitions." />

      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("q");
          void navigate({ to: "/search", search: { q: String(value ?? "") } });
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Try 'Arsenal' or 'Serie A'"
          aria-label="Search teams and leagues"
          className="h-12 pl-10 text-base"
          autoFocus
        />
      </form>

      {isPending && q ? <LoadingList rows={3} /> : null}
      {error ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

      {data ? (
        <>
          <Section title="Teams" eyebrow={`${data.teams.length} found`}>
            {data.teams.length ? (
              <div className="panel divide-y divide-border">
                {data.teams.map((team) => (
                  <Link
                    key={team.id}
                    to="/teams/$teamId"
                    params={{ teamId: team.id }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised"
                  >
                    <Crest team={team} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{team.name}</p>
                      <p className="text-xs text-muted-foreground">{team.leagueName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="No teams match" hint="Try a different spelling." />
            )}
          </Section>

          <Section title="Leagues" eyebrow={`${data.leagues.length} found`}>
            {data.leagues.length ? (
              <div className="panel divide-y divide-border">
                {data.leagues.map((league) => (
                  <Link
                    key={league.id}
                    to="/leagues/$leagueId"
                    params={{ leagueId: league.id }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{league.name}</p>
                      <p className="text-xs text-muted-foreground">{league.country}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="No leagues match" />
            )}
          </Section>
        </>
      ) : q.trim() ? null : (
        <EmptyState title="Start typing to search" hint="Teams and competitions are searchable." />
      )}
    </div>
  );
}
