// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Interfaces for interacting with the Registry and Reputation Engine
interface IAgentRegistry {
    function getAgent(uint256 agentId) external view returns (string memory, string memory, string memory, uint256, uint256, uint256, uint256, address, uint256, bool);
    function recordEarnings(uint256 agentId, uint256 amount) external;
    function recordFailure(uint256 agentId) external;
}

interface IReputationEngine {
    function recordCompletion(uint256 agentId, uint256 qualityScore) external;
    function recordFailure(uint256 agentId) external;
}

contract TaskEscrow is ReentrancyGuard, Ownable {
    enum TaskStatus { Open, InProgress, Completed, Verified, Disputed, Cancelled, Expired }
    enum Complexity { Simple, Standard, Complex, Expert }
    
    struct Task {
        uint256 taskId;
        address poster;
        string taskType;
        string title;
        uint256 bounty;
        uint256 assignedAgent;
        TaskStatus status;
        Complexity complexity;
        bytes32 resultHash;
        uint256 deadline;
        uint256 createdAt;
        uint256 completedAt;
        uint256 challengeDeadline;
    }
    
    mapping(uint256 => Task) public tasks;
    uint256 public nextTaskId;
    
    uint256 public platformFeePercent = 2; // Default 2% fee
    uint256 public challengePeriod = 24 hours; // 24 hours to dispute
    address public feeCollector;
    
    IAgentRegistry public agentRegistry;
    IReputationEngine public reputationEngine;
    
    // Global Stats
    uint256 public totalTasksCompleted;
    uint256 public totalVolume;
    
    event TaskPosted(uint256 indexed taskId, address indexed poster, string taskType, uint256 bounty);
    event TaskAccepted(uint256 indexed taskId, uint256 indexed agentId);
    event TaskCompleted(uint256 indexed taskId, uint256 indexed agentId, bytes32 resultHash);
    event PaymentReleased(uint256 indexed taskId, uint256 agentPayout, uint256 platformFee);
    event TaskDisputed(uint256 indexed taskId);
    event TaskCancelled(uint256 indexed taskId);
    event RefundIssued(uint256 indexed taskId, uint256 amount);
    
    constructor(address _feeCollector, address _agentRegistry, address _reputationEngine) Ownable(msg.sender) {
        feeCollector = _feeCollector;
        agentRegistry = IAgentRegistry(_agentRegistry);
        reputationEngine = IReputationEngine(_reputationEngine);
    }
    
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 5, "Fee too high"); // Max 5%
        platformFeePercent = _newFee;
    }

    function setFeeCollector(address _newCollector) external onlyOwner {
        require(_newCollector != address(0), "Invalid address");
        feeCollector = _newCollector;
    }
    
    function postTask(
        string memory taskType,
        string memory title,
        Complexity complexity,
        uint256 deadline
    ) external payable returns (uint256) {
        require(msg.value > 0, "Bounty required");
        require(deadline > block.timestamp, "Invalid deadline");
        
        uint256 taskId = nextTaskId++;
        tasks[taskId] = Task({
            taskId: taskId,
            poster: msg.sender,
            taskType: taskType,
            title: title,
            bounty: msg.value,
            assignedAgent: 0,
            status: TaskStatus.Open,
            complexity: complexity,
            resultHash: bytes32(0),
            deadline: deadline,
            createdAt: block.timestamp,
            completedAt: 0,
            challengeDeadline: 0
        });
        
        totalVolume += msg.value;
        emit TaskPosted(taskId, msg.sender, taskType, msg.value);
        return taskId;
    }
    
    function acceptTask(uint256 taskId, uint256 agentId) external {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Open, "Not open");
        require(block.timestamp < task.deadline, "Expired");
        
        // In a real system, we would verify msg.sender owns the agentId via AgentRegistry
        // e.g. require(ERC721(agentRegistry).ownerOf(agentId) == msg.sender, "Not agent owner");

        task.assignedAgent = agentId;
        task.status = TaskStatus.InProgress;
        emit TaskAccepted(taskId, agentId);
    }
    
    function submitResult(uint256 taskId, bytes32 resultHash) external {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.InProgress, "Not in progress");
        // Verify msg.sender is agent owner here
        
        task.resultHash = resultHash;
        task.status = TaskStatus.Completed;
        task.completedAt = block.timestamp;
        task.challengeDeadline = block.timestamp + challengePeriod;
        emit TaskCompleted(taskId, task.assignedAgent, resultHash);
    }
    
    function approveAndRelease(uint256 taskId, address agentWallet, uint256 qualityScore) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Completed, "Not completed");
        require(
            msg.sender == task.poster || block.timestamp > task.challengeDeadline,
            "Not authorized or challenge period active"
        );
        
        task.status = TaskStatus.Verified;
        totalTasksCompleted++;
        
        uint256 fee = (task.bounty * platformFeePercent) / 100;
        uint256 payout = task.bounty - fee;
        
        // Record Stats
        agentRegistry.recordEarnings(task.assignedAgent, payout);
        reputationEngine.recordCompletion(task.assignedAgent, qualityScore);

        // Payouts
        (bool feeOk, ) = feeCollector.call{value: fee}("");
        require(feeOk, "Fee transfer failed");
        
        (bool payOk, ) = agentWallet.call{value: payout}("");
        require(payOk, "Payout failed");
        
        emit PaymentReleased(taskId, payout, fee);
    }
    
    function disputeTask(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Completed, "Not completed");
        require(msg.sender == task.poster, "Only poster");
        require(block.timestamp <= task.challengeDeadline, "Window closed");
        task.status = TaskStatus.Disputed;
        emit TaskDisputed(taskId);
    }

    // Arbiter functions (for DAO/Admin)
    function resolveDispute(uint256 taskId, bool favorAgent, address agentWallet, uint256 qualityScore) external onlyOwner nonReentrant {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Disputed, "Not disputed");

        if (favorAgent) {
            task.status = TaskStatus.Verified;
            uint256 fee = (task.bounty * platformFeePercent) / 100;
            uint256 payout = task.bounty - fee;
            
            agentRegistry.recordEarnings(task.assignedAgent, payout);
            reputationEngine.recordCompletion(task.assignedAgent, qualityScore);

            (bool feeOk, ) = feeCollector.call{value: fee}("");
            require(feeOk, "Fee transfer failed");
            (bool payOk, ) = agentWallet.call{value: payout}("");
            require(payOk, "Payout failed");

            emit PaymentReleased(taskId, payout, fee);
        } else {
            task.status = TaskStatus.Cancelled;
            reputationEngine.recordFailure(task.assignedAgent);
            agentRegistry.recordFailure(task.assignedAgent);

            (bool ok, ) = task.poster.call{value: task.bounty}("");
            require(ok, "Refund failed");
            
            emit RefundIssued(taskId, task.bounty);
        }
    }
    
    function cancelTask(uint256 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Open || (task.status == TaskStatus.InProgress && block.timestamp > task.deadline), "Cannot cancel");
        require(msg.sender == task.poster, "Only poster");
        
        if (task.status == TaskStatus.InProgress) {
            // Agent failed to deliver on time
            reputationEngine.recordFailure(task.assignedAgent);
            agentRegistry.recordFailure(task.assignedAgent);
        }

        task.status = TaskStatus.Cancelled;
        (bool ok, ) = task.poster.call{value: task.bounty}("");
        require(ok, "Refund failed");
        emit TaskCancelled(taskId);
        emit RefundIssued(taskId, task.bounty);
    }
    
    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }
    
    function getPlatformStats() external view returns (uint256, uint256, uint256) {
        return (nextTaskId, totalTasksCompleted, totalVolume);
    }
}
