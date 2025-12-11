// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

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
    
    modifier onlyAuthorizedOperator() {
        require(authorizedOperators[msg.sender], "Not authorized operator");
        _;
    }
    
    constructor() {
        authorizedOperators[msg.sender] = true;
    }
    
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
    
    function fulfillVerification(bytes32 requestId, bool result) external onlyAuthorizedOperator {
        VerificationRequest storage request = requests[requestId];
        require(request.id != bytes32(0), "Request does not exist");
        require(request.status == RequestStatus.Pending, "Request not pending");
        
        request.status = RequestStatus.Fulfilled;
        request.result = result;
        
        (bool success, ) = request.requester.call(
            abi.encodeWithSignature("processOracleResponse(bytes32,bool)", request.claimId, result)
        );
        
        if (!success) {
            request.status = RequestStatus.Failed;
        }
        
        emit VerificationFulfilled(requestId, request.claimId, result);
    }
    
    function getRequest(bytes32 requestId) external view returns (VerificationRequest memory) {
        return requests[requestId];
    }
    
    function getTotalRequests() external view returns (uint256) {
        return allRequests.length;
    }
}