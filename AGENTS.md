<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md

## Architecture rules

- **All backend access goes through `src/services/`.** Components, hooks and
  routes must never call `fetch`, an SDK, or localStorage directly for app
  data. The single entry point is the `api` export in `src/services/index.ts`.
- `src/services/contract.ts` defines `ScoreboardApi` — the app's only backend
  contract; method names map 1:1 to the planned REST endpoints in the product
  plan (auth, dashboard, matches, teams, leagues, search, favorites).
- `src/services/mock/mock-api.ts` is the current implementation. It runs the
  whole app with deterministic demo data (`fixtures.ts`) and localStorage
  persistence (`store.ts`). Swapping in the real backend = one new
  implementation of `ScoreboardApi` + changing the export in `index.ts`.
- Domain types in `src/services/types.ts` are provider-agnostic; no external
  sports API shape may leak into the app.
- Demo login: demo@scoreboard.app / demo1234.
- Auth is a client-side gate (`AuthGate`) backed by the mock; never gate in
  loaders while auth is mocked.
- Statistics that a provider doesn't expose render as "N/A" — never fabricate.
