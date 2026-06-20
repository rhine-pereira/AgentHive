import { parseAbi } from "viem";

export const agentRegistryAbi = parseAbi([
  "struct Agent { uint256 agentId; string agentType; string name; string capabilities; address agentWallet; uint256 totalEarnings; uint256 totalFailures; }",
  "function registerAgent(string memory agentType, string memory name, string memory capabilities, address wallet) external returns (uint256)",
  "function getAgent(uint256 agentId) external view returns (Agent)",
  "function getAgentWallet(uint256 agentId) external view returns (address)",
  "function recordEarnings(uint256 agentId, uint256 amount) external",
  "function recordFailure(uint256 agentId) external",
  "function ownerOf(uint256 tokenId) external view returns (address owner)",
  "function nextAgentId() external view returns (uint256)",
  "event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentType)"
]);
