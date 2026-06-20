"use client";

/**
 * EditorTabs — Tab bar for open files in the IDE.
 * Shows file language icon, dirty-state dot, and close button.
 */

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileTab {
  id: string;
  name: string;
  content: string;
  language: "solidity" | "rust" | "javascript" | "json" | "text";
  isDirty: boolean;
}

const LANG_ICON: Record<FileTab["language"], string> = {
  solidity: "◈",
  rust: "🦀",
  javascript: "JS",
  json: "{}",
  text: "📄",
};

interface Props {
  tabs: FileTab[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export function EditorTabs({ tabs, activeId, onSelect, onClose }: Props) {
  return (
    <div className="ide-tabs flex items-end overflow-x-auto border-b border-white/8 shrink-0">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={cn(
              "group flex items-center gap-1.5 border-r border-white/8 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-[#0a0a0f] text-foreground border-t-2 border-t-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-white/4",
            )}
          >
            <span className="text-[11px] opacity-70">{LANG_ICON[tab.language]}</span>
            <span>{tab.name}</span>
            {tab.isDirty && (
              <span className="size-1.5 rounded-full bg-yellow-400 shrink-0" />
            )}
            <span
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
              role="button"
              aria-label={`Close ${tab.name}`}
              className="ml-0.5 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-opacity"
            >
              <X size={11} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
