import { PropsWithChildren } from "react";

import { PWARegister } from "@/components/pwa/PWARegister";

import { RealtimeSyncProvider } from "./RealtimeSyncProvider";
import { SessionProvider } from "./SessionProvider";
import { TanstackQueryProvider } from "./TanstackQueryProvider";
import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: PropsWithChildren) {
  return (
    <TanstackQueryProvider>
      <ThemeProvider attribute="data-theme" enableSystem={true}>
        <SessionProvider>
          <RealtimeSyncProvider>
            {children}
            <PWARegister />
          </RealtimeSyncProvider>
        </SessionProvider>
      </ThemeProvider>
    </TanstackQueryProvider>
  );
}
