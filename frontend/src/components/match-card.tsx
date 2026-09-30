import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { kickoffFull, kickoffTime } from "@/lib/format";
import type { Match, MatchTeam } from "@/services";

export function Crest({ team, size = "md" }: { team: MatchTeam; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display leading-none text-background",
        size === "sm" ? "h-6 w-6 text-[10px]" : "h-9 w-9 text-xs",
      )}
      style={{ backgroundColor: team.color }}
    >
      {team.abbreviation}
    </span>
  );
}

export function StatusBadge({ match }: { match: Match }) {
  if (match.status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-live px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-live-foreground">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-live-foreground" />
        {match.minute ? `${match.minute}'` : "Live"}
      </span>
    );
  }
  if (match.status === "finished") {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Full time
      </span>
    );
  }
  if (match.status === "postponed" || match.status === "cancelled") {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
        {match.status}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
      {kickoffTime(match.kickoff)}
    </span>
  );
}

function Side({ team, score, align }: { team: MatchTeam; score: number | null; align: "left" | "right" }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2",
        align === "right" && "flex-row-reverse text-right",
      )}
    >
      <Crest team={team} size="sm" />
      <span className="truncate text-sm font-medium text-foreground">{team.shortName}</span>
      <span className="score-digits ml-auto text-xl text-foreground">{score ?? "–"}</span>
    </div>
  );
}

export function MatchCard({ match }: { match: Match }) {
  return (
    <Link
      to="/matches/$matchId"
      params={{ matchId: match.id }}
      className="panel block px-4 py-3 transition-colors hover:border-primary/60 hover:bg-surface-raised"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="label-eyebrow truncate">{match.leagueName}</span>
        <StatusBadge match={match} />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Side team={match.homeTeam} score={match.homeScore} align="left" />
        <span className="score-digits text-xs text-muted-foreground">vs</span>
        <Side team={match.awayTeam} score={match.awayScore} align="right" />
      </div>
      {match.status === "scheduled" ? (
        <p className="mt-2 text-xs text-muted-foreground">{kickoffFull(match.kickoff)}</p>
      ) : null}
    </Link>
  );
}

export function MatchList({ matches }: { matches: Match[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} />
      ))}
    </div>
  );
}

export function FormPill({ result }: { result: "win" | "draw" | "loss" }) {
  const label = result === "win" ? "W" : result === "draw" ? "D" : "L";
  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded font-display text-xs text-background",
        result === "win" && "bg-win",
        result === "draw" && "bg-draw",
        result === "loss" && "bg-loss",
      )}
      title={result}
    >
      {label}
    </span>
  );
}
