"use client";

import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import { Wallet, Loader2, ChevronDown, Unplug, Check, Copy } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { monadTestnet } from "@/lib/wagmi-config";

export function ConnectWallet() {
  const { open } = useAppKit();
  const { address, isConnecting, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: balance } = useBalance({ address, query: { enabled: isConnected } });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnecting) {
    return (
      <button disabled className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors">
        <Loader2 className="size-4 animate-spin" />
        Connecting...
      </button>
    );
  }

  if (!isConnected || !address) {
    return (
      <button
        onClick={() => open()}
        className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
      >
        <Wallet className="size-4" />
        Connect Wallet
      </button>
    );
  }

  const isWrongNetwork = chainId !== monadTestnet.id;

  if (isWrongNetwork) {
    return (
      <button
        onClick={() => open({ view: 'Networks' })}
        className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20"
      >
        Switch to Monad
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 py-1.5 pl-3 pr-2 transition-colors hover:bg-secondary"
      >
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <Wallet className="size-3 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {truncateAddress(address)}
          </span>
          {balance && (
            <span className="hidden sm:inline-block rounded-md bg-secondary/60 px-1.5 py-0.5 text-xs text-muted-foreground">
              {Number(balance.formatted).toFixed(3)} MON
            </span>
          )}
        </div>
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", dropdownOpen && "rotate-180")} />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-foreground">Monad Testnet</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-muted-foreground font-mono">{truncateAddress(address)}</p>
              <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
                {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
              </button>
            </div>
          </div>

          <div className="p-1">
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                disconnect();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <Unplug className="size-4" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
