import { ApiError, type Session, type User } from "../types";

/**
 * Mock persistence. Browser: localStorage so a reload keeps you signed in.
 * Server (SSR): in-memory, which means "signed out" during prerender.
 */
const KEY_USERS = "sls.mock.users";
const KEY_SESSION = "sls.mock.session";
const KEY_FAVORITES = "sls.mock.favorites";

interface StoredUser extends User {
  password: string;
}

interface FavoritesState {
  teams: string[];
  leagues: string[];
}

const memory = new Map<string, string>();

function read(key: string): string | null {
  if (typeof window === "undefined") return memory.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(key: string, value: string) {
  memory.set(key, value);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore quota/private-mode failures */
  }
}

function parse<T>(key: string, fallback: T): T {
  const raw = read(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const DEMO: StoredUser = {
  id: "demo-user",
  name: "Demo Fan",
  email: "demo@scoreboard.app",
  password: "demo1234",
};

function users(): StoredUser[] {
  const stored = parse<StoredUser[]>(KEY_USERS, []);
  return stored.some((u) => u.email === DEMO.email) ? stored : [DEMO, ...stored];
}

export function createUser(input: { name: string; email: string; password: string }): Session {
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim()) throw new ApiError("validation", "Name is required.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    throw new ApiError("validation", "Enter a valid email address.");
  if (input.password.length < 8)
    throw new ApiError("validation", "Password must be at least 8 characters.");
  const all = users();
  if (all.some((u) => u.email === email))
    throw new ApiError("validation", "An account with that email already exists.");

  const user: StoredUser = {
    id: `user-${all.length + 1}-${email.length}`,
    name: input.name.trim(),
    email,
    password: input.password,
  };
  write(KEY_USERS, JSON.stringify([...all, user]));
  return startSession(user);
}

export function authenticate(input: { email: string; password: string }): Session {
  const email = input.email.trim().toLowerCase();
  const found = users().find((u) => u.email === email);
  if (!found || found.password !== input.password)
    throw new ApiError("unauthorized", "Incorrect email or password.");
  return startSession(found);
}

function startSession(user: StoredUser): Session {
  const session: Session = {
    token: `mock-token-${user.id}`,
    user: { id: user.id, name: user.name, email: user.email },
  };
  write(KEY_SESSION, JSON.stringify(session));
  return session;
}

export function currentSession(): Session | null {
  return parse<Session | null>(KEY_SESSION, null);
}

export function requireSession(): Session {
  const session = currentSession();
  if (!session) throw new ApiError("unauthorized", "You need to sign in first.");
  return session;
}

export function clearSession() {
  write(KEY_SESSION, "null");
}

function allFavorites(): Record<string, FavoritesState> {
  return parse<Record<string, FavoritesState>>(KEY_FAVORITES, {});
}

export function favoritesOf(userId: string): FavoritesState {
  const seeded: FavoritesState =
    userId === DEMO.id
      ? { teams: ["pl-ars", "ll-rma"], leagues: ["pl"] }
      : { teams: [], leagues: [] };
  return allFavorites()[userId] ?? seeded;
}

export function setFavorites(userId: string, next: FavoritesState) {
  write(KEY_FAVORITES, JSON.stringify({ ...allFavorites(), [userId]: next }));
}

export function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export const DEMO_CREDENTIALS = { email: DEMO.email, password: DEMO.password };
