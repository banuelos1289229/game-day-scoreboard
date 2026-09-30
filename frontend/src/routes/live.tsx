import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { MatchList } from "@/components/match-card";
import { PageHeader } from "@/components/section";
import { EmptyState, ErrorState, LoadingList } from "@/components/states";
import { api, queryKeys } from "@/services";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live scores — Floodlight" },
      {
        name: "description",
        content: "Every football match currently in play, with scores and minute of play.",
      },
      { property: "og:title", content: "Live scores — Floodlight" },
      {
        property: "og:description",
        content: "Follow every match in play with live scores and minute by minute status.",
      },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.live,
    queryFn: () => api.matches.live(),
    refetchInterval: 15_000,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <PageHeader title="Live" subtitle="Refreshes automatically every 15 seconds." />
      {isPending ? <LoadingList /> : null}
      {error ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}
      {data ? (
        data.length ? (
          <MatchList matches={data} />
        ) : (
          <EmptyState title="No matches in play" hint="Come back at kick-off time." />
        )
      ) : null}
    </div>
  );
}
