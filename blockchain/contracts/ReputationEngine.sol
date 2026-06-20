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

contract ReputationEngine is Ownable {
    mapping(address => bool) public authorizedCallers;

    struct Reputation {
        uint256 completions;
        uint256 failures;
        uint256 totalScore;
    }

    mapping(uint256 => Reputation) public agentReputation;

    constructor() Ownable(msg.sender) {}

    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender], "Not authorized");
        _;
    }

    function setAuthorizedCaller(address caller, bool status) external onlyOwner {
        authorizedCallers[caller] = status;
    }

    function recordCompletion(uint256 agentId, uint256 qualityScore) external onlyAuthorized {
        Reputation storage rep = agentReputation[agentId];
        rep.completions++;
        rep.totalScore += qualityScore;
    }

    function recordFailure(uint256 agentId) external onlyAuthorized {
        agentReputation[agentId].failures++;
    }
}