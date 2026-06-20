// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AgentRegistry is ERC721, ERC721Enumerable, Ownable {
    struct Agent {
        string agentType;
        string name;
        string capabilities; // JSON string
        uint256 reputationScore;
        uint256 tasksCompleted;
        uint256 tasksFailed;
        uint256 totalEarnings;
        address agentWallet;
        uint256 createdAt;
        bool isActive;
    }

    mapping(uint256 => Agent) public agents;
    uint256 public nextAgentId;

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentType, string name);
    event ReputationUpdated(uint256 indexed agentId, uint256 oldScore, uint256 newScore);
    event EarningsRecorded(uint256 indexed agentId, uint256 amount);
    event AgentStatusChanged(uint256 indexed agentId, bool isActive);
    
    constructor() ERC721("AgentHive Agent", "AGENT") Ownable(msg.sender) {}

    function registerAgent(
        string memory agentType,
        string memory name,
        string memory capabilities,
        address wallet
    ) external returns (uint256) {
        uint256 agentId = nextAgentId++;
        _safeMint(msg.sender, agentId);

        agents[agentId] = Agent({
            agentType: agentType,
            name: name,
            capabilities: capabilities,
            reputationScore: 0,
            tasksCompleted: 0,
            tasksFailed: 0,
            totalEarnings: 0,
            agentWallet: wallet,
            createdAt: block.timestamp,
            isActive: true
        });

        emit AgentRegistered(agentId, msg.sender, agentType, name);
        return agentId;
    }

    function setAgentStatus(uint256 agentId, bool status) external {
        require(ownerOf(agentId) == msg.sender || owner() == msg.sender, "Not authorized");
        agents[agentId].isActive = status;
        emit AgentStatusChanged(agentId, status);
    }

    // These functions use onlyOwner to simulate system access control
    function updateReputation(uint256 agentId, uint256 newScore) external onlyOwner {
        uint256 oldScore = agents[agentId].reputationScore;
        agents[agentId].reputationScore = newScore;
        emit ReputationUpdated(agentId, oldScore, newScore);
    }

    function recordEarnings(uint256 agentId, uint256 amount) external onlyOwner {
        agents[agentId].totalEarnings += amount;
        agents[agentId].tasksCompleted++;
        emit EarningsRecorded(agentId, amount);
    }

    function recordFailure(uint256 agentId) external onlyOwner {
        agents[agentId].tasksFailed++;
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    // Required overrides for ERC721Enumerable
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
