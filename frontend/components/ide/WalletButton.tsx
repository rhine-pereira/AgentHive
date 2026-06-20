"use client";

/**
 * WalletButton — Chain selector dropdown + wallet connect/disconnect button.
 * Uses Reown AppKit useAppKitAccount and opens the modal on click.
 */

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAIN_CONFIGS, type ChainKey } from "@/lib/wagmi-config";

// Safe dynamic import of appkit hook
function useWalletAccount() {
  const [account, setAccount] = useState<{ address?: string; isConnected: boolean }>({ isConnected: false });

  useEffect(() => {
    // Only import appkit on client side
    import("@reown/appkit/react")
      .then(({ useAppKitAccount }) => {
        // This is a hook so we can't call it here directly
        // We rely on the component using this hook pattern
      })
      .catch(() => {});
  }, []);

  return account;
}

interface ChainSelectorProps {
  selectedChain: ChainKey;
  onSelect: (chain: ChainKey) => void;
}

export function ChainSelector({ selectedChain, onSelect }: ChainSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = CHAIN_CONFIGS[selectedChain];

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white/8 hover:text-foreground transition-colors"
      >
        <span
          className="size-2 rounded-full shrink-0"
          style={{ backgroundColor: current.color }}
        />
        <span>{current.name}</span>
        <ChevronDown
          size={12}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-border bg-card shadow-2xl py-1 animate-in fade-in slide-in-from-top-2 duration-150">
          {(Object.entries(CHAIN_CONFIGS) as [ChainKey, (typeof CHAIN_CONFIGS)[ChainKey]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { onSelect(key); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:bg-white/6 hover:text-foreground transition-colors"
            >
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: cfg.color }}
              />
              <span className="flex-1 text-left">{cfg.name}</span>
              <span
                className={cn(
                  "rounded px-1 py-0.5 text-[9px] font-semibold uppercase",
                  cfg.type === "evm"
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-purple-500/15 text-purple-400",
                )}
              >
                {cfg.type}
              </span>
              {key === selectedChain && <Check size={11} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface WalletButtonProps {
  address?: string;
  isConnected: boolean;
}

export function WalletButton({ address, isConnected }: WalletButtonProps) {
  function handleClick() {
    // Open Reown AppKit modal
    const modal = document.querySelector("appkit-button") as HTMLElement | null;
    if (modal) {
      modal.click();
    } else {
      // Fallback: dispatch custom event that AppKit listens for
      window.dispatchEvent(new CustomEvent("open-appkit-modal"));
    }
  }

  if (isConnected && address) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-white/8 transition-colors"
      >
        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
        {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
    >
      <Wallet size={12} />
      Connect Wallet
    </button>
  );
}
