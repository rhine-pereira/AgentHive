import type { Metadata } from "next";
import { WagmiProviders } from "@/providers/WagmiProviders";

export const metadata: Metadata = {
  title: "Smart Contract IDE — AgentHive",
  description:
    "Write, compile, and deploy Solidity smart contracts to Ethereum, Monad, Polygon, and Arbitrum from one browser-based IDE.",
};

export default function IdeLayout({ children }: { children: React.ReactNode }) {
  return <WagmiProviders>{children}</WagmiProviders>;
}
