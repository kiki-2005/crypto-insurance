// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Policy
 * @dev Individual insurance policy contract
 * Invariants:
 * - Policy holders must pay premium to activate coverage
 * - Claims can only be submitted during active period
 * - Premium goes to pool, claims paid from pool
 */
contract Policy is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    struct PolicyInfo {
        uint256 id;
        address insurer;
        string policyType;
        uint256 premium;
        uint256 coverage;
        uint256 duration;
        address premiumToken;
        uint256 createdAt;
    }
    
    struct PolicyHolder {
        address holder;
        uint256 activatedAt;
        uint256 expiresAt;
        bool isActive;
        uint256 premiumPaid;
    }
    
    PolicyInfo public policyInfo;
    mapping(address => PolicyHolder) public policyHolders;
    address[] public holdersList;
    
    address public premiumPool;
    address public claimManager;
    
    event PolicyPurchased(address indexed holder, uint256 premium, uint256 expiresAt);
    event PolicyExpired(address indexed holder);
    
    modifier onlyActiveHolder() {
        require(policyHolders[msg.sender].isActive, "Policy not active");
        require(block.timestamp < policyHolders[msg.sender].expiresAt, "Policy expired");
        _;
    }
    
    modifier onlyClaimManager() {
        require(msg.sender == claimManager, "Only claim manager");
        _;
    }
    
    constructor(
        uint256 _id,
        address _insurer,
        string memory _policyType,
        uint256 _premium,
        uint256 _coverage,
        uint256 _duration,
        address _premiumToken
    ) {
        policyInfo = PolicyInfo({
            id: _id,
            insurer: _insurer,
            policyType: _policyType,
            premium: _premium,
            coverage: _coverage,
            duration: _duration,
            premiumToken: _premiumToken,
            createdAt: block.timestamp
        });
        
        _transferOwnership(_insurer);
    }
    
    /**
     * @dev Set premium pool address (called by factory after deployment)
     */
    function setPremiumPool(address _premiumPool) external onlyOwner {
        require(_premiumPool != address(0), "Invalid pool address");
        premiumPool = _premiumPool;
    }
    
    /**
     * @dev Set claim manager address
     */
    function setClaimManager(address _claimManager) external onlyOwner {
        require(_claimManager != address(0), "Invalid claim manager");
        claimManager = _claimManager;
    }
    
    /**
     * @dev Purchase policy by paying premium
     * Pre: Premium token approved, valid premium amount
     * Post: Policy activated for duration, premium transferred to pool
     */
    function purchasePolicy() external nonReentrant {
        require(!policyHolders[msg.sender].isActive, "Policy already active");
        require(premiumPool != address(0), "Premium pool not set");
        
        IERC20 token = IERC20(policyInfo.premiumToken);
        require(token.balanceOf(msg.sender) >= policyInfo.premium, "Insufficient balance");
        
        // Transfer premium to pool
        token.safeTransferFrom(msg.sender, premiumPool, policyInfo.premium);
        
        uint256 expiresAt = block.timestamp + policyInfo.duration;
        
        policyHolders[msg.sender] = PolicyHolder({
            holder: msg.sender,
            activatedAt: block.timestamp,
            expiresAt: expiresAt,
            isActive: true,
            premiumPaid: policyInfo.premium
        });
        
        holdersList.push(msg.sender);
        
        emit PolicyPurchased(msg.sender, policyInfo.premium, expiresAt);
    }
    
    /**
     * @dev Check if policy is active for holder
     */
    function isPolicyActive(address holder) external view returns (bool) {
        PolicyHolder memory ph = policyHolders[holder];
        return ph.isActive && block.timestamp < ph.expiresAt;
    }
    
    /**
     * @dev Get policy coverage for holder
     */
    function getCoverage(address holder) external view returns (uint256) {
        if (!this.isPolicyActive(holder)) {
            return 0;
        }
        return policyInfo.coverage;
    }
    
    /**
     * @dev Get number of active policy holders
     */
    function getActiveHoldersCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < holdersList.length; i++) {
            if (this.isPolicyActive(holdersList[i])) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev Expire policy (called by claim manager or holder)
     */
    function expirePolicy(address holder) external {
        require(
            msg.sender == holder || msg.sender == claimManager || msg.sender == owner(),
            "Not authorized"
        );
        require(policyHolders[holder].isActive, "Policy not active");
        
        policyHolders[holder].isActive = false;
        emit PolicyExpired(holder);
    }
}