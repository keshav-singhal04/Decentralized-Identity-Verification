// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract IdentityVerification is Ownable {
    // Structs
    struct Identity {
        bytes32 identityHash;
        bool isRegistered;
        bool isVerified;
        bool isRevoked;
        uint256 revocationTimestamp;
        string revocationReason;
        address registeredBy;
        uint256 chainId;
    }

    // Mappings
    mapping(bytes32 => Identity) public identities;
    mapping(address => bool) public verifiers;
    mapping(uint256 => bool) public supportedChains;
    mapping(bytes32 => mapping(uint256 => bool)) public crossChainVerifications;

    // Events
    event IdentityRegistered(
        bytes32 indexed identityHash,
        address indexed registeredBy,
        uint256 chainId
    );
    event IdentityVerified(
        bytes32 indexed identityHash,
        address indexed verifiedBy,
        uint256 chainId
    );
    event IdentityRevoked(
        bytes32 indexed identityHash,
        address indexed revokedBy,
        string reason,
        uint256 timestamp
    );
    event CrossChainVerification(
        bytes32 indexed identityHash,
        uint256 fromChainId,
        uint256 toChainId
    );
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    event ChainSupported(uint256 chainId, bool supported);

    // Modifiers
    modifier onlyVerifier() {
        require(
            verifiers[msg.sender] || owner() == msg.sender,
            "Caller is not a verifier"
        );
        _;
    }

    modifier notRegistered(bytes32 _identityHash) {
        require(
            !identities[_identityHash].isRegistered,
            "Identity already registered"
        );
        _;
    }

    modifier notRevoked(bytes32 _identityHash) {
        require(
            !identities[_identityHash].isRevoked,
            "Identity is revoked"
        );
        _;
    }

    modifier chainSupported(uint256 _chainId) {
        require(
            supportedChains[_chainId],
            "Chain not supported"
        );
        _;
    }

    constructor() Ownable() {
        // Set contract deployer as the initial owner and verifier
        verifiers[msg.sender] = true;
        // Add current chain as supported
        supportedChains[block.chainid] = true;
        emit ChainSupported(block.chainid, true);
    }

    /**
     * @dev Registers a new identity hash
     * @param _identityHash Hash of the identity data
     */
    function registerIdentity(
        bytes32 _identityHash
    ) external notRegistered(_identityHash) {
        require(_identityHash != bytes32(0), "Identity hash cannot be empty");

        identities[_identityHash] = Identity({
            identityHash: _identityHash,
            isRegistered: true,
            isVerified: false,
            isRevoked: false,
            revocationTimestamp: 0,
            revocationReason: "",
            registeredBy: msg.sender,
            chainId: block.chainid
        });

        emit IdentityRegistered(_identityHash, msg.sender, block.chainid);
    }

    /**
     * @dev Verifies an identity hash
     * @param _identityHash Hash of the identity data to verify
     */
    function verifyIdentity(bytes32 _identityHash) external onlyVerifier notRevoked(_identityHash) {
        require(
            identities[_identityHash].isRegistered,
            "Identity not registered"
        );
        require(
            !identities[_identityHash].isVerified,
            "Identity already verified"
        );

        identities[_identityHash].isVerified = true;

        emit IdentityVerified(_identityHash, msg.sender, block.chainid);
    }

    /**
     * @dev Revokes an identity
     * @param _identityHash Hash of the identity to revoke
     * @param _reason Reason for revocation
     */
    function revokeIdentity(
        bytes32 _identityHash,
        string memory _reason
    ) external onlyVerifier {
        require(
            identities[_identityHash].isRegistered,
            "Identity not registered"
        );
        require(
            !identities[_identityHash].isRevoked,
            "Identity already revoked"
        );

        identities[_identityHash].isRevoked = true;
        identities[_identityHash].revocationTimestamp = block.timestamp;
        identities[_identityHash].revocationReason = _reason;

        emit IdentityRevoked(
            _identityHash,
            msg.sender,
            _reason,
            block.timestamp
        );
    }

    /**
     * @dev Verifies identity across chains
     * @param _identityHash Hash of the identity to verify
     * @param _fromChainId Source chain ID
     * @param _toChainId Target chain ID
     */
    function verifyCrossChain(
        bytes32 _identityHash,
        uint256 _fromChainId,
        uint256 _toChainId
    ) external onlyVerifier chainSupported(_fromChainId) chainSupported(_toChainId) {
        require(
            crossChainVerifications[_identityHash][_fromChainId],
            "Identity not verified on source chain"
        );
        require(
            !crossChainVerifications[_identityHash][_toChainId],
            "Identity already verified on target chain"
        );

        crossChainVerifications[_identityHash][_toChainId] = true;

        emit CrossChainVerification(_identityHash, _fromChainId, _toChainId);
    }

    /**
     * @dev Checks if an identity is registered and verified
     * @param _identityHash Hash of the identity data to check
     * @return isRegistered Whether the identity is registered
     * @return isVerified Whether the identity is verified
     * @return isRevoked Whether the identity is revoked
     * @return revocationTimestamp When the identity was revoked
     * @return revocationReason Why the identity was revoked
     */
    function checkIdentity(
        bytes32 _identityHash
    ) external view returns (
        bool isRegistered,
        bool isVerified,
        bool isRevoked,
        uint256 revocationTimestamp,
        string memory revocationReason
    ) {
        Identity memory identity = identities[_identityHash];
        return (
            identity.isRegistered,
            identity.isVerified,
            identity.isRevoked,
            identity.revocationTimestamp,
            identity.revocationReason
        );
    }

    /**
     * @dev Adds a new verifier
     * @param _verifier Address of the new verifier
     */
    function addVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid address");
        verifiers[_verifier] = true;
        emit VerifierAdded(_verifier);
    }

    /**
     * @dev Removes a verifier
     * @param _verifier Address of the verifier to remove
     */
    function removeVerifier(address _verifier) external onlyOwner {
        require(verifiers[_verifier], "Not a verifier");
        verifiers[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }

    /**
     * @dev Adds or removes support for a chain
     * @param _chainId Chain ID to update
     * @param _supported Whether the chain should be supported
     */
    function setChainSupport(uint256 _chainId, bool _supported) external onlyOwner {
        supportedChains[_chainId] = _supported;
        emit ChainSupported(_chainId, _supported);
    }
}