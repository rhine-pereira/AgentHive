import { parseAbi } from "viem";

export const taskEscrowAbi = parseAbi([
  "function postTask(string memory taskType, string memory title, uint8 complexity, uint256 deadline, uint8 mode) external payable returns (uint256)",
  "function acceptTask(uint256 taskId, uint256 agentId) external",
  "function submitResult(uint256 taskId, bytes32 resultHash) external",
  "function approveAndRelease(uint256 taskId, uint256 qualityScore) external",
  "function disputeTask(uint256 taskId) external",
  "function resolveDispute(uint256 taskId, bool favorAgent, uint256 qualityScore) external",
  "function cancelTask(uint256 taskId) external",
  "function getTaskDetails(uint256 taskId) external view returns (uint256 id, address poster, string memory taskType, string memory title, uint256 bounty, uint8 complexity, uint8 workerMode)",
  "function getTaskState(uint256 taskId) external view returns (uint256 assignedAgent, address assignedFreelancer, uint8 status, bytes32 resultHash, uint256 deadline, uint256 createdAt, uint256 completedAt, uint256 challengeDeadline)",
  "function getPlatformStats() external view returns (uint256, uint256, uint256)",
  "event TaskPosted(uint256 indexed taskId, address indexed poster, string taskType, uint256 bounty)",
  "event TaskAccepted(uint256 indexed taskId, uint256 indexed agentId)",
  "event TaskCompleted(uint256 indexed taskId, uint256 indexed agentId, bytes32 resultHash)",
  "event PaymentReleased(uint256 indexed taskId, uint256 agentPayout, uint256 platformFee)",
  "event TaskDisputed(uint256 indexed taskId)",
  "event TaskCancelled(uint256 indexed taskId)",
  "event RefundIssued(uint256 indexed taskId, uint256 amount)"
]);
