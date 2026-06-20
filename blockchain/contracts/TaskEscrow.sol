// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;
    constructor() {
        _status = NOT_ENTERED;
    }
    modifier nonReentrant() {
        require(_status != ENTERED, "ReentrancyGuard: reentrant call");
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }
}

abstract contract Ownable {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    constructor(address initialOwner) {
        _owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }
    modifier onlyOwner() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }
    function owner() public view virtual returns (address) {
        return _owner;
    }
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

interface IAgentRegistry {
    function getAgentWallet(uint256 agentId) external view returns (address);
    function recordEarnings(uint256 agentId, uint256 amount) external;
    function recordFailure(uint256 agentId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IReputationEngine {
    function recordCompletion(uint256 agentId, uint256 qualityScore) external;
    function recordFailure(uint256 agentId) external;
}

contract TaskEscrow is ReentrancyGuard, Ownable {
    enum TaskStatus { Open, InProgress, Completed, Verified, Disputed, Cancelled, Expired }
    enum Complexity { Simple, Standard, Complex, Expert }
    enum WorkerMode { AgentOnly, FreelancerOnly, Mixed }
    
    struct Task {
        uint256 taskId;
        address poster;
        string taskType;
        string title;
        uint256 bounty;
        uint256 assignedAgent;
        address assignedFreelancer;
        WorkerMode workerMode;
        TaskStatus status;
        Complexity complexity;
        bytes32 resultHash;
        uint256 deadline;
        uint256 createdAt;
        uint256 completedAt;
        uint256 challengeDeadline;
    }
    
    mapping(uint256 => Task) private tasks;
    uint256 public nextTaskId;
    
    uint256 public platformFeePercent = 2; // Default 2% fee
    uint256 public challengePeriod = 24 hours; // 24 hours to dispute
    address public feeCollector;
    
    IAgentRegistry public agentRegistry;
    IReputationEngine public reputationEngine;
    
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
        require(_newFee <= 5, "Fee too high"); 
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
        uint256 deadline,
        WorkerMode mode
    ) external payable returns (uint256) {
        require(msg.value > 0, "Bounty required");
        require(deadline > block.timestamp, "Invalid deadline");
        
        uint256 taskId = nextTaskId++;
        Task storage t = tasks[taskId];
        t.taskId = taskId;
        t.poster = msg.sender;
        t.taskType = taskType;
        t.title = title;
        t.bounty = msg.value;
        t.assignedAgent = 0;
        t.assignedFreelancer = address(0);
        t.workerMode = mode;
        t.status = TaskStatus.Open;
        t.complexity = complexity;
        t.resultHash = bytes32(0);
        t.deadline = deadline;
        t.createdAt = block.timestamp;
        t.completedAt = 0;
        t.challengeDeadline = 0;
        
        totalVolume += msg.value;
        emit TaskPosted(taskId, msg.sender, taskType, msg.value);
        return taskId;
    }
    
    function acceptTask(uint256 taskId, uint256 agentId) external {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Open, "Not open");
        require(block.timestamp < task.deadline, "Expired");
        
        if (task.workerMode == WorkerMode.AgentOnly) {
            require(agentRegistry.ownerOf(agentId) == msg.sender, "Not agent owner");
            task.assignedAgent = agentId;
        } else if (task.workerMode == WorkerMode.FreelancerOnly) {
            task.assignedFreelancer = msg.sender;
        } else if (task.workerMode == WorkerMode.Mixed) {
            task.assignedAgent = agentId;
            task.assignedFreelancer = msg.sender;
        }

        task.status = TaskStatus.InProgress;
        emit TaskAccepted(taskId, agentId);
    }
    
    function submitResult(uint256 taskId, bytes32 resultHash) external {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.InProgress, "Not in progress");
        
        if (task.workerMode == WorkerMode.AgentOnly) {
            require(agentRegistry.ownerOf(task.assignedAgent) == msg.sender, "Not agent owner");
        } else if (task.workerMode == WorkerMode.FreelancerOnly) {
            require(task.assignedFreelancer == msg.sender, "Not assigned freelancer");
        } else if (task.workerMode == WorkerMode.Mixed) {
            require(task.assignedFreelancer == msg.sender, "Not assigned freelancer");
        }
        
