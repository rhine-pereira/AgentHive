// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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

interface ITaskEscrow {
    function postTask(string memory taskType, string memory title, uint8 complexity, uint256 deadline, uint8 mode) external payable returns (uint256);
}

contract AgentCoordinator is Ownable {
    struct MultiTask {
        uint256 rootTaskId;
        address poster;
        uint256 totalBounty;
        uint256[] subTaskIds;
        mapping(uint256 => uint256) payoutShares;
        bool isCompleted;
    }

    mapping(uint256 => MultiTask) public multiTasks;
    uint256 public nextMultiTaskId;

    address public escrowContract;

    event MultiTaskCreated(uint256 indexed multiTaskId, address indexed poster, uint256 totalBounty);
    event SubTaskAdded(uint256 indexed multiTaskId, uint256 indexed subTaskId, uint256 share);

    constructor(address _escrowContract) Ownable(msg.sender) {
        escrowContract = _escrowContract;
    }

    struct SubTaskParams {
        string taskType;
        string title;
        uint8 complexity;
        uint256 deadline;
        uint256 share;
    }
    
    function createMultiTask(SubTaskParams[] calldata params) external payable returns (uint256) {
        require(msg.value > 0, "Bounty required");
        
        uint256 totalShares = 0;
        for (uint i = 0; i < params.length; i++) {
            totalShares += params[i].share;
        }
        require(totalShares == 100, "Shares must total 100");

        uint256 multiTaskId = nextMultiTaskId++;
        MultiTask storage mt = multiTasks[multiTaskId];
        mt.rootTaskId = multiTaskId;
        mt.poster = msg.sender;
        mt.totalBounty = msg.value;
        mt.isCompleted = false;

        for (uint i = 0; i < params.length; i++) {
            _processSubTask(multiTaskId, params[i], msg.value);
        }

        emit MultiTaskCreated(multiTaskId, msg.sender, msg.value);
        return multiTaskId;
    }

    function _processSubTask(uint256 multiTaskId, SubTaskParams calldata param, uint256 msgValue) private {
        uint256 subBounty = (msgValue * param.share) / 100;
        
        uint256 subTaskId = ITaskEscrow(escrowContract).postTask{value: subBounty}(
            param.taskType,
            param.title,
            param.complexity,
            param.deadline,
            0 // WorkerMode.AgentOnly
        );

        MultiTask storage mt = multiTasks[multiTaskId];
        mt.subTaskIds.push(subTaskId);
        mt.payoutShares[subTaskId] = param.share;

        emit SubTaskAdded(multiTaskId, subTaskId, param.share);
    }
}