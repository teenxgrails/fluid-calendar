"use client";

import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { AIActionCursor } from "@/components/ai/AIActionCursor";
import { AIChatOverlay } from "@/components/ai/AIChatOverlay";
import { AICompanion } from "@/components/ai/AICompanion";
import { DndProvider } from "@/components/dnd/DndProvider";
import { AppNav } from "@/components/navigation/AppNav";
import { MobileTopBar } from "@/components/navigation/MobileTopBar";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { PrivacyProvider } from "@/components/providers/PrivacyProvider";
import { SetupCheck } from "@/components/setup/SetupCheck";
import { CommandPalette } from "@/components/ui/command-palette";
import { CommandPaletteFab } from "@/components/ui/command-palette-fab";
import { CommandPaletteHint } from "@/components/ui/command-palette-hint";
import { ShortcutsModal } from "@/components/ui/shortcuts-modal";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";
import { quickEase, springFluid } from "@/lib/motion";

import { usePageTitle } from "@/hooks/use-page-title";

import { useShortcutsStore } from "@/store/shortcuts";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [chatOverlayOpen, setChatOverlayOpen] = useState(false);
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = pathname !== "/today";
  const { isOpen: shortcutsOpen, setOpen: setShortcutsOpen } =
    useShortcutsStore();

  // Use the page title hook
  usePageTitle();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
      } else if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setChatOverlayOpen((open) => !open);
      } else if (e.key === "?" && !(e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setShortcutsOpen]);

  useEffect(() => {
    document.documentElement.dataset.needtMotion = motionEnabled ? "on" : "off";
    return () => {
      delete document.documentElement.dataset.needtMotion;
    };
  }, [motionEnabled]);

  return (
    <div className="needt-page-depth relative flex min-h-dvh">
      <PrivacyProvider>
        <DndProvider>
          <TooltipProvider delayDuration={400}>
            <SetupCheck />
            <CommandPalette
              open={commandPaletteOpen}
              onOpenChange={setCommandPaletteOpen}
            />
            <CommandPaletteHint />
            <CommandPaletteFab />
            <ShortcutsModal
              isOpen={shortcutsOpen}
              onClose={() => setShortcutsOpen(false)}
            />
            <MobileTopBar />
            <AppNav onOpenChatOverlay={() => setChatOverlayOpen(true)} />
            <main
              data-needt-motion={motionEnabled ? "on" : "off"}
              className={cn(
                "relative min-w-0 flex-1 max-lg:pb-[calc(68px+env(safe-area-inset-bottom))] max-lg:pt-[calc(56px+env(safe-area-inset-top))] max-sm:pb-[calc(92px+env(safe-area-inset-bottom))]",
                motionEnabled && "needt-route-content",
                pathname === "/today" && "max-sm:pt-0"
              )}
            >
              <NotificationProvider>
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    key={pathname}
                    className="needt-mobile-route-fallback min-h-full"
                    initial={
                      !motionEnabled || prefersReducedMotion
                        ? false
                        : { opacity: 0, x: 12, scale: 0.996 }
                    }
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={
                      !motionEnabled || prefersReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 0, x: -7, scale: 0.998 }
                    }
                    transition={
                      !motionEnabled || prefersReducedMotion
                        ? { duration: 0 }
                        : { ...springFluid, opacity: quickEase }
                    }
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </NotificationProvider>
            </main>
            <AIChatOverlay
              open={chatOverlayOpen}
              onOpenChange={setChatOverlayOpen}
            />
            <AICompanion
              hidden={chatOverlayOpen}
              onOpenChat={() => setChatOverlayOpen(true)}
            />
            <AIActionCursor />
            <Toaster />
          </TooltipProvider>
        </DndProvider>
      </PrivacyProvider>
    </div>
  );
}
