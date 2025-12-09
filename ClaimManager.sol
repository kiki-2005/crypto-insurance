// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PremiumPool.sol";
import "./Policy.sol";
import "./MockOracle.sol";
import "./MultiSigEscrow.sol";

/**
 * @title ClaimManager
 * @dev Manages insurance claim lifecycle with oracle verification
 * Invariants:
 * - Claims require valid policy and oracle verification
 * - High-value claims require multi-sig approval
 * - Claim amounts cannot exceed policy coverage
 */
contract ClaimManager is ReentrancyGuard, Ownable {
    enum ClaimStatus { Pending, Investigating, Approved, Rejected, Paid }
    
    struct Claim {
        bytes32 id;
        address claimant;
        address policyAddress;
        uint256 amount;
        string evidence;
        ClaimStatus status;
        uint256 submittedAt;
        uint256 processedAt;
        bool requiresMultiSig;
        address assignedOracle;
    }
    
    mapping(bytes32 => Claim) public claims;
    mapping(address => bytes32[]) public claimantClaims;
    bytes32[] public allClaims;
    
    PremiumPool public premiumPool;
    MockOracle public oracle;
    MultiSigEscrow public multiSigEscrow;
    
    uint256 public constant HIGH_VALUE_THRESHOLD = 10000 * 10**18; // 10k tokens
    uint256 public constant INVESTIGATION_PERIOD = 7 days;
    
    event ClaimSubmitted(bytes32 indexed claimId, address indexed claimant, uint256 amount);
    event ClaimStatusUpdated(bytes32 indexed claimId, ClaimStatus status);
    event ClaimPaid(bytes32 indexed claimId, address indexed claimant, uint256 amount);
    event OracleVerificationRequested(bytes32 indexed claimId, address indexed oracle);
    
    modifier validClaim(bytes32 claimId) {
        require(claims[claimId].id != bytes32(0), "Claim does not exist");
        _;
    }
    
    constructor(address _premiumPool, address _oracle, address _multiSigEscrow) {
        require(_premiumPool != address(0), "Invalid premium pool");
        require(_oracle != address(0), "Invalid oracle");
        require(_multiSigEscrow != address(0), "Invalid multisig escrow");
        
        premiumPool = PremiumPool(_premiumPool);
        oracle = MockOracle(_oracle);
        multiSigEscrow = MultiSigEscrow(_multiSigEscrow);
    }
    
    /**
     * @dev Submit insurance claim
     * @param policyAddress Address of policy contract
     * @param amount Claim amount
     * @param evidence IPFS hash or evidence string
     * Pre: Valid active policy, amount <= coverage
     * Post: Claim created and pending investigation
     */
    function submitClaim(
        address policyAddress,
        uint256 amount,
        string memory evidence
    ) external nonReentrant returns (bytes32) {
        require(policyAddress != address(0), "Invalid policy address");
        require(amount > 0, "Amount must be positive");
        require(bytes(evidence).length > 0, "Evidence required");
        
        Policy policy = Policy(policyAddress);
        require(policy.isPolicyActive(msg.sender), "Policy not active");
        
        uint256 coverage = policy.getCoverage(msg.sender);
        require(amount <= coverage, "Amount exceeds coverage");
        
        bytes32 claimId = keccak256(abi.encodePacked(
            msg.sender,
            policyAddress,
            amount,
            evidence,
            block.timestamp,
            block.number
        ));
        
        bool requiresMultiSig = amount >= HIGH_VALUE_THRESHOLD;
        
        claims[claimId] = Claim({
            id: claimId,
            claimant: msg.sender,
            policyAddress: policyAddress,
            amount: amount,
            evidence: evidence,
            status: ClaimStatus.Pending,
            submittedAt: block.timestamp,
            processedAt: 0,
            requiresMultiSig: requiresMultiSig,
            assignedOracle: address(oracle)
        });
        
        claimantClaims[msg.sender].push(claimId);
        allClaims.push(claimId);
        
        // Request oracle verification
        oracle.requestVerification(claimId, evidence);
        
        emit ClaimSubmitted(claimId, msg.sender, amount);
        emit OracleVerificationRequested(claimId, address(oracle));
        
        return claimId;
    }
    
    /**
     * @dev Process oracle response
     * @param claimId Claim identifier
     * @param isValid Oracle verification result
     * Pre: Called by authorized oracle
     * Post: Claim status updated based on verification
     */
    function processOracleResponse(bytes32 claimId, bool isValid) external validClaim(claimId) {
        require(msg.sender == address(oracle), "Only oracle can respond");
        require(claims[claimId].status == ClaimStatus.Pending, "Claim not pending");
        
        if (isValid) {
            claims[claimId].status = ClaimStatus.Investigating;
            
            // Auto-approve low-value claims after investigation period
            if (!claims[claimId].requiresMultiSig) {
                _approveClaim(claimId);
            }
        } else {
            claims[claimId].status = ClaimStatus.Rejected;
            claims[claimId].processedAt = block.timestamp;
        }
        
        emit ClaimStatusUpdated(claimId, claims[claimId].status);
    }
    
    /**
     * @dev Approve claim (internal or multi-sig)
     */
    function _approveClaim(bytes32 claimId) internal {
        claims[claimId].status = ClaimStatus.Approved;
        claims[claimId].processedAt = block.timestamp;
        
        // Initiate payout
        _processPayout(claimId);
    }
    
    /**
     * @dev Process claim payout
     */
    function _processPayout(bytes32 claimId) internal {
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.Approved, "Claim not approved");
        
        Policy policy = Policy(claim.policyAddress);
        address token = policy.policyInfo().premiumToken;
        
        // Check pool liquidity
        require(
            premiumPool.hasSufficientLiquidity(token, claim.amount),
            "Insufficient pool liquidity"
        );
        
        // Execute payout
        premiumPool.withdrawForClaim(token, claim.amount, claim.claimant, claimId);
        
        claim.status = ClaimStatus.Paid;
        emit ClaimPaid(claimId, claim.claimant, claim.amount);
    }
    
    /**
     * @dev Manual claim approval (owner only, for edge cases)
     */
    function manualApproveClaim(bytes32 claimId) external onlyOwner validClaim(claimId) {
        require(
            claims[claimId].status == ClaimStatus.Investigating ||
            claims[claimId].status == ClaimStatus.Pending,
            "Invalid claim status"
        );
        
        _approveClaim(claimId);
    }
    
    /**
     * @dev Reject claim
     */
    function rejectClaim(bytes32 claimId, string memory reason) external onlyOwner validClaim(claimId) {
        require(claims[claimId].status != ClaimStatus.Paid, "Cannot reject paid claim");
        
        claims[claimId].status = ClaimStatus.Rejected;
        claims[claimId].processedAt = block.timestamp;
        
        emit ClaimStatusUpdated(claimId, ClaimStatus.Rejected);
    }
    
    /**
     * @dev Get claim details
     */
    function getClaim(bytes32 claimId) external view returns (Claim memory) {
        return claims[claimId];
    }
    
    /**
     * @dev Get claims by claimant
     */
    function getClaimsByClaimant(address claimant) external view returns (bytes32[] memory) {
        return claimantClaims[claimant];
    }
    
    /**
     * @dev Get total claims count
     */
    function getTotalClaims() external view returns (uint256) {
        return allClaims.length;
    }
    
    /**
     * @dev Update oracle address
     */
    function updateOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        oracle = MockOracle(newOracle);
    }
}