// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract IdentityVerification {
    struct Identity {
        bytes32 identityHash;
        bool isRegistered;
        bool isVerified;
        bool isRevoked;
        uint256 revocationTimestamp;
        bytes32 revocationReason; // Changed from string to bytes32
        address registeredBy;
        uint256 chainId;
    }

    mapping(bytes32 => Identity) public identities;
    mapping(address => bool) public verifiers;
    mapping(uint256 => bool) public supportedChains;
    mapping(bytes32 => mapping(uint256 => bool)) public crossChainVerifications;

    address public owner;

    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    event IdentityRegistered(bytes32 indexed identityHash, address indexed registeredBy, uint256 chainId);
    event IdentityVerified(bytes32 indexed identityHash, address indexed verifiedBy);
    event IdentityRevoked(bytes32 indexed identityHash, bytes32 reason, address indexed revokedBy);
    event CrossChainVerification(bytes32 indexed identityHash, uint256 fromChainId, uint256 toChainId);
    event ChainSupported(uint256 chainId, bool supported);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyVerifier() {
        require(verifiers[msg.sender], "Not a verifier");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addVerifier(address _verifier) external onlyOwner {
        require(!verifiers[_verifier], "Already a verifier");
        verifiers[_verifier] = true;
        emit VerifierAdded(_verifier);
    }

    function removeVerifier(address _verifier) external onlyOwner {
        require(verifiers[_verifier], "Not a verifier");
        verifiers[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }

    function registerIdentity(bytes32 _identityHash) external {
        require(_identityHash != bytes32(0), "Identity hash cannot be empty");
        require(!identities[_identityHash].isRegistered, "Identity already registered");

        identities[_identityHash] = Identity({
            identityHash: _identityHash,
            isRegistered: true,
            isVerified: false,
            isRevoked: false,
            revocationTimestamp: 0,
            revocationReason: bytes32(0),
            registeredBy: msg.sender,
            chainId: block.chainid
        });

        emit IdentityRegistered(_identityHash, msg.sender, block.chainid);
    }

    // Batch registration function
    function batchRegisterIdentities(bytes32[] calldata _identityHashes) external {
        for (uint256 i = 0; i < _identityHashes.length; i++) {
            bytes32 hash = _identityHashes[i];
            require(hash != bytes32(0), "Identity hash cannot be empty");
            require(!identities[hash].isRegistered, "Identity already registered");

            identities[hash] = Identity({
                identityHash: hash,
                isRegistered: true,
                isVerified: false,
                isRevoked: false,
                revocationTimestamp: 0,
                revocationReason: bytes32(0),
                registeredBy: msg.sender,
                chainId: block.chainid
            });

            emit IdentityRegistered(hash, msg.sender, block.chainid);
        }
    }

    function verifyIdentity(bytes32 _identityHash) external onlyVerifier {
        require(identities[_identityHash].isRegistered, "Identity not registered");
        require(!identities[_identityHash].isVerified, "Identity already verified");
        require(!identities[_identityHash].isRevoked, "Identity is revoked");

        identities[_identityHash].isVerified = true;
        emit IdentityVerified(_identityHash, msg.sender);
    }

    // Batch verification function
    function batchVerifyIdentities(bytes32[] calldata _identityHashes) external onlyVerifier {
        for (uint256 i = 0; i < _identityHashes.length; i++) {
            bytes32 hash = _identityHashes[i];
            require(identities[hash].isRegistered, "Identity not registered");
            require(!identities[hash].isVerified, "Identity already verified");
            require(!identities[hash].isRevoked, "Identity is revoked");

            identities[hash].isVerified = true;
            emit IdentityVerified(hash, msg.sender);
        }
    }

    function revokeIdentity(bytes32 _identityHash, bytes32 _reason) external onlyVerifier {
        require(identities[_identityHash].isRegistered, "Identity not registered");
        require(!identities[_identityHash].isRevoked, "Identity already revoked");

        identities[_identityHash].isRevoked = true;
        identities[_identityHash].revocationTimestamp = block.timestamp;
        identities[_identityHash].revocationReason = _reason;

        emit IdentityRevoked(_identityHash, _reason, msg.sender);
    }

    // Batch revocation function
    function batchRevokeIdentities(bytes32[] calldata _identityHashes, bytes32 _reason) external onlyVerifier {
        for (uint256 i = 0; i < _identityHashes.length; i++) {
            bytes32 hash = _identityHashes[i];
            require(identities[hash].isRegistered, "Identity not registered");
            require(!identities[hash].isRevoked, "Identity already revoked");

            identities[hash].isRevoked = true;
            identities[hash].revocationTimestamp = block.timestamp;
            identities[hash].revocationReason = _reason;

            emit IdentityRevoked(hash, _reason, msg.sender);
        }
    }

    function verifyCrossChain(bytes32 _identityHash, uint256 _fromChainId, uint256 _toChainId) external onlyVerifier {
        require(identities[_identityHash].isRegistered, "Identity not registered");
        require(identities[_identityHash].isVerified, "Identity not verified on source chain");
        require(!crossChainVerifications[_identityHash][_toChainId], "Identity already verified on target chain");
        require(supportedChains[_fromChainId] && supportedChains[_toChainId], "Chain not supported");

        crossChainVerifications[_identityHash][_toChainId] = true;
        emit CrossChainVerification(_identityHash, _fromChainId, _toChainId);
    }

    // Batch cross-chain verification
    function batchVerifyCrossChain(
        bytes32[] calldata _identityHashes,
        uint256 _fromChainId,
        uint256 _toChainId
    ) external onlyVerifier {
        require(supportedChains[_fromChainId] && supportedChains[_toChainId], "Chain not supported");

        for (uint256 i = 0; i < _identityHashes.length; i++) {
            bytes32 hash = _identityHashes[i];
            require(identities[hash].isRegistered, "Identity not registered");
            require(identities[hash].isVerified, "Identity not verified on source chain");
            require(!crossChainVerifications[hash][_toChainId], "Identity already verified on target chain");

            crossChainVerifications[hash][_toChainId] = true;
            emit CrossChainVerification(hash, _fromChainId, _toChainId);
        }
    }

    function setChainSupport(uint256 _chainId, bool _supported) external onlyOwner {
        supportedChains[_chainId] = _supported;
        emit ChainSupported(_chainId, _supported);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        owner = _newOwner;
    }

    function renounceOwnership() external onlyOwner {
        owner = address(0);
    }
} 