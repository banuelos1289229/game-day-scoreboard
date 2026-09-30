import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo, type ReactNode } from "react";

import { api, queryKeys, type User } from "@/services";

interface AuthValue {
  user: User | null;
  isLoading: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.auth.me(),
    staleTime: 60_000,
  });

  const loginMutation = useMutation({
    mutationFn: api.auth.login,
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.me, session.user);
      void queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation({
    mutationFn: api.auth.register,
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.me, session.user);
      void queryClient.invalidateQueries();
    },
  });

  const value = useMemo<AuthValue>(
    () => ({
      user: data ?? null,
      isLoading,
      login: async (input) => {
        await loginMutation.mutateAsync(input);
      },
      register: async (input) => {
        await registerMutation.mutateAsync(input);
      },
      logout: async () => {
        await api.auth.logout();
        queryClient.setQueryData(queryKeys.me, null);
        queryClient.clear();
      },
    }),
    [data, isLoading, loginMutation, registerMutation, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
