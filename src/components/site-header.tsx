import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Search } from "lucide-react";
import { useState } from "react";

import { Button, Input } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/live", label: "Live" },
  { to: "/matches/upcoming", label: "Upcoming" },
  { to: "/matches/recent", label: "Results" },
  { to: "/favorites", label: "Favourites" },
] as const;

export function SiteHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary font-display text-base text-primary-foreground">
            SB
          </span>
          <span className="font-display text-xl tracking-wide text-foreground">
            Floodlight
          </span>
        </Link>

        {user ? (
          <nav className="order-3 flex w-full gap-1 overflow-x-auto text-sm md:order-none md:w-auto">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "bg-surface-raised text-foreground" }}
                className="whitespace-nowrap rounded-md px-3 py-1.5 uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <form
            className="relative hidden sm:block"
            onSubmit={(event) => {
              event.preventDefault();
              if (!query.trim()) return;
              void navigate({ to: "/search", search: { q: query.trim() } });
            }}
          >
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search teams, leagues"
              aria-label="Search teams and leagues"
              className="w-56 pl-8"
            />
          </form>

          {user ? (
            <Button variant="ghost" size="sm" onClick={() => void logout()} title="Sign out">
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">{user.name.split(" ")[0]}</span>
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
