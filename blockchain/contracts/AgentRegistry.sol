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

contract AgentRegistry is Ownable {
    struct Agent {
        uint256 agentId;
        string agentType;
        string name;
        string capabilities;
        address agentWallet;
        uint256 totalEarnings;
        uint256 totalFailures;
    }

    mapping(uint256 => Agent) public agents;
    mapping(uint256 => address) public ownerOf;
    uint256 public nextAgentId;
    mapping(address => bool) public authorizedCallers;

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentType);

    constructor() Ownable(msg.sender) {}

    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender], "Not authorized");
        _;
    }

    function setAuthorizedCaller(address caller, bool status) external onlyOwner {
        authorizedCallers[caller] = status;
    }

    function registerAgent(
        string memory agentType,
        string memory name,
        string memory capabilities,
        address wallet
    ) external returns (uint256) {
        uint256 agentId = nextAgentId++;
        Agent storage a = agents[agentId];
        a.agentId = agentId;
        a.agentType = agentType;
        a.name = name;
        a.capabilities = capabilities;
        a.agentWallet = wallet;
        ownerOf[agentId] = msg.sender;
        emit AgentRegistered(agentId, msg.sender, agentType);
        return agentId;
    }

    function recordEarnings(uint256 agentId, uint256 amount) external onlyAuthorized {
        agents[agentId].totalEarnings += amount;
    }

    function recordFailure(uint256 agentId) external onlyAuthorized {
        agents[agentId].totalFailures++;
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    function getAgentWallet(uint256 agentId) external view returns (address) {
        return agents[agentId].agentWallet;
    }
}