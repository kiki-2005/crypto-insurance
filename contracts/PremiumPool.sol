// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PremiumPool
 * @dev Manages premium collection and claim payouts
 * Invariants:
 * - Total premiums >= total payouts
 * - Only authorized contracts can withdraw for claims
 * - Pool maintains liquidity for active policies
 */
contract PremiumPool is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    mapping(address => uint256) public tokenBalances;
    mapping(address => bool) public authorizedWithdrawers;
    
    uint256 public totalPremiumsCollected;
    uint256 public totalClaimsPaid;
    
    event PremiumDeposited(address indexed token, uint256 amount, address indexed from);
    event ClaimPaid(address indexed token, uint256 amount, address indexed to, bytes32 indexed claimId);
    event WithdrawerAuthorized(address indexed withdrawer);
    event WithdrawerRevoked(address indexed withdrawer);
    event EmergencyWithdraw(address indexed token, uint256 amount, address indexed to);
    
    modifier onlyAuthorizedWithdrawer() {
        require(authorizedWithdrawers[msg.sender], "Not authorized withdrawer");
        _;
    }
    
    constructor() {
        authorizedWithdrawers[msg.sender] = true;
    }
    
    /**
     * @dev Authorize address to withdraw for claims
     * @param withdrawer Address to authorize (typically ClaimManager)
     */
    function authorizeWithdrawer(address withdrawer) external onlyOwner {
        require(withdrawer != address(0), "Invalid withdrawer");
        authorizedWithdrawers[withdrawer] = true;
        emit WithdrawerAuthorized(withdrawer);
    }
    
    /**
     * @dev Revoke withdrawal authorization
     */
    function revokeWithdrawer(address withdrawer) external onlyOwner {
        authorizedWithdrawers[withdrawer] = false;
        emit WithdrawerRevoked(withdrawer);
    }
    
    /**
     * @dev Deposit premium to pool
     * @param token ERC20 token address
     * @param amount Amount to deposit
     * Pre: Token approved for transfer
     * Post: Premium added to pool balance
     */
    function depositPremium(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be positive");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        tokenBalances[token] += amount;
        totalPremiumsCollected += amount;
        
        emit PremiumDeposited(token, amount, msg.sender);
    }
    
    /**
     * @dev Withdraw for claim payout
     * @param token ERC20 token address
     * @param amount Amount to withdraw
     * @param to Recipient address
     * @param claimId Claim identifier
     * Pre: Sufficient balance, authorized withdrawer
     * Post: Claim paid, balance updated
     */
    function withdrawForClaim(
        address token,
        uint256 amount,
        address to,
        bytes32 claimId
    ) external onlyAuthorizedWithdrawer nonReentrant {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be positive");
        require(to != address(0), "Invalid recipient");
        require(tokenBalances[token] >= amount, "Insufficient pool balance");
        
        tokenBalances[token] -= amount;
        totalClaimsPaid += amount;
        
        IERC20(token).safeTransfer(to, amount);
        
        emit ClaimPaid(token, amount, to, claimId);
    }
    
    /**
     * @dev Get pool balance for token
     */
    function getBalance(address token) external view returns (uint256) {
        return tokenBalances[token];
    }
    
    /**
     * @dev Get pool utilization ratio (claims paid / premiums collected)
     */
    function getUtilizationRatio() external view returns (uint256) {
        if (totalPremiumsCollected == 0) return 0;
        return (totalClaimsPaid * 10000) / totalPremiumsCollected; // Basis points
    }
    
    /**
     * @dev Emergency withdraw (owner only, for contract upgrades)
     */
    function emergencyWithdraw(address token, uint256 amount, address to) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(to != address(0), "Invalid recipient");
        require(tokenBalances[token] >= amount, "Insufficient balance");
        
        tokenBalances[token] -= amount;
        IERC20(token).safeTransfer(to, amount);
        
        emit EmergencyWithdraw(token, amount, to);
    }
    
    /**
     * @dev Check if pool has sufficient liquidity for amount
     */
    function hasSufficientLiquidity(address token, uint256 amount) external view returns (bool) {
        return tokenBalances[token] >= amount;
    }
}