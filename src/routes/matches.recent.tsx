import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { MatchList } from "@/components/match-card";
import { PageHeader } from "@/components/section";
import { EmptyState, ErrorState, LoadingList } from "@/components/states";
import { api, queryKeys } from "@/services";

export const Route = createFileRoute("/matches/recent")({
  head: () => ({
    meta: [
      { title: "Results — Floodlight" },
      {
        name: "description",
        content: "Final scores from recently finished football matches.",
      },
      { property: "og:title", content: "Results — Floodlight" },
      {
        property: "og:description",
        content: "Final scores from recently finished football matches.",
      },
    ],
  }),
  component: RecentPage,
});

function RecentPage() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.recent,
    queryFn: () => api.matches.recent(),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <PageHeader title="Results" subtitle="Most recent finished matches first." />
      {isPending ? <LoadingList /> : null}
      {error ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}
      {data ? (
        data.length ? <MatchList matches={data} /> : <EmptyState title="No results yet" />
      ) : null}
    </div>
  );
}
