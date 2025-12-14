import { expect } from "chai";
import { ethers } from "hardhat";
import { VlossomAccountFactory, VlossomAccount, MockEntryPoint } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("VlossomAccountFactory", function () {
  // Test accounts
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let guardian1: SignerWithAddress;
  let guardian2: SignerWithAddress;

  // Contracts
  let factory: VlossomAccountFactory;
  let mockEntryPoint: MockEntryPoint;

  // Test data
  const USER_ID_1 = ethers.id("user-123");
  const USER_ID_2 = ethers.id("user-456");

  async function deployFactoryFixture() {
    [owner, user1, user2, guardian1, guardian2] = await ethers.getSigners();

    // Deploy mock EntryPoint
    const MockEntryPointFactory = await ethers.getContractFactory("MockEntryPoint");
    mockEntryPoint = await MockEntryPointFactory.deploy();
    await mockEntryPoint.waitForDeployment();

    // Deploy factory with mock EntryPoint
    const FactoryContract = await ethers.getContractFactory("VlossomAccountFactory");
    factory = await FactoryContract.deploy(await mockEntryPoint.getAddress(), owner.address);
    await factory.waitForDeployment();

    return { factory, mockEntryPoint, owner, user1, user2, guardian1, guardian2 };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { factory, owner } = await loadFixture(deployFactoryFixture);
      expect(await factory.owner()).to.equal(owner.address);
    });

    it("Should set the correct EntryPoint", async function () {
      const { factory, mockEntryPoint } = await loadFixture(deployFactoryFixture);
      expect(await factory.entryPoint()).to.equal(await mockEntryPoint.getAddress());
    });

    it("Should deploy account implementation", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      const impl = await factory.accountImplementation();
      expect(impl).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("createAccount", function () {
    it("Should create account successfully", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      // Create account
      const tx = await factory.createAccount(USER_ID_1, user1.address);
      await tx.wait();

      // Verify account was created
      const accountAddress = await factory.getAccountByUserId(USER_ID_1);
      expect(accountAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should emit AccountCreated event", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      // Create account and check event
      await expect(factory.createAccount(USER_ID_1, user1.address))
        .to.emit(factory, "AccountCreated");
    });

    it("Should be idempotent - return existing account", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      // Create account first time
      await factory.createAccount(USER_ID_1, user1.address);
      const firstAddress = await factory.getAccountByUserId(USER_ID_1);

      // Create again with same userId
      await factory.createAccount(USER_ID_1, user1.address);
      const secondAddress = await factory.getAccountByUserId(USER_ID_1);

      expect(firstAddress).to.equal(secondAddress);
    });

    it("Should revert if owner is zero address", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      await expect(factory.createAccount(USER_ID_1, ethers.ZeroAddress)).to.be.revertedWithCustomError(
        factory,
        "InvalidOwner"
      );
    });

    it("Should create different accounts for different userIds", async function () {
      const { factory, user1, user2 } = await loadFixture(deployFactoryFixture);

      await factory.createAccount(USER_ID_1, user1.address);
      await factory.createAccount(USER_ID_2, user2.address);

      const account1 = await factory.getAccountByUserId(USER_ID_1);
      const account2 = await factory.getAccountByUserId(USER_ID_2);

      expect(account1).to.not.equal(account2);
    });

    it("Should set correct owner on created account", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      await factory.createAccount(USER_ID_1, user1.address);
      const accountAddress = await factory.getAccountByUserId(USER_ID_1);

      const account = await ethers.getContractAt("VlossomAccount", accountAddress);
      expect(await account.owner()).to.equal(user1.address);
    });
  });

  describe("getAddress", function () {
    it("Should return counterfactual address before deployment", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      const address = await factory.getAddress(USER_ID_1, user1.address);
      expect(address).to.not.equal(ethers.ZeroAddress);
    });

    it("Should return same address before and after deployment", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      const addressBefore = await factory.getAddress(USER_ID_1, user1.address);
      await factory.createAccount(USER_ID_1, user1.address);
      const addressAfter = await factory.getAddress(USER_ID_1, user1.address);

      expect(addressBefore).to.equal(addressAfter);
    });

    it("Should return different addresses for different userIds", async function () {
      const { factory, user1, user2 } = await loadFixture(deployFactoryFixture);

      // Deploy both accounts first
      await factory.createAccount(USER_ID_1, user1.address);
      await factory.createAccount(USER_ID_2, user2.address);

      // Verify they're at different addresses
      const address1 = await factory.getAccountByUserId(USER_ID_1);
      const address2 = await factory.getAccountByUserId(USER_ID_2);

      expect(address1).to.not.equal(address2);
    });
  });

  describe("accountOf", function () {
    it("Should return zero address for unknown owner", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);
      expect(await factory.accountOf(user1.address)).to.equal(ethers.ZeroAddress);
    });

    it("Should return account address after creation", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      await factory.createAccount(USER_ID_1, user1.address);
      const accountAddress = await factory.getAccountByUserId(USER_ID_1);

      expect(await factory.accountOf(user1.address)).to.equal(accountAddress);
    });
  });

  describe("getAccountByUserId", function () {
    it("Should return zero address for non-existent userId", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      expect(await factory.getAccountByUserId(USER_ID_1)).to.equal(ethers.ZeroAddress);
    });

    it("Should return account address after creation", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);

      await factory.createAccount(USER_ID_1, user1.address);
      const accountAddress = await factory.getAccountByUserId(USER_ID_1);

      // Verify it's a valid address
      expect(accountAddress).to.not.equal(ethers.ZeroAddress);

      // Verify the account is a valid VlossomAccount
      const account = await ethers.getContractAt("VlossomAccount", accountAddress);
      expect(await account.owner()).to.equal(user1.address);
    });
  });
});

