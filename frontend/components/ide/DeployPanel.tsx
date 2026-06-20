"use client";

/**
 * DeployPanel — Deploy UI with wallet status, contract selector, and deploy flow.
 * EVM deployment via wagmi walletClient.deployContract().
 */

import { useState, useEffect } from "react";
import { Loader2, Rocket, ExternalLink, Copy, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAIN_CONFIGS, type ChainKey } from "@/lib/wagmi-config";
import type { CompiledContract } from "./CompilePanel";
import type { TerminalLine } from "./Terminal";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://agent-hive-ld3l.onrender.com";

interface DeployedContract {
  name: string;
  address: string;
  txHash: string;
  chain: ChainKey;
  explorerUrl: string;
}

interface Props {
  compiledContracts: CompiledContract[];
  selectedChain: ChainKey;
  onTerminalLine: (line: TerminalLine) => void;
}

export function DeployPanel({ compiledContracts, selectedChain, onTerminalLine }: Props) {
  const [selectedContract, setSelectedContract] = useState(0);
  const [constructorArgs, setConstructorArgs] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState<DeployedContract[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | undefined>();
  const [isConnected, setIsConnected] = useState(false);

  const chain = CHAIN_CONFIGS[selectedChain];
  const contract = compiledContracts[selectedContract];

  // Check wallet connection dynamically
  useEffect(() => {
    const checkWallet = async () => {
      try {
        const { useAppKitAccount } = await import("@reown/appkit/react");
        // Can't use hook outside component — we read from appkit store instead
        const appkit = (window as typeof window & { appKit?: { getAccount?: () => { address?: string; isConnected?: boolean } } }).appKit;
        if (appkit?.getAccount) {
          const acc = appkit.getAccount();
          setWalletAddress(acc?.address);
          setIsConnected(!!acc?.isConnected);
        }
      } catch {}
    };
    checkWallet();
    const interval = setInterval(checkWallet, 2000);
    return () => clearInterval(interval);
  }, []);

  async function handleDeploy() {
    if (!contract) return;

    if (chain.type === "solana") {
      onTerminalLine({ type: "warning", text: "Solana deployment via browser is not yet supported." });
      onTerminalLine({ type: "info", text: "Use: anchor deploy --provider.cluster devnet" });
      return;
    }

    if (!isConnected || !walletAddress) {
      onTerminalLine({ type: "error", text: "Please connect your wallet first." });
      return;
    }

    setDeploying(true);
    onTerminalLine({ type: "command", text: `Deploying ${contract.contract_name} to ${chain.name}…` });

    try {
      // Dynamic import wagmi hooks — only works inside the WagmiProvider
      const { getWalletClient, getPublicClient } = await import("wagmi/actions");
      const { wagmiConfig } = await import("@/lib/wagmi-config");

      const walletClient = await getWalletClient(wagmiConfig);
      const publicClient = getPublicClient(wagmiConfig);

      if (!walletClient || !publicClient) {
        throw new Error("Wallet client not available — check wallet connection.");
      }

      // Parse constructor args
      let args: unknown[] = [];
      if (constructorArgs.trim()) {
        try {
          args = JSON.parse(`[${constructorArgs}]`);
        } catch {
          throw new Error("Invalid constructor arguments. Use comma-separated JSON values.");
        }
      }

      const bytecode = `0x${contract.bytecode}` as `0x${string}`;

      onTerminalLine({ type: "info", text: "Waiting for wallet signature…" });

      const hash = await walletClient.deployContract({
        abi: contract.abi as [],
        bytecode,
        args,
      });

      onTerminalLine({ type: "info", text: `TX: ${hash}` });
      onTerminalLine({ type: "info", text: "Waiting for confirmation…" });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const address = receipt.contractAddress ?? "";

      onTerminalLine({ type: "success", text: `Deployed at: ${address}` });
      onTerminalLine({ type: "address", text: address });

      const explorerUrl = `${chain.explorer}/address/${address}`;
      const newDeploy: DeployedContract = {
        name: contract.contract_name,
        address,
        txHash: hash,
        chain: selectedChain,
        explorerUrl,
      };
      setDeployed((prev) => [newDeploy, ...prev]);

      // Save to backend
      if (walletAddress) {
        try {
          await fetch(`${BACKEND_URL}/api/ide/deployments/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_wallet: walletAddress,
              chain: selectedChain,
              chain_id: chain.id,
              contract_name: contract.contract_name,
              contract_address: address,
              tx_hash: hash,
              abi: contract.abi,
              bytecode: contract.bytecode,
            }),
          });
        } catch {
          // Non-critical — deployment succeeded even if save fails
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Deploy failed";
      onTerminalLine({ type: "error", text: msg });
    } finally {
      setDeploying(false);
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Wallet status */}
      <div className="rounded-lg border border-white/8 bg-white/3 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1.5">
          Wallet
        </p>
        {isConnected && walletAddress ? (
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-foreground font-mono">
              {walletAddress.slice(0, 8)}…{walletAddress.slice(-6)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-red-400" />
            Not connected — click the wallet button above
          </div>
        )}
      </div>

      {/* No contracts notice */}
      {compiledContracts.length === 0 ? (
        <div className="rounded-lg border border-white/8 bg-white/3 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Compile a contract first to enable deployment.
          </p>
        </div>
      ) : (
        <>
          {/* Contract selector */}
          {compiledContracts.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Contract
              </label>
              <select
                value={selectedContract}
                onChange={(e) => setSelectedContract(Number(e.target.value))}
                className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground focus:border-primary/60 focus:outline-none"
              >
                {compiledContracts.map((c, i) => (
                  <option key={i} value={i}>
                    {c.contract_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Constructor args */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Constructor Arguments
            </label>
            <input
              value={constructorArgs}
              onChange={(e) => setConstructorArgs(e.target.value)}
              placeholder='e.g. "MyToken", "MTK", 1000000'
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary/60 focus:outline-none"
            />
            <p className="text-[10px] text-muted-foreground/40">
              Comma-separated JSON values (leave blank if no constructor)
            </p>
          </div>

          {/* Network info */}
          <div className="rounded-lg border border-white/8 bg-white/3 p-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: chain.color }} />
              <span className="text-xs font-medium">{chain.name}</span>
            </div>
            <a
              href={chain.faucet}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-[11px] text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
            >
              Get {chain.symbol} from faucet <ExternalLink size={10} />
            </a>
          </div>

          {/* Solana notice */}
          {chain.type === "solana" && (
            <div className="flex gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/8 p-3">
              <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-yellow-300/80">
                Solana browser deployment coming soon. Use:{" "}
                <code className="font-mono bg-yellow-500/10 px-1 rounded">
                  anchor deploy --provider.cluster devnet
                </code>
              </p>
            </div>
          )}

          {/* Deploy button */}
          <button
            onClick={handleDeploy}
            disabled={deploying || !isConnected || chain.type === "solana"}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {deploying ? (
              <><Loader2 size={14} className="animate-spin" /> Deploying…</>
            ) : (
              <><Rocket size={14} /> Deploy {contract?.contract_name ?? "Contract"}</>
            )}
          </button>
        </>
      )}

      {/* Deployed contracts */}
      {deployed.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Deployed
          </p>
          {deployed.map((d, i) => (
            <div
              key={i}
              className="rounded-lg border border-emerald-500/20 bg-emerald-500/6 p-3 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300">{d.name}</span>
                <a
                  href={d.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-emerald-400/70 hover:text-emerald-400 flex items-center gap-0.5 transition-colors"
                >
                  Explorer <ExternalLink size={9} />
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-muted-foreground truncate flex-1">
                  {d.address}
                </span>
                <button
                  onClick={() => copyToClipboard(d.address, `addr-${i}`)}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-white/8 transition-colors"
                  aria-label="Copy address"
                >
                  {copied === `addr-${i}` ? <Check size={11} /> : <Copy size={11} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
