"use client";

/**
 * CompilePanel — Compile settings, version selector, and results display.
 */

import { useState } from "react";
import { Loader2, ChevronDown, Zap, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChainKey } from "@/lib/wagmi-config";
import { CHAIN_CONFIGS } from "@/lib/wagmi-config";
import type { TerminalLine } from "./Terminal";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

const SOLC_VERSIONS = ["0.8.24", "0.8.23", "0.8.20", "0.8.19", "0.8.17", "0.8.0", "0.7.6", "0.6.12"];

export interface CompiledContract {
  contract_name: string;
  abi: unknown[];
  bytecode: string;
  deployed_bytecode: string;
}

interface Props {
  sourceCode: string;
  selectedChain: ChainKey;
  onCompiled: (contracts: CompiledContract[]) => void;
  onTerminalLine: (line: TerminalLine) => void;
  onSwitchToDeployTab: () => void;
}

export function CompilePanel({ sourceCode, selectedChain, onCompiled, onTerminalLine, onSwitchToDeployTab }: Props) {
  const [solcVersion, setSolcVersion] = useState("0.8.24");
  const [optimize, setOptimize] = useState(true);
  const [optimizeRuns, setOptimizeRuns] = useState(200);
  const [compiling, setCompiling] = useState(false);
  const [results, setResults] = useState<CompiledContract[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [abiExpanded, setAbiExpanded] = useState<string | null>(null);

  const chain = CHAIN_CONFIGS[selectedChain];

  async function handleCompile() {
    if (!sourceCode.trim()) {
      onTerminalLine({ type: "error", text: "No source code to compile." });
      return;
    }

    setCompiling(true);
    setErrors([]);
    setWarnings([]);
    setResults([]);
    onTerminalLine({ type: "command", text: `solc ${solcVersion} — compiling…` });

    try {
      const res = await fetch(`${BACKEND_URL}/api/ide/compile/solidity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: sourceCode,
          compiler_version: solcVersion,
          optimize,
          optimize_runs: optimizeRuns,
        }),
      });

      const data = await res.json();

      if (data.errors?.length) {
        setErrors(data.errors);
        data.errors.forEach((e: string) => onTerminalLine({ type: "error", text: e }));
      }
      if (data.warnings?.length) {
        setWarnings(data.warnings);
        data.warnings.forEach((w: string) => onTerminalLine({ type: "warning", text: w }));
      }
      if (data.success && data.contracts?.length) {
        setResults(data.contracts);
        onCompiled(data.contracts);
        data.contracts.forEach((c: CompiledContract) =>
          onTerminalLine({ type: "success", text: `Compiled: ${c.contract_name}` })
        );
        onSwitchToDeployTab();
      } else if (!data.errors?.length) {
        onTerminalLine({ type: "warning", text: "Compilation produced no contracts." });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setErrors([msg]);
      onTerminalLine({ type: "error", text: msg });
    } finally {
      setCompiling(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Chain info */}
      <div className="rounded-lg border border-white/8 bg-white/3 p-3">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: chain.color }}
          />
          <span className="text-xs font-medium text-foreground">{chain.name}</span>
          <span
            className={cn(
              "ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
              chain.type === "evm"
                ? "bg-blue-500/15 text-blue-400"
                : "bg-purple-500/15 text-purple-400"
            )}
          >
            {chain.type}
          </span>
        </div>
      </div>

      {/* Compiler version */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Compiler Version
        </label>
        <div className="relative">
          <select
            value={solcVersion}
            onChange={(e) => setSolcVersion(e.target.value)}
            className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-8 text-xs text-foreground focus:border-primary/60 focus:outline-none"
          >
            {SOLC_VERSIONS.map((v) => (
              <option key={v} value={v}>
                solc {v}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Optimizer */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Optimizer
        </label>
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <span className="text-xs text-muted-foreground">Enable</span>
          <button
            onClick={() => setOptimize((v) => !v)}
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors",
              optimize ? "bg-primary" : "bg-white/15",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform",
                optimize && "translate-x-4",
              )}
            />
          </button>
        </div>
        {optimize && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Runs:</span>
            <input
              type="number"
              value={optimizeRuns}
              onChange={(e) => setOptimizeRuns(Number(e.target.value))}
              min={1}
              max={10000}
              className="w-24 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-foreground focus:border-primary/60 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Compile button */}
      <button
        onClick={handleCompile}
        disabled={compiling}
        className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
      >
        {compiling ? (
          <><Loader2 size={14} className="animate-spin" /> Compiling…</>
        ) : (
          <><Zap size={14} /> Compile</>
        )}
      </button>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/8 p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
            <AlertCircle size={13} /> Errors ({errors.length})
          </div>
          {errors.map((e, i) => (
            <p key={i} className="text-[11px] text-red-300/80 font-mono break-words">{e}</p>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/8 p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400">
            <Info size={13} /> Warnings ({warnings.length})
          </div>
          {warnings.map((w, i) => (
            <p key={i} className="text-[11px] text-yellow-300/80 font-mono break-words">{w}</p>
          ))}
        </div>
      )}

      {/* Compiled contracts */}
      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 size={13} /> Compiled ({results.length})
          </div>
          {results.map((c) => (
            <div key={c.contract_name} className="rounded-lg border border-emerald-500/20 bg-emerald-500/6">
              <button
                onClick={() => setAbiExpanded(abiExpanded === c.contract_name ? null : c.contract_name)}
                className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-emerald-300"
              >
                <span>{c.contract_name}</span>
                <ChevronDown
                  size={12}
                  className={cn("transition-transform", abiExpanded === c.contract_name && "rotate-180")}
                />
              </button>
              {abiExpanded === c.contract_name && (
                <div className="border-t border-emerald-500/10 px-3 pb-3 pt-2">
                  <p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">ABI</p>
                  <pre className="max-h-40 overflow-y-auto rounded bg-black/40 p-2 text-[10px] text-emerald-200/70">
                    {JSON.stringify(c.abi, null, 2)}
                  </pre>
                  <p className="mt-2 mb-1 text-[10px] text-muted-foreground uppercase tracking-wider">Bytecode (first 64 chars)</p>
                  <p className="break-all font-mono text-[10px] text-emerald-200/50">{c.bytecode.slice(0, 64)}…</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
