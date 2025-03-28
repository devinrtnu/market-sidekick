"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ 
  children, 
  ...props 
}: { 
  children: React.ReactNode;
  attribute?: "class" | "data-theme";
  defaultTheme?: string;
  enableSystem?: boolean;
}) {
  return (
    <NextThemesProvider
      attribute="class" // Assuming class-based theme switching
      defaultTheme="dark"
      forcedTheme="dark" // Enforce dark mode
      {...props} // Spread remaining props, but forcedTheme takes precedence
    >
      {children}
    </NextThemesProvider>
  );
}
