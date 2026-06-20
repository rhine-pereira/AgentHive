"use client";

/**
 * /ide/dashboard — Contract deployment history & saved IDE projects.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Code2,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  FolderOpen,
  Rocket,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { CHAIN_CONFIGS, type ChainKey } from "@/lib/wagmi-config";
import { cn } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://agent-hive-ld3l.onrender.com";

// ── Types ─────────────────────────────────────────────────────────────────────
interface IdeProject {
  id: string;
  name: string;
  chain: string;
  language: string;
  user_wallet: string;
  created_at: string;
  updated_at: string;
}

interface IdeDeployment {
  id: string;
  contract_name: string;
  contract_address: string;
  tx_hash: string;
  chain: string;
  chain_id: number;
  deployed_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function chainColor(chain: string): string {
  const cfg = CHAIN_CONFIGS[chain as ChainKey];
  return cfg?.color ?? "#888";
}

function explorerLink(chain: string, address: string) {
  const cfg = CHAIN_CONFIGS[chain as ChainKey];
  return cfg ? `${cfg.explorer}/address/${address}` : "#";
}

function txLink(chain: string, hash: string) {
  const cfg = CHAIN_CONFIGS[chain as ChainKey];
  return cfg ? `${cfg.explorer}/tx/${hash}` : "#";
}

// ── Demo wallet for unauthenticated preview ───────────────────────────────────
const DEMO_WALLET = "0x0000000000000000000000000000000000000000";

// ── Component ─────────────────────────────────────────────────────────────────
export default function IdeDashboardPage() {
  const [tab, setTab] = useState<"projects" | "deployments">("deployments");
  const [projects, setProjects] = useState<IdeProject[]>([]);
  const [deployments, setDeployments] = useState<IdeDeployment[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingDeploys, setLoadingDeploys] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  // Fetch on mount
  useEffect(() => {
    fetchProjects();
    fetchDeployments();
  }, []);

  async function fetchProjects() {
    setLoadingProjects(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/ide/projects/user/${DEMO_WALLET}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects ?? []);
      }
    } catch {}
    setLoadingProjects(false);
  }

  async function fetchDeployments() {
    setLoadingDeploys(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/ide/deployments/user/${DEMO_WALLET}`);
      if (res.ok) {
        const data = await res.json();
        setDeployments(data.deployments ?? []);
      }
    } catch {}
    setLoadingDeploys(false);
  }

  async function deleteProject(id: string) {
    try {
      await fetch(`${BACKEND_URL}/api/ide/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {}
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/ide"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            Back to IDE
          </Link>
          <div className="w-px h-5 bg-border" />
          <Code2 size={16} className="text-primary" />
          <h1 className="font-heading text-base font-semibold">Smart Contract IDE</h1>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/ide"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Code2 size={12} />
              Open IDE
            </Link>
          </div>
        </div>
      </header>

      {/* Stats banner */}
      <div className="border-b border-border/40 bg-card/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border/40 px-4 sm:px-6 md:grid-cols-4">
          {[
            { label: "Projects", value: projects.length },
            { label: "Deployments", value: deployments.length },
            {
              label: "Networks",
              value: [...new Set(deployments.map((d) => d.chain))].length,
            },
            {
              label: "Latest deploy",
              value: deployments[0] ? timeAgo(deployments[0].deployed_at) : "—",
            },
          ].map((s) => (
            <div key={s.label} className="px-4 py-4 sm:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {s.label}
              </p>
              <p className="mt-1 font-heading text-xl font-semibold">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-border bg-card/40 p-1 w-fit">
          {(["deployments", "projects"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "deployments" ? <Rocket size={13} /> : <FolderOpen size={13} />}
              {t}
            </button>
          ))}
        </div>

        {/* ── Deployments Tab ─────────────────────────────────────── */}
        {tab === "deployments" && (
          <div>
            {loadingDeploys ? (
              <LoadingSpinner />
            ) : deployments.length === 0 ? (
              <EmptyState
                icon={<Rocket size={28} className="text-muted-foreground/30" />}
                title="No deployments yet"
                description="Deploy a compiled contract from the IDE to see it here."
                actionHref="/ide"
                actionLabel="Go to IDE"
              />
            ) : (
              <div className="flex flex-col gap-3">
                {deployments.map((d) => {
                  const chainCfg = CHAIN_CONFIGS[d.chain as ChainKey];
                  return (
                    <div
                      key={d.id}
                      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-4 hover:border-primary/30 transition-colors"
                    >
                      {/* Chain dot + name */}
                      <div className="flex items-center gap-2 shrink-0 w-36">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: chainColor(d.chain) }}
                        />
                        <span className="text-xs font-medium text-muted-foreground truncate">
                          {chainCfg?.name ?? d.chain}
                        </span>
                      </div>

                      {/* Contract name */}
                      <div className="min-w-0 flex-1">
                        <p className="font-heading text-sm font-semibold">{d.contract_name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground truncate">
                          {d.contract_address}
                        </p>
                      </div>

                      {/* Time */}
                      <span className="shrink-0 text-xs text-muted-foreground/60">
                        {timeAgo(d.deployed_at)}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => copy(d.contract_address, `addr-${d.id}`)}
                          className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                          title="Copy address"
                        >
                          {copied === `addr-${d.id}` ? (
                            <Check size={11} />
                          ) : (
                            <Copy size={11} />
                          )}
                          Copy
                        </button>
                        <a
                          href={explorerLink(d.chain, d.contract_address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                        >
                          <ExternalLink size={11} />
                          Explorer
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Projects Tab ─────────────────────────────────────────── */}
        {tab === "projects" && (
          <div>
            {loadingProjects ? (
              <LoadingSpinner />
            ) : projects.length === 0 ? (
              <EmptyState
                icon={<FolderOpen size={28} className="text-muted-foreground/30" />}
                title="No saved projects"
                description='Save a project from the IDE using the "Save" button.'
                actionHref="/ide"
                actionLabel="Open IDE"
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => {
                  const chainCfg = CHAIN_CONFIGS[p.chain as ChainKey];
                  return (
                    <div
                      key={p.id}
                      className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
                    >
                      {/* Language badge */}
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            p.language === "solidity"
                              ? "bg-blue-500/15 text-blue-400"
                              : "bg-orange-500/15 text-orange-400",
                          )}
                        >
                          {p.language}
                        </span>
                        <button
                          onClick={() => deleteProject(p.id)}
                          className="rounded-lg p-1.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          aria-label="Delete project"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Name */}
                      <h3 className="font-heading text-base font-semibold leading-tight">
                        {p.name}
                      </h3>

                      {/* Chain + time */}
                      <div className="flex items-center gap-2 mt-auto">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: chainColor(p.chain) }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {chainCfg?.name ?? p.chain}
                        </span>
                        <span className="ml-auto text-[11px] text-muted-foreground/50">
                          {timeAgo(p.updated_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={24} className="animate-spin text-muted-foreground/40" />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
      {icon}
      <div>
        <p className="font-heading text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Link
        href={actionHref}
        className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
      >
        <Code2 size={13} />
        {actionLabel}
      </Link>
    </div>
  );
}
