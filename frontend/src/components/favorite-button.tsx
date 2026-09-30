import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { api, queryKeys } from "@/services";

export function FavoriteButton({
  kind,
  id,
  className,
}: {
  kind: "team" | "league";
  id: string;
  className?: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: () => api.favorites.list(),
    enabled: Boolean(user),
  });

  const isFavorite = Boolean(
    kind === "team"
      ? favorites?.teams.some((t) => t.id === id)
      : favorites?.leagues.some((l) => l.id === id),
  );

  const mutation = useMutation({
    mutationFn: () =>
      kind === "team" ? api.favorites.toggleTeam(id) : api.favorites.toggleLeague(id),
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.favorites, next);
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  if (!user) return null;

  return (
    <Button
      variant={isFavorite ? "primary" : "outline"}
      size="sm"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
      className={className}
      aria-pressed={isFavorite}
    >
      <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
      {isFavorite ? "Following" : "Follow"}
    </Button>
  );
}
