// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Policy.sol";

/**
 * @title PolicyFactory
 * @dev Factory contract for creating insurance policies
 * Invariants:
 * - Only authorized insurers can create policies
 * - Each policy has unique ID and valid parameters
 * - Policy creation emits events for off-chain indexing
 */
contract PolicyFactory is Ownable, ReentrancyGuard {
    uint256 public policyCounter;
    mapping(uint256 => address) public policies;
    mapping(address => bool) public authorizedInsurers;
    
    event PolicyCreated(
        uint256 indexed policyId,
        address indexed policyAddress,
        address indexed insurer,
        string policyType,
        uint256 premium,
        uint256 coverage
    );
    
    event InsurerAuthorized(address indexed insurer);
    event InsurerRevoked(address indexed insurer);
    
    modifier onlyAuthorizedInsurer() {
        require(authorizedInsurers[msg.sender], "Not authorized insurer");
        _;
    }
    
    constructor() {
        authorizedInsurers[msg.sender] = true;
    }
    
    /**
     * @dev Authorize an insurer to create policies
     * @param insurer Address to authorize
     * Pre: Only owner can authorize
     * Post: Insurer is authorized to create policies
     */
    function authorizeInsurer(address insurer) external onlyOwner {
        require(insurer != address(0), "Invalid insurer address");
        authorizedInsurers[insurer] = true;
        emit InsurerAuthorized(insurer);
    }
    
    /**
     * @dev Revoke insurer authorization
     * @param insurer Address to revoke
     */
    function revokeInsurer(address insurer) external onlyOwner {
        authorizedInsurers[insurer] = false;
        emit InsurerRevoked(insurer);
    }
    
    /**
     * @dev Create a new insurance policy
     * @param policyType Type of policy (e.g., "DEFI_HACK", "EXCHANGE_HACK")
     * @param premium Premium amount in wei
     * @param coverage Coverage amount in wei
     * @param duration Policy duration in seconds
     * @param premiumToken ERC20 token for premium payments
     * Pre: Caller is authorized insurer, valid parameters
     * Post: New policy contract deployed and registered
     */
    function createPolicy(
        string memory policyType,
        uint256 premium,
        uint256 coverage,
        uint256 duration,
        address premiumToken
    ) external onlyAuthorizedInsurer nonReentrant returns (address) {
        require(bytes(policyType).length > 0, "Invalid policy type");
        require(premium > 0, "Premium must be positive");
        require(coverage > premium, "Coverage must exceed premium");
        require(duration > 0, "Duration must be positive");
        require(premiumToken != address(0), "Invalid token address");
        
        policyCounter++;
        
        Policy newPolicy = new Policy(
            policyCounter,
            msg.sender,
            policyType,
            premium,
            coverage,
            duration,
            premiumToken
        );
        
        address policyAddress = address(newPolicy);
        policies[policyCounter] = policyAddress;
        
        emit PolicyCreated(
            policyCounter,
            policyAddress,
            msg.sender,
            policyType,
            premium,
            coverage
        );
        
        return policyAddress;
    }
    
    /**
     * @dev Get policy address by ID
     */
    function getPolicy(uint256 policyId) external view returns (address) {
        return policies[policyId];
    }
    
    /**
     * @dev Get total number of policies created
     */
    function getTotalPolicies() external view returns (uint256) {
        return policyCounter;
    }
}