"use client";

import { useEffect } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { contracts } from "@/lib/contracts";
import { useTransactionToast } from "@/components/app/transaction-toast";
import { parseEther } from "viem";

function useContractWriteWithToast(contractConfig: { address: any; abi: any }, label: string) {
  const { writeContractAsync, isPending: isWriting, error: writeError } = useWriteContract();
  const { addToast, updateToast } = useTransactionToast();
  const publicClient = usePublicClient();

  const execute = async (functionName: string, args: any[], value?: string) => {
    try {
      console.log(`[Blockchain] Executing ${label} (${functionName}) with args:`, args, "value:", value);
      const hash = await writeContractAsync({
        ...contractConfig,
        functionName,
        args,
        value: value ? parseEther(value) : undefined,
      });
      console.log(`[Blockchain] Transaction submitted: ${hash}`);

      const toastId = addToast({
        hash,
        label,
        status: "pending",
      });

      if (publicClient) {
        // Wait for the transaction to be mined asynchronously without blocking the return immediately if we don't want to.
        // Actually, we SHOULD await it here so the caller knows it's confirmed.
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(`[Blockchain] Transaction confirmed: ${hash}`, receipt);
        updateToast(toastId, { status: "confirmed" });
      } else {
        updateToast(toastId, { status: "confirmed" }); // Fallback
      }

      return hash;
    } catch (e: any) {
      const msg = e.shortMessage || e.message || "Transaction failed";
      if (!msg.includes("User rejected") && !msg.includes("Failed to fetch")) {
        console.error(`[Blockchain] Write Error in ${label}:`, e);
      }
      addToast({
        label,
        status: "error",
        error: msg,
      });
      throw e;
    }
  };

  return {
    execute,
    isPending: isWriting,
    error: writeError,
  };
}

export function usePostTask() {
  return useContractWriteWithToast(contracts.taskEscrow, "Post Task");
}

export function useApproveTask() {
  return useContractWriteWithToast(contracts.taskEscrow, "Approve & Release Payment");
}

export function useCancelTask() {
  return useContractWriteWithToast(contracts.taskEscrow, "Cancel Task");
}

export function useDisputeTask() {
  return useContractWriteWithToast(contracts.taskEscrow, "Dispute Task");
}

export function useRegisterAgent() {
  return useContractWriteWithToast(contracts.agentRegistry, "Register Agent");
}
