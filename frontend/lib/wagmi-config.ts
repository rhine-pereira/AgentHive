/**
 * Wagmi + Reown AppKit configuration for the IDE feature.
 * Defines chains, wallet adapter, and chain metadata.
 */

import { cookieStorage, createStorage, http } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import {
  sepolia,
  polygonAmoy,
  arbitrumSepolia,
  monadTestnet,
} from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { QueryClient } from "@tanstack/react-query";

// ── WalletConnect project ID ─────────────────────────────────────────────────
// Get yours free at https://cloud.walletconnect.com
export const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo-project-id";

// ── Export imported networks for convenience ────────────────────────────────
export { monadTestnet };

// ── Supported networks ───────────────────────────────────────────────────────
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  sepolia,
  monadTestnet,
  polygonAmoy,
  arbitrumSepolia,
];

// ── Wagmi Adapter ─────────────────────────────────────────────────────────────
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [sepolia.id]: http(),
    [monadTestnet.id]: http("https://testnet-rpc.monad.xyz"),
    [polygonAmoy.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// ── React Query Client ────────────────────────────────────────────────────────
export const queryClient = new QueryClient();

// ── Chain display metadata ────────────────────────────────────────────────────
export type ChainKey = "sepolia" | "monad" | "polygonAmoy" | "arbitrumSepolia" | "solana";

export const CHAIN_CONFIGS: Record<
  ChainKey,
  {
    id: number | null;
    name: string;
    symbol: string;
    color: string;
    explorer: string;
    rpc: string;
    type: "evm" | "solana";
    faucet: string;
  }
> = {
  sepolia: {
    id: 11155111,
    name: "Ethereum Sepolia",
    symbol: "ETH",
    color: "#627EEA",
    explorer: "https://sepolia.etherscan.io",
    rpc: "https://rpc.sepolia.org",
    type: "evm",
    faucet: "https://sepoliafaucet.com",
  },
  monad: {
    id: 10143,
    name: "Monad Testnet",
    symbol: "MON",
    color: "#8B5CF6",
    explorer: "https://monad-testnet.socialscan.io",
    rpc: "https://testnet-rpc.monad.xyz",
    type: "evm",
    faucet: "https://faucet.monad.xyz",
  },
  polygonAmoy: {
    id: 80002,
    name: "Polygon Amoy",
    symbol: "MATIC",
    color: "#7B3FE4",
    explorer: "https://amoy.polygonscan.com",
    rpc: "https://rpc-amoy.polygon.technology",
    type: "evm",
    faucet: "https://faucet.polygon.technology",
  },
  arbitrumSepolia: {
    id: 421614,
    name: "Arbitrum Sepolia",
    symbol: "ETH",
    color: "#28A0F0",
    explorer: "https://sepolia.arbiscan.io",
    rpc: "https://sepolia-rollup.arbitrum.io/rpc",
    type: "evm",
    faucet: "https://faucet.arbitrum.io",
  },
  solana: {
    id: null,
    name: "Solana Devnet",
    symbol: "SOL",
    color: "#9945FF",
    explorer: "https://explorer.solana.com/?cluster=devnet",
    rpc: "https://api.devnet.solana.com",
    type: "solana",
    faucet: "https://faucet.solana.com",
  },
};
