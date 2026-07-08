"use client";

import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import { getTitleFromPathname } from "@/lib/utils/page-title";

import "../app/globals.css";

export default function Loading() {
  // Use client-side rendering to avoid hydration issues
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    // Set document title on the client side
    const title = getTitleFromPathname(pathname);
    document.title = `Loading ${title}`;
  }, [pathname]);

  // Only render the full content after mounting on the client
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="glass--strong flex w-full max-w-sm flex-col items-center p-8">
        <div className="mina-orb mb-5 h-16 w-16 animate-pulse" />
        <p className="text-sm font-medium text-[var(--text-hi)]">
          Opening Mina
        </p>
        <div className="mt-5 grid w-full gap-2">
          <div className="glass-skeleton h-3 w-full" />
          <div className="glass-skeleton h-3 w-3/4" />
          <div className="glass-skeleton h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}
