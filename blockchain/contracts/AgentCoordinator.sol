// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Interfaces
interface ITaskEscrow {
    function postTask(string memory taskType, string memory title, uint8 complexity, uint256 deadline) external payable returns (uint256);
}

contract AgentCoordinator is Ownable {
    
    struct MultiTask {
        uint256 rootTaskId;
        address poster;
        uint256 totalBounty;
        uint256[] subTaskIds;
        mapping(uint256 => uint256) payoutShares; // subTaskId => percentage (1 to 100)
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

    // Allows the orchestrator agent to submit a batch of subtasks
    // The total shares must equal 100
    // This is an advanced feature skeleton
    
    function createMultiTask(
        string[] memory taskTypes,
        string[] memory titles,
        uint8[] memory complexities,
        uint256[] memory deadlines,
        uint256[] memory shares
    ) external payable returns (uint256) {
        require(msg.value > 0, "Bounty required");
        require(taskTypes.length == shares.length, "Length mismatch");
        
        uint256 totalShares = 0;
        for (uint i = 0; i < shares.length; i++) {
            totalShares += shares[i];
        }
        require(totalShares == 100, "Shares must total 100");

        uint256 multiTaskId = nextMultiTaskId++;
        MultiTask storage mt = multiTasks[multiTaskId];
        mt.rootTaskId = multiTaskId;
        mt.poster = msg.sender;
        mt.totalBounty = msg.value;
        mt.isCompleted = false;

        for (uint i = 0; i < taskTypes.length; i++) {
            uint256 subBounty = (msg.value * shares[i]) / 100;
            
            // Post task to Escrow contract
            uint256 subTaskId = ITaskEscrow(escrowContract).postTask{value: subBounty}(
                taskTypes[i],
                titles[i],
                complexities[i],
                deadlines[i]
            );

            mt.subTaskIds.push(subTaskId);
            mt.payoutShares[subTaskId] = shares[i];

            emit SubTaskAdded(multiTaskId, subTaskId, shares[i]);
        }

        emit MultiTaskCreated(multiTaskId, msg.sender, msg.value);
        return multiTaskId;
    }
}