describe("VlossomAccount", function () {
  // Test accounts
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let guardian1: SignerWithAddress;
  let guardian2: SignerWithAddress;
  let guardian3: SignerWithAddress;
  let guardian4: SignerWithAddress;
  let guardian5: SignerWithAddress;
  let guardian6: SignerWithAddress;
  let otherUser: SignerWithAddress;

  // Contracts
  let factory: VlossomAccountFactory;
  let account: VlossomAccount;
  let mockEntryPoint: MockEntryPoint;

  // Test data
  const USER_ID = ethers.id("user-account-test");

  async function deployAccountFixture() {
    [owner, user1, guardian1, guardian2, guardian3, guardian4, guardian5, guardian6, otherUser] =
      await ethers.getSigners();

    // Deploy mock EntryPoint
    const MockEntryPointFactory = await ethers.getContractFactory("MockEntryPoint");
    mockEntryPoint = await MockEntryPointFactory.deploy();
    await mockEntryPoint.waitForDeployment();

    // Deploy factory with mock EntryPoint
    const FactoryContract = await ethers.getContractFactory("VlossomAccountFactory");
    factory = await FactoryContract.deploy(await mockEntryPoint.getAddress(), owner.address);
    await factory.waitForDeployment();

    // Create account
    await factory.createAccount(USER_ID, user1.address);
    const accountAddress = await factory.getAccountByUserId(USER_ID);
    account = await ethers.getContractAt("VlossomAccount", accountAddress);

    return { factory, account, mockEntryPoint, owner, user1, guardian1, guardian2, guardian3, guardian4, guardian5, guardian6, otherUser };
  }

  describe("Initialization", function () {
    it("Should set correct owner", async function () {
      const { account, user1 } = await loadFixture(deployAccountFixture);
      expect(await account.owner()).to.equal(user1.address);
    });

    it("Should set correct EntryPoint", async function () {
      const { account, mockEntryPoint } = await loadFixture(deployAccountFixture);
      expect(await account.entryPoint()).to.equal(await mockEntryPoint.getAddress());
    });

    it("Should have zero guardians initially", async function () {
      const { account } = await loadFixture(deployAccountFixture);
      expect(await account.getGuardianCount()).to.equal(0);
    });
  });

  describe("Guardian Management", function () {
    it("Should allow owner to add guardian", async function () {
      const { account, user1, guardian1 } = await loadFixture(deployAccountFixture);

      await expect(account.connect(user1).addGuardian(guardian1.address))
        .to.emit(account, "GuardianAdded")
        .withArgs(guardian1.address);

      expect(await account.isGuardian(guardian1.address)).to.be.true;
      expect(await account.getGuardianCount()).to.equal(1);
    });

    it("Should allow adding up to MAX_GUARDIANS (5)", async function () {
      const { account, user1, guardian1, guardian2, guardian3, guardian4, guardian5 } =
        await loadFixture(deployAccountFixture);

      await account.connect(user1).addGuardian(guardian1.address);
      await account.connect(user1).addGuardian(guardian2.address);
      await account.connect(user1).addGuardian(guardian3.address);
      await account.connect(user1).addGuardian(guardian4.address);
      await account.connect(user1).addGuardian(guardian5.address);

      expect(await account.getGuardianCount()).to.equal(5);
    });

    it("Should revert when adding more than MAX_GUARDIANS", async function () {
      const { account, user1, guardian1, guardian2, guardian3, guardian4, guardian5, guardian6 } =
        await loadFixture(deployAccountFixture);

      await account.connect(user1).addGuardian(guardian1.address);
      await account.connect(user1).addGuardian(guardian2.address);
      await account.connect(user1).addGuardian(guardian3.address);
      await account.connect(user1).addGuardian(guardian4.address);
      await account.connect(user1).addGuardian(guardian5.address);

      await expect(account.connect(user1).addGuardian(guardian6.address)).to.be.revertedWithCustomError(
        account,
        "MaxGuardiansReached"
      );
    });

    it("Should revert when adding zero address as guardian", async function () {
      const { account, user1 } = await loadFixture(deployAccountFixture);

      await expect(account.connect(user1).addGuardian(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        account,
        "InvalidGuardian"
      );
    });

    it("Should revert when adding owner as guardian", async function () {
      const { account, user1 } = await loadFixture(deployAccountFixture);

      await expect(account.connect(user1).addGuardian(user1.address)).to.be.revertedWithCustomError(
        account,
        "InvalidGuardian"
      );
    });

    it("Should revert when adding duplicate guardian", async function () {
      const { account, user1, guardian1 } = await loadFixture(deployAccountFixture);

      await account.connect(user1).addGuardian(guardian1.address);

      await expect(account.connect(user1).addGuardian(guardian1.address)).to.be.revertedWithCustomError(
        account,
        "GuardianAlreadyExists"
      );
    });

    it("Should revert when non-owner tries to add guardian", async function () {
      const { account, guardian1, otherUser } = await loadFixture(deployAccountFixture);

      await expect(account.connect(otherUser).addGuardian(guardian1.address)).to.be.revertedWithCustomError(
        account,
        "NotOwner"
      );
    });

    it("Should allow owner to remove guardian", async function () {
      const { account, user1, guardian1 } = await loadFixture(deployAccountFixture);

      await account.connect(user1).addGuardian(guardian1.address);

      await expect(account.connect(user1).removeGuardian(guardian1.address))
        .to.emit(account, "GuardianRemoved")
        .withArgs(guardian1.address);

      expect(await account.isGuardian(guardian1.address)).to.be.false;
      expect(await account.getGuardianCount()).to.equal(0);
    });

    it("Should revert when removing non-existent guardian", async function () {
      const { account, user1, guardian1 } = await loadFixture(deployAccountFixture);

      await expect(account.connect(user1).removeGuardian(guardian1.address)).to.be.revertedWithCustomError(
        account,
        "GuardianNotFound"
      );
    });

    it("Should revert when non-owner tries to remove guardian", async function () {
      const { account, user1, guardian1, otherUser } = await loadFixture(deployAccountFixture);

      await account.connect(user1).addGuardian(guardian1.address);

      await expect(account.connect(otherUser).removeGuardian(guardian1.address)).to.be.revertedWithCustomError(
        account,
        "NotOwner"
      );
    });
  });

  describe("Receive ETH", function () {
    it("Should accept ETH transfers", async function () {
      const { account, user1 } = await loadFixture(deployAccountFixture);

      const amount = ethers.parseEther("1.0");
      await user1.sendTransaction({
        to: await account.getAddress(),
        value: amount,
      });

      expect(await ethers.provider.getBalance(await account.getAddress())).to.equal(amount);
    });
  });

  describe("Execute", function () {
    it("Should allow owner to execute transaction", async function () {
      const { account, user1, otherUser } = await loadFixture(deployAccountFixture);

      // Fund the account
      const amount = ethers.parseEther("1.0");
      await user1.sendTransaction({
        to: await account.getAddress(),
        value: amount,
      });

      const sendAmount = ethers.parseEther("0.5");
      const balanceBefore = await ethers.provider.getBalance(otherUser.address);

      // Execute ETH transfer
      await account.connect(user1).execute(otherUser.address, sendAmount, "0x");

      const balanceAfter = await ethers.provider.getBalance(otherUser.address);
      expect(balanceAfter - balanceBefore).to.equal(sendAmount);
    });

    it("Should revert when non-owner/non-entrypoint calls execute", async function () {
      const { account, otherUser } = await loadFixture(deployAccountFixture);

      await expect(
        account.connect(otherUser).execute(otherUser.address, 0, "0x")
      ).to.be.revertedWithCustomError(account, "NotEntryPointOrOwner");
    });
  });

  describe("Execute Batch", function () {
    it("Should allow owner to execute batch transaction", async function () {
      const { account, user1, guardian1, guardian2 } = await loadFixture(deployAccountFixture);

      // Fund the account
      const amount = ethers.parseEther("2.0");
      await user1.sendTransaction({
        to: await account.getAddress(),
        value: amount,
      });

      const sendAmount = ethers.parseEther("0.5");
      const balanceBefore1 = await ethers.provider.getBalance(guardian1.address);
      const balanceBefore2 = await ethers.provider.getBalance(guardian2.address);

      // Execute batch ETH transfer
      await account.connect(user1).executeBatch(
        [guardian1.address, guardian2.address],
        [sendAmount, sendAmount],
        ["0x", "0x"]
      );

      const balanceAfter1 = await ethers.provider.getBalance(guardian1.address);
      const balanceAfter2 = await ethers.provider.getBalance(guardian2.address);

      expect(balanceAfter1 - balanceBefore1).to.equal(sendAmount);
      expect(balanceAfter2 - balanceBefore2).to.equal(sendAmount);
    });

    it("Should allow batch with empty value array (zero values)", async function () {
      const { account, user1, guardian1, guardian2 } = await loadFixture(deployAccountFixture);

      // Execute batch with empty value array (all zero values)
      await account.connect(user1).executeBatch(
        [guardian1.address, guardian2.address],
        [],
        ["0x", "0x"]
      );
    });

    it("Should revert on array length mismatch", async function () {
      const { account, user1, guardian1, guardian2 } = await loadFixture(deployAccountFixture);

      // Mismatched array lengths
      await expect(
        account.connect(user1).executeBatch(
          [guardian1.address, guardian2.address],
          [ethers.parseEther("0.1")], // Only one value
          ["0x", "0x"]
        )
      ).to.be.reverted;
    });

    it("Should revert when non-owner/non-entrypoint calls executeBatch", async function () {
      const { account, otherUser, guardian1 } = await loadFixture(deployAccountFixture);

      await expect(
        account.connect(otherUser).executeBatch([guardian1.address], [], ["0x"])
      ).to.be.revertedWithCustomError(account, "NotEntryPointOrOwner");
    });
  });
});
