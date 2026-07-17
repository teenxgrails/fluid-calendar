"use client";

import { PropsWithChildren } from "react";

import { useRealtimeSync } from "@/hooks/useRealtimeSync";

export function RealtimeSyncProvider({ children }: PropsWithChildren) {
  useRealtimeSync();
  return children;
}
