"use client";

/**
 * IdeNavbar — Top navigation bar for the IDE workspace.
 * Shows logo, project name input, chain selector, save button, wallet.
 */

import Link from "next/link";
import { Save, LayoutDashboard } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/site/logo";
import { ChainSelector } from "./WalletButton";
import type { ChainKey } from "@/lib/wagmi-config";
import { cn } from "@/lib/utils";

interface Props {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  selectedChain: ChainKey;
  onChainChange: (chain: ChainKey) => void;
  onSave: () => void;
  isSaving: boolean;
  walletSlot?: ReactNode;
}

export function IdeNavbar({
  projectName,
  onProjectNameChange,
  selectedChain,
  onChainChange,
  onSave,
  isSaving,
  walletSlot,
}: Props) {
  return (
    <header className="ide-navbar flex h-11 items-center gap-3 border-b border-white/8 px-3 shrink-0">
      {/* Logo — Logo component is itself a Link, no wrapper needed */}
      <Logo />

      <div className="w-px h-5 bg-white/10 shrink-0" />

      {/* Project name */}
      <input
        value={projectName}
        onChange={(e) => onProjectNameChange(e.target.value)}
        className="min-w-0 flex-1 max-w-[180px] rounded border border-transparent bg-transparent px-1.5 py-0.5 text-sm font-medium text-foreground focus:border-white/20 focus:bg-white/4 focus:outline-none transition-colors"
        spellCheck={false}
        aria-label="Project name"
      />

      <div className="flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-2 shrink-0">
        <ChainSelector selectedChain={selectedChain} onSelect={onChainChange} />

        <button
          onClick={onSave}
          disabled={isSaving}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white/8 hover:text-foreground transition-colors",
            isSaving && "opacity-60 cursor-not-allowed",
          )}
        >
          <Save size={12} />
          {isSaving ? "Saving…" : "Save"}
        </button>

        <Link
          href="/ide/dashboard"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white/8 hover:text-foreground transition-colors"
        >
          <LayoutDashboard size={12} />
          <span className="hidden sm:inline">History</span>
        </Link>

        {walletSlot}
      </div>
    </header>
  );
}
