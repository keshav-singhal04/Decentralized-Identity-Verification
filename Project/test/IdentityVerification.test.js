const IdentityVerification = artifacts.require("IdentityVerification");
const { expectRevert } = require('@openzeppelin/test-helpers');

contract("IdentityVerification", accounts => {
  const [owner, user1, user2, verifier] = accounts;
  const mockIdentityHash = web3.utils.keccak256("TestUser123Document456");
  const mockIdentityHash2 = web3.utils.keccak256("AnotherUser789Document012");
  
  let identityContract;

  beforeEach(async () => {
    // Deploy a new contract before each test
    identityContract = await IdentityVerification.new({ from: owner });
  });

  describe("Verifier Management", () => {
    it("should set the deployer as owner and verifier", async () => {
      const isVerifier = await identityContract.verifiers(owner);
      assert.equal(isVerifier, true, "Owner should be a verifier");
    });

    it("should allow owner to add a verifier", async () => {
      await identityContract.addVerifier(verifier, { from: owner });
      const isVerifier = await identityContract.verifiers(verifier);
      assert.equal(isVerifier, true, "Verifier should be added");
    });

    it("should allow owner to remove a verifier", async () => {
      await identityContract.addVerifier(verifier, { from: owner });
      await identityContract.removeVerifier(verifier, { from: owner });
      const isVerifier = await identityContract.verifiers(verifier);
      assert.equal(isVerifier, false, "Verifier should be removed");
    });

    it("should prevent non-owners from adding verifiers", async () => {
      await expectRevert(
        identityContract.addVerifier(verifier, { from: user1 }),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("Identity Registration", () => {
    it("should allow a user to register an identity", async () => {
      await identityContract.registerIdentity(mockIdentityHash, { from: user1 });
      
      const identity = await identityContract.identities(mockIdentityHash);
      assert.equal(identity.isRegistered, true, "Identity should be registered");
      assert.equal(identity.isVerified, false, "Identity should not be verified yet");
      assert.equal(identity.registeredBy, user1, "Registered by should be user1");
    });

    it("should prevent duplicate registrations", async () => {
      await identityContract.registerIdentity(mockIdentityHash, { from: user1 });
      
      await expectRevert(
        identityContract.registerIdentity(mockIdentityHash, { from: user2 }),
        "Identity already registered"
      );
    });

    it("should reject empty identity hashes", async () => {
      await expectRevert(
        identityContract.registerIdentity("0x0000000000000000000000000000000000000000000000000000000000000000", { from: user1 }),
        "Identity hash cannot be empty"
      );
    });
  });

  describe("Identity Verification", () => {
    beforeEach(async () => {
      // Register identities before testing verification
      await identityContract.registerIdentity(mockIdentityHash, { from: user1 });
      await identityContract.registerIdentity(mockIdentityHash2, { from: user2 });
      
      // Add verifier
      await identityContract.addVerifier(verifier, { from: owner });
    });

    it("should allow verifiers to verify identities", async () => {
      await identityContract.verifyIdentity(mockIdentityHash, { from: verifier });
      
      const identity = await identityContract.identities(mockIdentityHash);
      assert.equal(identity.isVerified, true, "Identity should be verified");
    });

    it("should allow owner to verify identities", async () => {
      await identityContract.verifyIdentity(mockIdentityHash, { from: owner });
      
      const identity = await identityContract.identities(mockIdentityHash);
      assert.equal(identity.isVerified, true, "Identity should be verified");
    });

    it("should prevent non-verifiers from verifying identities", async () => {
      await expectRevert(
        identityContract.verifyIdentity(mockIdentityHash, { from: user1 }),
        "Caller is not a verifier"
      );
    });

    it("should prevent verifying unregistered identities", async () => {
      const unregisteredHash = web3.utils.keccak256("Unregistered");
      
      await expectRevert(
        identityContract.verifyIdentity(unregisteredHash, { from: verifier }),
        "Identity not registered"
      );
    });

    it("should prevent verifying already verified identities", async () => {
      await identityContract.verifyIdentity(mockIdentityHash, { from: verifier });
      
      await expectRevert(
        identityContract.verifyIdentity(mockIdentityHash, { from: verifier }),
        "Identity already verified"
      );
    });
  });

  describe("Identity Checking", () => {
    beforeEach(async () => {
      // Register and verify an identity
      await identityContract.registerIdentity(mockIdentityHash, { from: user1 });
      await identityContract.verifyIdentity(mockIdentityHash, { from: owner });
    });

    it("should return correct status for registered and verified identity", async () => {
      const [isRegistered, isVerified] = await identityContract.checkIdentity(mockIdentityHash);
      
      assert.equal(isRegistered, true, "Identity should be registered");
      assert.equal(isVerified, true, "Identity should be verified");
    });

    it("should return correct status for unregistered identity", async () => {
      const unregisteredHash = web3.utils.keccak256("Unregistered");
      const [isRegistered, isVerified] = await identityContract.checkIdentity(unregisteredHash);
      
      assert.equal(isRegistered, false, "Identity should not be registered");
      assert.equal(isVerified, false, "Identity should not be verified");
    });
  });
});