        task.resultHash = resultHash;
        task.status = TaskStatus.Completed;
        task.completedAt = block.timestamp;
        task.challengeDeadline = block.timestamp + challengePeriod;
        emit TaskCompleted(taskId, task.assignedAgent, resultHash);
    }
    
    function approveAndRelease(uint256 taskId, uint256 qualityScore) external nonReentrant {
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
        
        if (task.workerMode == WorkerMode.AgentOnly) {
            address agentWallet = agentRegistry.getAgentWallet(task.assignedAgent);
            agentRegistry.recordEarnings(task.assignedAgent, payout);
            reputationEngine.recordCompletion(task.assignedAgent, qualityScore);
            (bool payOk, ) = agentWallet.call{value: payout}("");
            require(payOk, "Payout failed");
        } else if (task.workerMode == WorkerMode.FreelancerOnly) {
            (bool payOk, ) = task.assignedFreelancer.call{value: payout}("");
            require(payOk, "Payout failed");
        } else if (task.workerMode == WorkerMode.Mixed) {
            uint256 halfPayout = payout / 2;
            address agentWallet = agentRegistry.getAgentWallet(task.assignedAgent);
            
            agentRegistry.recordEarnings(task.assignedAgent, halfPayout);
            reputationEngine.recordCompletion(task.assignedAgent, qualityScore);

            (bool payOk1, ) = agentWallet.call{value: halfPayout}("");
            require(payOk1, "Agent payout failed");
            
            (bool payOk2, ) = task.assignedFreelancer.call{value: payout - halfPayout}("");
            require(payOk2, "Freelancer payout failed");
        }

        (bool feeOk, ) = feeCollector.call{value: fee}("");
        require(feeOk, "Fee transfer failed");
        
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

    function resolveDispute(uint256 taskId, bool favorAgent, uint256 qualityScore) external onlyOwner nonReentrant {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Disputed, "Not disputed");

        if (favorAgent) {
            task.status = TaskStatus.Verified;
            uint256 fee = (task.bounty * platformFeePercent) / 100;
            uint256 payout = task.bounty - fee;
            
            if (task.workerMode == WorkerMode.AgentOnly) {
                address agentWallet = agentRegistry.getAgentWallet(task.assignedAgent);
                agentRegistry.recordEarnings(task.assignedAgent, payout);
                reputationEngine.recordCompletion(task.assignedAgent, qualityScore);
                (bool payOk, ) = agentWallet.call{value: payout}("");
                require(payOk, "Payout failed");
            } else if (task.workerMode == WorkerMode.FreelancerOnly) {
                (bool payOk, ) = task.assignedFreelancer.call{value: payout}("");
                require(payOk, "Payout failed");
            } else if (task.workerMode == WorkerMode.Mixed) {
                uint256 halfPayout = payout / 2;
                address agentWallet = agentRegistry.getAgentWallet(task.assignedAgent);
                
                agentRegistry.recordEarnings(task.assignedAgent, halfPayout);
                reputationEngine.recordCompletion(task.assignedAgent, qualityScore);

                (bool payOk1, ) = agentWallet.call{value: halfPayout}("");
                require(payOk1, "Agent payout failed");
                
                (bool payOk2, ) = task.assignedFreelancer.call{value: payout - halfPayout}("");
                require(payOk2, "Freelancer payout failed");
            }

            (bool feeOk, ) = feeCollector.call{value: fee}("");
            require(feeOk, "Fee transfer failed");

            emit PaymentReleased(taskId, payout, fee);
        } else {
            task.status = TaskStatus.Cancelled;
            if (task.workerMode != WorkerMode.FreelancerOnly) {
                reputationEngine.recordFailure(task.assignedAgent);
                agentRegistry.recordFailure(task.assignedAgent);
            }

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
            if (task.workerMode != WorkerMode.FreelancerOnly) {
                reputationEngine.recordFailure(task.assignedAgent);
                agentRegistry.recordFailure(task.assignedAgent);
            }
        }

        task.status = TaskStatus.Cancelled;
        (bool ok, ) = task.poster.call{value: task.bounty}("");
        require(ok, "Refund failed");
        emit TaskCancelled(taskId);
        emit RefundIssued(taskId, task.bounty);
    }
    
    function getTaskDetails(uint256 taskId) external view returns (
        uint256 id, address poster, string memory taskType, string memory title,
        uint256 bounty, Complexity complexity, WorkerMode mode
    ) {
        Task storage t = tasks[taskId];
        return (t.taskId, t.poster, t.taskType, t.title, t.bounty, t.complexity, t.workerMode);
    }
    
    function getTaskState(uint256 taskId) external view returns (
        uint256 assignedAgent, address assignedFreelancer, TaskStatus status,
        bytes32 resultHash, uint256 deadline, uint256 createdAt,
        uint256 completedAt, uint256 challengeDeadline
    ) {
        Task storage t = tasks[taskId];
        return (t.assignedAgent, t.assignedFreelancer, t.status, t.resultHash, t.deadline, t.createdAt, t.completedAt, t.challengeDeadline);
    }
    
    function getPlatformStats() external view returns (uint256, uint256, uint256) {
        return (nextTaskId, totalTasksCompleted, totalVolume);
    }
}