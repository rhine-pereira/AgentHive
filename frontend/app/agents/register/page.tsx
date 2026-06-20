"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, User, ArrowRight, Loader2, ShieldCheck, Cpu } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/auth-provider";
import { useRegisterAgent } from "@/hooks/useBlockchain";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/app/connect-wallet";
import { createClient } from "@/lib/supabase";

const agentTypes = ["AuditBot", "ContentBot", "CodeReviewBot", "DataScraper", "Custom"];

export default function RegisterAgentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isConnected, address } = useAccount();
  const { execute: registerAgent, isPending: isRegistering } = useRegisterAgent();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in.");
      return;
    }
    if (!isConnected || !address) {
      setError("You must connect your wallet first.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const form = new FormData(e.currentTarget);
      const name = form.get("name") as string;
      const type = form.get("type") as string;
      const caps = form.get("capabilities") as string;
      const feeStr = form.get("fee") as string;

      // 1. On-chain registration (Mints NFT)
      // wait, fee isn't needed for registerAgent on-chain?
      // ABI: registerAgent(string memory agentType, string memory name, string memory capabilities, address wallet)
      const txHash = await registerAgent("registerAgent", [type, name, caps, address]);

      // 2. Off-chain Supabase tracking
      const supabase = createClient();
      await supabase.from("agents").insert({
        owner_id: user.id,
        name,
        type,
        capabilities: caps.split(",").map(s => s.trim()).filter(Boolean),
        hourly_rate: Number(feeStr),
        wallet_address: address,
        nft_tx_hash: txHash,
        status: "active",
      });

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Register an Agent</h1>
        <p className="mt-2 text-muted-foreground">
          Deploy an autonomous AI agent to the network. Registration mints an ERC-721 NFT proving ownership.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">On-chain Identity</p>
                <p className="text-xs text-muted-foreground">Requires Monad Testnet wallet</p>
              </div>
            </div>
            <ConnectWallet />
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Nexus Auditor v2" />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="type">Agent Type</Label>
                <select
                  id="type"
                  name="type"
                  className="h-11 rounded-xl border border-input bg-secondary/40 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {agentTypes.map((t) => (
                    <option key={t} value={t} className="bg-card">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="capabilities">Capabilities (JSON or comma-separated)</Label>
              <Textarea
                id="capabilities"
                name="capabilities"
                required
                rows={4}
                placeholder="e.g. Python, Smart Contracts, Security Analysis"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="fee">Default Minimum Fee (MON)</Label>
              <Input id="fee" name="fee" type="number" step="0.01" min="0" required defaultValue="0.1" />
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full rounded-xl sm:w-auto" 
              disabled={submitting || isRegistering || !isConnected}
            >
              {submitting || isRegistering ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Minting Identity...
                </>
              ) : (
                <>
                  <Cpu className="mr-2 size-4" />
                  Register Agent
                </>
              )}
            </Button>
            {!isConnected && (
              <p className="mt-2 text-center text-xs text-red-400 sm:text-left">
                Connect your wallet to register an agent.
              </p>
            )}
          </div>
        </Card>
      </form>
    </div>
  );
}
