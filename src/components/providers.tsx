"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";

// next-themes renders an inline <script> to set the theme class before paint,
// avoiding a flash of the wrong theme. React 19 added a dev-only warning for
// <script> elements rendered as JSX, which fires for this even though the
// script behaves correctly. Still present in next-themes 1.0.0-beta.0 (same
// pattern), so suppress just this message in development. See #62.
const FILTERED = Symbol.for("median.nextThemesScriptWarningFiltered");

if (process.env.NODE_ENV === "development" && !(FILTERED in console.error)) {
  const SCRIPT_TAG_WARNING = "Encountered a script tag while rendering";
  const original = console.error;
  const filtered = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes(SCRIPT_TAG_WARNING)) {
      return;
    }
    original(...args);
  };
  Object.assign(filtered, { [FILTERED]: true });
  console.error = filtered;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
