"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CalendarDays,
  CheckSquare,
  Focus,
  Keyboard,
  Search,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { useShortcutsStore } from "@/store/shortcuts";

import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

interface AppNavProps {
  className?: string;
}

export function AppNav({ className }: AppNavProps) {
  const pathname = usePathname();
  const { setOpen: setShortcutsOpen } = useShortcutsStore();

  // Function to trigger command palette
  const openCommandPalette = () => {
    // Simulate Cmd+K / Ctrl+K
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  const links = [
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/focus", label: "Focus", icon: Focus },
  ];

  return (
    <nav
      className={cn(
        "glass--strong z-20 mx-3 mt-3 h-14 flex-none rounded-2xl",
        className
      )}
    >
      <div className="h-full px-3 sm:px-4">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/calendar"
              className={cn(
                "mr-1 flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-semibold",
                pathname === "/calendar"
                  ? "bg-white/10 text-white"
                  : "text-foreground hover:bg-white/[0.07]"
              )}
            >
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--acc-blue),var(--acc-violet)_55%,var(--acc-magenta))] text-white shadow-[0_0_24px_-8px_var(--acc-violet)]">
                <Sparkles className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="hidden sm:inline">Mina</span>
            </Link>
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-white/10 text-white shadow-[0_0_24px_-16px_var(--acc-blue)]"
                      : "text-muted-foreground hover:bg-white/[0.07] hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openCommandPalette}
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.045] px-2 py-1.5 text-xs text-muted-foreground backdrop-blur-xl hover:bg-white/[0.075] hover:text-foreground"
              title="Search or run a command (⌘K)"
            >
              <Search className="h-4 w-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="ml-1 hidden rounded bg-white/10 px-1 py-0.5 text-xs sm:inline">
                ⌘K
              </kbd>
            </button>
            <ThemeToggle />
            <button
              onClick={() => setShortcutsOpen(true)}
              className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs text-muted-foreground hover:bg-white/[0.07] hover:text-foreground"
              title="View Keyboard Shortcuts (Press ?)"
            >
              <Keyboard className="h-4 w-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">Shortcuts</span>
              <kbd className="ml-1 hidden rounded bg-white/10 px-1 py-0.5 text-xs sm:inline">
                ?
              </kbd>
            </button>
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
