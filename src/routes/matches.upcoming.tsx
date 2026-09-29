import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { MatchList } from "@/components/match-card";
import { PageHeader } from "@/components/section";
import { EmptyState, ErrorState, LoadingList } from "@/components/states";
import { api, queryKeys } from "@/services";

export const Route = createFileRoute("/matches/upcoming")({
  head: () => ({
    meta: [
      { title: "Upcoming fixtures — Floodlight" },
      {
        name: "description",
        content: "Kick-off times for the next football fixtures across the covered leagues.",
      },
      { property: "og:title", content: "Upcoming fixtures — Floodlight" },
      {
        property: "og:description",
        content: "Kick-off times for the next fixtures across the covered leagues.",
      },
    ],
  }),
  component: UpcomingPage,
});

function UpcomingPage() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.upcoming,
    queryFn: () => api.matches.upcoming(),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <PageHeader title="Upcoming" subtitle="Next fixtures by kick-off time." />
      {isPending ? <LoadingList /> : null}
      {error ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}
      {data ? (
        data.length ? <MatchList matches={data} /> : <EmptyState title="No fixtures scheduled" />
      ) : null}
    </div>
  );
}
