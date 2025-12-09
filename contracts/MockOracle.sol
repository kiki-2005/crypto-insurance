// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockOracle
 * @dev Mock oracle for claim verification (simulates Chainlink)
 * Invariants:
 * - Only authorized operators can provide responses
 * - Each request gets unique ID and response
 * - Fallback mechanism for oracle failures
 */
contract MockOracle is Ownable {
    enum RequestStatus { Pending, Fulfilled, Failed }
    
    struct VerificationRequest {
        bytes32 id;
        bytes32 claimId;
        string evidence;
        address requester;
        uint256 timestamp;
        RequestStatus status;
        bool result;
    }
    
    mapping(bytes32 => VerificationRequest) public requests;
    mapping(address => bool) public authorizedOperators;
    bytes32[] public allRequests;
    
    uint256 public constant ORACLE_TIMEOUT = 1 hours;
    
    event VerificationRequested(bytes32 indexed requestId, bytes32 indexed claimId, string evidence);
    event VerificationFulfilled(bytes32 indexed requestId, bytes32 indexed claimId, bool result);
    event OperatorAuthorized(address indexed operator);
    event OperatorRevoked(address indexed operator);
    event OracleTimeout(bytes32 indexed requestId);
    
    modifier onlyAuthorizedOperator() {
        require(authorizedOperators[msg.sender], "Not authorized operator");
        _;
    }
    
    constructor() {
        authorizedOperators[msg.sender] = true;
    }
    
    /**
     * @dev Authorize oracle operator
     */
    function authorizeOperator(address operator) external onlyOwner {
        require(operator != address(0), "Invalid operator");
        authorizedOperators[operator] = true;
        emit OperatorAuthorized(operator);
    }
    
    /**
     * @dev Revoke operator authorization
     */
    function revokeOperator(address operator) external onlyOwner {
        authorizedOperators[operator] = false;
        emit OperatorRevoked(operator);
    }
    
    /**
     * @dev Request claim verification
     * @param claimId Claim identifier
     * @param evidence Evidence string/IPFS hash
     * Pre: Called by authorized claim manager
     * Post: Verification request created and pending
     */
    function requestVerification(bytes32 claimId, string memory evidence) external returns (bytes32) {
        bytes32 requestId = keccak256(abi.encodePacked(
            claimId,
            evidence,
            msg.sender,
            block.timestamp,
            block.number
        ));
        
        requests[requestId] = VerificationRequest({
            id: requestId,
            claimId: claimId,
            evidence: evidence,
            requester: msg.sender,
            timestamp: block.timestamp,
            status: RequestStatus.Pending,
            result: false
        });
        
        allRequests.push(requestId);
        
        emit VerificationRequested(requestId, claimId, evidence);
        return requestId;
    }
    
    /**
     * @dev Fulfill verification request
     * @param requestId Request identifier
     * @param result Verification result (true = valid claim)
     * Pre: Called by authorized operator, request exists and pending
     * Post: Request fulfilled, claim manager notified
     */
    function fulfillVerification(bytes32 requestId, bool result) external onlyAuthorizedOperator {
        VerificationRequest storage request = requests[requestId];
        require(request.id != bytes32(0), "Request does not exist");
        require(request.status == RequestStatus.Pending, "Request not pending");
        require(block.timestamp <= request.timestamp + ORACLE_TIMEOUT, "Request timed out");
        
        request.status = RequestStatus.Fulfilled;
        request.result = result;
        
        // Notify claim manager
        (bool success, ) = request.requester.call(
            abi.encodeWithSignature("processOracleResponse(bytes32,bool)", request.claimId, result)
        );
        
        if (!success) {
            request.status = RequestStatus.Failed;
        }
        
        emit VerificationFulfilled(requestId, request.claimId, result);
    }
    
    /**
     * @dev Handle oracle timeout (fallback mechanism)
     * @param requestId Request identifier
     * Pre: Request timed out
     * Post: Request marked as failed, default response sent
     */
    function handleTimeout(bytes32 requestId) external {
        VerificationRequest storage request = requests[requestId];
        require(request.id != bytes32(0), "Request does not exist");
        require(request.status == RequestStatus.Pending, "Request not pending");
        require(block.timestamp > request.timestamp + ORACLE_TIMEOUT, "Request not timed out");
        
        request.status = RequestStatus.Failed;
        
        // Send default rejection for timed out requests
        (bool success, ) = request.requester.call(
            abi.encodeWithSignature("processOracleResponse(bytes32,bool)", request.claimId, false)
        );
        
        emit OracleTimeout(requestId);
    }
    
    /**
     * @dev Simulate hack event verification (for demo)
     * @param requestId Request identifier
     * @param hackTxHash Transaction hash of alleged hack
     * Pre: Valid request and tx hash format
     * Post: Automated verification based on mock logic
     */
    function simulateHackVerification(bytes32 requestId, string memory hackTxHash) external onlyAuthorizedOperator {
        VerificationRequest storage request = requests[requestId];
        require(request.id != bytes32(0), "Request does not exist");
        require(request.status == RequestStatus.Pending, "Request not pending");
        require(bytes(hackTxHash).length > 0, "Invalid tx hash");
        
        // Mock verification logic: approve if evidence contains "hack" or specific patterns
        bool isValidClaim = _mockVerifyHack(request.evidence, hackTxHash);
        
        fulfillVerification(requestId, isValidClaim);
    }
    
    /**
     * @dev Mock hack verification logic
     */
    function _mockVerifyHack(string memory evidence, string memory txHash) internal pure returns (bool) {
        // Simple mock: approve if evidence contains "hack" keyword
        bytes memory evidenceBytes = bytes(evidence);
        bytes memory hackBytes = bytes("hack");
        
        if (evidenceBytes.length < hackBytes.length) return false;
        
        for (uint i = 0; i <= evidenceBytes.length - hackBytes.length; i++) {
            bool found = true;
            for (uint j = 0; j < hackBytes.length; j++) {
                if (evidenceBytes[i + j] != hackBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        
        return false;
    }
    
    /**
     * @dev Get request details
     */
    function getRequest(bytes32 requestId) external view returns (VerificationRequest memory) {
        return requests[requestId];
    }
    
    /**
     * @dev Get total requests count
     */
    function getTotalRequests() external view returns (uint256) {
        return allRequests.length;
    }
}