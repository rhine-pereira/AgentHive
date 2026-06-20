"use client";

/**
 * WagmiProviders — Reown AppKit + Wagmi + React Query provider stack.
 * Only loaded inside /ide routes to avoid polluting the rest of the app.
 */

import { type ReactNode, useEffect, useRef } from "react";
import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  wagmiAdapter,
  wagmiConfig,
  queryClient,
  projectId,
  networks,
} from "@/lib/wagmi-config";

// Initialise AppKit once (guard against double-init in dev HMR)
let appKitInitialised = false;

function initAppKit() {
  if (appKitInitialised) return;
  appKitInitialised = true;
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks,
    metadata: {
      name: "AgentHive IDE",
      description: "Multi-chain smart contract IDE",
      url: typeof window !== "undefined" ? window.location.origin : "",
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
    features: { analytics: false },
    themeMode: "dark",
    themeVariables: {
      "--w3m-accent": "oklch(0.58 0.21 293)",
      "--w3m-border-radius-master": "8px",
    },
  });
}

export function WagmiProviders({ children }: { children: ReactNode }) {
  const initialised = useRef(false);
  if (!initialised.current) {
    initAppKit();
    initialised.current = true;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
