import { parseAbi } from "viem";

export const reputationEngineAbi = parseAbi([
  "struct Reputation { uint256 completions; uint256 failures; uint256 totalScore; }",
  "function agentReputation(uint256 agentId) external view returns (uint256 completions, uint256 failures, uint256 totalScore)",
  "function recordCompletion(uint256 agentId, uint256 qualityScore) external",
  "function recordFailure(uint256 agentId) external"
]);
