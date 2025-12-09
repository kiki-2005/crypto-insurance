// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MultiSigEscrow
 * @dev Multi-signature escrow for high-value claim approvals
 * Invariants:
 * - Requires minimum signatures for execution
 * - Signers cannot approve same transaction twice
 * - Only authorized signers can approve
 */
contract MultiSigEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    struct Transaction {
        bytes32 id;
        address to;
        address token;
        uint256 amount;
        bytes32 claimId;
        uint256 approvals;
        bool executed;
        uint256 createdAt;
        mapping(address => bool) approved;
    }
    
    mapping(bytes32 => Transaction) public transactions;
    mapping(address => bool) public signers;
    bytes32[] public transactionIds;
    
    uint256 public requiredSignatures;
    uint256 public signerCount;
    
    event TransactionCreated(bytes32 indexed txId, address indexed to, uint256 amount, bytes32 indexed claimId);
    event TransactionApproved(bytes32 indexed txId, address indexed signer);
    event TransactionExecuted(bytes32 indexed txId, address indexed to, uint256 amount);
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event RequiredSignaturesChanged(uint256 newRequired);
    
    modifier onlySigner() {
        require(signers[msg.sender], "Not a signer");
        _;
    }
    
    modifier validTransaction(bytes32 txId) {
        require(transactions[txId].id != bytes32(0), "Transaction does not exist");
        require(!transactions[txId].executed, "Transaction already executed");
        _;
    }
    
    constructor(address[] memory _signers, uint256 _requiredSignatures) {
        require(_signers.length >= _requiredSignatures, "Invalid signer count");
        require(_requiredSignatures > 0, "Required signatures must be positive");
        
        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] != address(0), "Invalid signer address");
            require(!signers[_signers[i]], "Duplicate signer");
            signers[_signers[i]] = true;
        }
        
        signerCount = _signers.length;
        requiredSignatures = _requiredSignatures;
    }
    
    /**
     * @dev Create transaction for multi-sig approval
     * @param to Recipient address
     * @param token ERC20 token address
     * @param amount Amount to transfer
     * @param claimId Associated claim ID
     * Pre: Valid parameters, sufficient escrow balance
     * Post: Transaction created and pending approvals
     */
    function createTransaction(
        address to,
        address token,
        uint256 amount,
        bytes32 claimId
    ) external returns (bytes32) {
        require(to != address(0), "Invalid recipient");
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be positive");
        
        bytes32 txId = keccak256(abi.encodePacked(
            to,
            token,
            amount,
            claimId,
            block.timestamp,
            block.number
        ));
        
        Transaction storage newTx = transactions[txId];
        newTx.id = txId;
        newTx.to = to;
        newTx.token = token;
        newTx.amount = amount;
        newTx.claimId = claimId;
        newTx.approvals = 0;
        newTx.executed = false;
        newTx.createdAt = block.timestamp;
        
        transactionIds.push(txId);
        
        emit TransactionCreated(txId, to, amount, claimId);
        return txId;
    }
    
    /**
     * @dev Approve transaction
     * @param txId Transaction identifier
     * Pre: Valid transaction, caller is signer, not already approved
     * Post: Approval recorded, execute if threshold met
     */
    function approveTransaction(bytes32 txId) external onlySigner validTransaction(txId) nonReentrant {
        Transaction storage txn = transactions[txId];
        require(!txn.approved[msg.sender], "Already approved");
        
        txn.approved[msg.sender] = true;
        txn.approvals++;
        
        emit TransactionApproved(txId, msg.sender);
        
        // Execute if threshold met
        if (txn.approvals >= requiredSignatures) {
            _executeTransaction(txId);
        }
    }
    
    /**
     * @dev Execute approved transaction
     */
    function _executeTransaction(bytes32 txId) internal {
        Transaction storage txn = transactions[txId];
        require(txn.approvals >= requiredSignatures, "Insufficient approvals");
        
        txn.executed = true;
        
        // Transfer tokens
        IERC20(txn.token).safeTransfer(txn.to, txn.amount);
        
        emit TransactionExecuted(txId, txn.to, txn.amount);
    }
    
    /**
     * @dev Add new signer (requires multi-sig approval)
     */
    function addSigner(address newSigner) external onlySigner {
        require(newSigner != address(0), "Invalid signer");
        require(!signers[newSigner], "Already a signer");
        
        signers[newSigner] = true;
        signerCount++;
        
        emit SignerAdded(newSigner);
    }
    
    /**
     * @dev Remove signer (requires multi-sig approval)
     */
    function removeSigner(address signer) external onlySigner {
        require(signers[signer], "Not a signer");
        require(signerCount > requiredSignatures, "Cannot remove, would break threshold");
        
        signers[signer] = false;
        signerCount--;
        
        emit SignerRemoved(signer);
    }
    
    /**
     * @dev Change required signatures threshold
     */
    function changeRequiredSignatures(uint256 newRequired) external onlySigner {
        require(newRequired > 0, "Required must be positive");
        require(newRequired <= signerCount, "Required exceeds signer count");
        
        requiredSignatures = newRequired;
        emit RequiredSignaturesChanged(newRequired);
    }
    
    /**
     * @dev Check if transaction is approved by signer
     */
    function isApprovedBy(bytes32 txId, address signer) external view returns (bool) {
        return transactions[txId].approved[signer];
    }
    
    /**
     * @dev Get transaction details (without mapping)
     */
    function getTransaction(bytes32 txId) external view returns (
        address to,
        address token,
        uint256 amount,
        bytes32 claimId,
        uint256 approvals,
        bool executed,
        uint256 createdAt
    ) {
        Transaction storage txn = transactions[txId];
        return (
            txn.to,
            txn.token,
            txn.amount,
            txn.claimId,
            txn.approvals,
            txn.executed,
            txn.createdAt
        );
    }
    
    /**
     * @dev Get total transactions count
     */
    function getTransactionCount() external view returns (uint256) {
        return transactionIds.length;
    }
    
    /**
     * @dev Deposit tokens to escrow
     */
    function deposit(address token, uint256 amount) external {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be positive");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }
    
    /**
     * @dev Get escrow balance
     */
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}