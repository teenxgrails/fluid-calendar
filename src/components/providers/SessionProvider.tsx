"use client";

import { createContext, useContext, useMemo } from "react";

import type { Session } from "next-auth";
import {
  SessionProvider as NextAuthSessionProvider,
  useSession,
} from "next-auth/react";

type AppSessionStatus = "authenticated" | "loading" | "unauthenticated";

interface AppSessionState {
  data: Session | null;
  status: AppSessionStatus;
}

const AppSessionContext = createContext<AppSessionState | null>(null);

function AppSessionStateProvider({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession();
  const value = useMemo(() => ({ data, status }), [data, status]);

  return (
    <AppSessionContext.Provider value={value}>
      {children}
    </AppSessionContext.Provider>
  );
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <AppSessionStateProvider>{children}</AppSessionStateProvider>
    </NextAuthSessionProvider>
  );
}

export function useAppSession(): AppSessionState {
  const context = useContext(AppSessionContext);
  if (!context) {
    throw new Error("useAppSession must be used within SessionProvider");
  }
  return context;
}
