import { agentRegistryAbi } from "./abi/agent-registry";
import { taskEscrowAbi } from "./abi/task-escrow";
import { reputationEngineAbi } from "./abi/reputation-engine";
import { Address } from "viem";

export const AGENT_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_AGENT_REGISTRY || "0x7EF2e0048f5bAeDe046f6BF797943daF4ED8CB47") as Address;
export const TASK_ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_TASK_ESCROW || "0x0fC5025C764cE34df352757e82f7B5c4Df39A836") as Address;
export const REPUTATION_ENGINE_ADDRESS = (process.env.NEXT_PUBLIC_REPUTATION_ENGINE || "0xDA0bab807633f07f013f94DD0E6A4F96F8742B53") as Address;

export const contracts = {
  agentRegistry: {
    address: AGENT_REGISTRY_ADDRESS,
    abi: agentRegistryAbi,
  },
  taskEscrow: {
    address: TASK_ESCROW_ADDRESS,
    abi: taskEscrowAbi,
  },
  reputationEngine: {
    address: REPUTATION_ENGINE_ADDRESS,
    abi: reputationEngineAbi,
  },
};
