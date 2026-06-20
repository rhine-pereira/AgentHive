"use client";

/**
 * Terminal — color-coded output console for the IDE.
 * Displays info / success / error / warning / command / address lines.
 */

import { useEffect, useRef } from "react";
import { Trash2, Terminal as TermIcon } from "lucide-react";

export type TerminalLineType =
  | "info"
  | "success"
  | "error"
  | "warning"
  | "command"
  | "address";

export interface TerminalLine {
  type: TerminalLineType;
  text: string;
  timestamp?: string;
}

const PREFIX: Record<TerminalLineType, string> = {
  command: "$",
  success: "✓",
  error: "✗",
  warning: "⚠",
  info: "›",
  address: "⬡",
};

const COLOR: Record<TerminalLineType, string> = {
  command: "#a5f3fc",   // cyan
  success: "#86efac",   // green
  error: "#fca5a5",     // red
  warning: "#fde68a",   // yellow
  info: "#cbd5e1",      // slate
  address: "#c4b5fd",   // lavender
};

interface Props {
  lines: TerminalLine[];
  onClear: () => void;
}

export function Terminal({ lines, onClear }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="ide-terminal flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <TermIcon size={13} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            Output
          </span>
          {lines.length > 0 && (
            <span className="text-[10px] text-muted-foreground/60">
              ({lines.length})
            </span>
          )}
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          aria-label="Clear terminal"
        >
          <Trash2 size={11} />
          Clear
        </button>
      </div>

      {/* Lines */}
      <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[12px] leading-[1.7]">
        {lines.length === 0 ? (
          <span className="text-muted-foreground/40">
            Ready — compile or deploy to see output here.
          </span>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="flex gap-2">
              <span style={{ color: COLOR[line.type], minWidth: "1rem" }}>
                {PREFIX[line.type]}
              </span>
              <span style={{ color: COLOR[line.type] }}>{line.text}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
