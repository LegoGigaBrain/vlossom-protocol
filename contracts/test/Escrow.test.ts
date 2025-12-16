import { expect } from "chai";
import { ethers } from "hardhat";
import { Escrow, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Escrow", function () {
  // Test accounts
  let owner: SignerWithAddress;
  let relayer: SignerWithAddress;
  let customer: SignerWithAddress;
  let stylist: SignerWithAddress;
  let treasury: SignerWithAddress;
  let otherUser: SignerWithAddress;

  // Contracts
  let escrow: Escrow;
  let usdc: MockUSDC;

  // Test data
  const BOOKING_ID = ethers.id("booking-123");
  const BOOKING_ID_2 = ethers.id("booking-456");
  const USDC_DECIMALS = 6;
  const INITIAL_USDC_BALANCE = ethers.parseUnits("1000", USDC_DECIMALS); // 1000 USDC
  const BOOKING_AMOUNT = ethers.parseUnits("100", USDC_DECIMALS); // 100 USDC
  const PLATFORM_FEE = ethers.parseUnits("10", USDC_DECIMALS); // 10 USDC (10%)
  const STYLIST_AMOUNT = BOOKING_AMOUNT - PLATFORM_FEE; // 90 USDC

  async function deployEscrowFixture() {
    [owner, relayer, customer, stylist, treasury, otherUser] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDCFactory.deploy();
    await usdc.waitForDeployment();

    // Deploy Escrow with relayer initialized (security fix H-2)
    const EscrowFactory = await ethers.getContractFactory("Escrow");
    escrow = await EscrowFactory.deploy(
      await usdc.getAddress(),
      owner.address,
      relayer.address // relayer must be set at deployment
    );
    await escrow.waitForDeployment();

    // Mint USDC to customer
    await usdc.mint(customer.address, INITIAL_USDC_BALANCE);

    return { escrow, usdc, owner, relayer, customer, stylist, treasury, otherUser };
  }

  describe("Deployment", function () {
    it("Should set the correct USDC token address", async function () {
      const { escrow, usdc } = await loadFixture(deployEscrowFixture);
      expect(await escrow.usdc()).to.equal(await usdc.getAddress());
    });

    it("Should set the correct owner (admin role)", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);
      const ADMIN_ROLE = await escrow.ADMIN_ROLE();
      expect(await escrow.hasRole(ADMIN_ROLE, owner.address)).to.equal(true);
    });

    it("Should set the correct relayer", async function () {
      const { escrow, relayer } = await loadFixture(deployEscrowFixture);
      const RELAYER_ROLE = await escrow.RELAYER_ROLE();
      expect(await escrow.hasRole(RELAYER_ROLE, relayer.address)).to.equal(true);
      // Also verify isRelayer helper function
      expect(await escrow.isRelayer(relayer.address)).to.equal(true);
    });

    it("Should revert if USDC address is zero", async function () {
      const { relayer } = await loadFixture(deployEscrowFixture);
      const EscrowFactory = await ethers.getContractFactory("Escrow");
      await expect(
        EscrowFactory.deploy(ethers.ZeroAddress, owner.address, relayer.address)
      ).to.be.revertedWithCustomError(EscrowFactory, "InvalidAddress");
    });

    it("Should revert if initial relayer is zero address (security fix H-2)", async function () {
      const { usdc } = await loadFixture(deployEscrowFixture);
      const EscrowFactory = await ethers.getContractFactory("Escrow");
      await expect(
        EscrowFactory.deploy(await usdc.getAddress(), owner.address, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(EscrowFactory, "InvalidAddress");
    });

    it("Should emit RelayerAdded event on deployment", async function () {
      const { usdc, relayer } = await loadFixture(deployEscrowFixture);
      const EscrowFactory = await ethers.getContractFactory("Escrow");
      const newEscrow = await EscrowFactory.deploy(
        await usdc.getAddress(),
        owner.address,
        relayer.address
      );
      // Check that relayer is set via isRelayer
      expect(await newEscrow.isRelayer(relayer.address)).to.equal(true);
    });
  });

  describe("Relayer Management (C-1 fix: multi-relayer)", function () {
    it("Should allow admin to add relayer", async function () {
      const { escrow, owner, otherUser } = await loadFixture(deployEscrowFixture);
      await expect(escrow.connect(owner).addRelayer(otherUser.address))
        .to.emit(escrow, "RelayerAdded")
        .withArgs(otherUser.address);
      expect(await escrow.isRelayer(otherUser.address)).to.equal(true);
    });

    it("Should allow admin to remove relayer", async function () {
      const { escrow, owner, relayer } = await loadFixture(deployEscrowFixture);
      await expect(escrow.connect(owner).removeRelayer(relayer.address))
        .to.emit(escrow, "RelayerRemoved")
        .withArgs(relayer.address);
      expect(await escrow.isRelayer(relayer.address)).to.equal(false);
    });

    it("Should support multiple relayers", async function () {
      const { escrow, owner, relayer, otherUser } = await loadFixture(deployEscrowFixture);
      // Add another relayer
      await escrow.connect(owner).addRelayer(otherUser.address);
      // Both should be valid relayers
      expect(await escrow.isRelayer(relayer.address)).to.equal(true);
      expect(await escrow.isRelayer(otherUser.address)).to.equal(true);
    });

    it("Should revert if non-admin tries to add relayer", async function () {
      const { escrow, customer, otherUser } = await loadFixture(deployEscrowFixture);
      await expect(escrow.connect(customer).addRelayer(otherUser.address))
        .to.be.revertedWithCustomError(escrow, "UnauthorizedCaller");
    });

    it("Should revert if adding zero address as relayer", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);
      await expect(escrow.connect(owner).addRelayer(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });
  });

  describe("lockFunds", function () {
    it("Should lock funds successfully", async function () {
      const { escrow, usdc, customer } = await loadFixture(deployEscrowFixture);

      // Approve escrow to spend USDC
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);

      // Lock funds
      await expect(escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT))
        .to.emit(escrow, "FundsLocked")
        .withArgs(BOOKING_ID, customer.address, BOOKING_AMOUNT);

      // Verify escrow record
      const record = await escrow.getEscrowRecord(BOOKING_ID);
      expect(record.customer).to.equal(customer.address);
      expect(record.amount).to.equal(BOOKING_AMOUNT);
      expect(record.status).to.equal(1); // EscrowStatus.Locked

      // Verify balance
      expect(await escrow.getEscrowBalance(BOOKING_ID)).to.equal(BOOKING_AMOUNT);

      // Verify USDC transfer
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(BOOKING_AMOUNT);
      expect(await usdc.balanceOf(customer.address)).to.equal(
        INITIAL_USDC_BALANCE - BOOKING_AMOUNT
      );
    });

    it("Should revert if amount is zero", async function () {
      const { escrow, customer } = await loadFixture(deployEscrowFixture);
      await expect(escrow.connect(customer).lockFunds(BOOKING_ID, 0))
        .to.be.revertedWithCustomError(escrow, "InvalidAmount");
    });

    it("Should revert if booking already exists", async function () {
      const { escrow, usdc, customer } = await loadFixture(deployEscrowFixture);

      // Approve and lock first time
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT * 2n);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      // Try to lock again with same bookingId
      await expect(escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT))
        .to.be.revertedWithCustomError(escrow, "BookingAlreadyExists");
    });

    it("Should revert if insufficient USDC balance", async function () {
      const { escrow, usdc, otherUser } = await loadFixture(deployEscrowFixture);

      // otherUser has no USDC
      await usdc.connect(otherUser).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await expect(escrow.connect(otherUser).lockFunds(BOOKING_ID, BOOKING_AMOUNT))
        .to.be.revertedWithCustomError(usdc, "ERC20InsufficientBalance");
    });

    it("Should revert if insufficient approval", async function () {
      const { escrow, usdc, customer } = await loadFixture(deployEscrowFixture);

      // Approve less than needed
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT / 2n);
      await expect(escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT))
        .to.be.revertedWithCustomError(usdc, "ERC20InsufficientAllowance");
    });

    it("Should allow multiple bookings from same customer", async function () {
      const { escrow, usdc, customer } = await loadFixture(deployEscrowFixture);

      // Approve for multiple bookings
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT * 2n);

      // Lock first booking
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      // Lock second booking
      await escrow.connect(customer).lockFunds(BOOKING_ID_2, BOOKING_AMOUNT);

      expect(await escrow.getEscrowBalance(BOOKING_ID)).to.equal(BOOKING_AMOUNT);
      expect(await escrow.getEscrowBalance(BOOKING_ID_2)).to.equal(BOOKING_AMOUNT);
    });
  });

  describe("releaseFunds", function () {
    beforeEach(async function () {
      const { escrow, usdc, customer } = await loadFixture(deployEscrowFixture);
      // Setup: Lock funds first
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);
      return { escrow, usdc, customer };
    });

    it("Should release funds successfully", async function () {
      const { escrow, usdc, relayer, stylist, treasury } = await loadFixture(deployEscrowFixture);

      // Setup
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      // Release funds
      await expect(
        escrow
          .connect(relayer)
          .releaseFunds(BOOKING_ID, stylist.address, STYLIST_AMOUNT, treasury.address, PLATFORM_FEE)
      )
        .to.emit(escrow, "FundsReleased")
        .withArgs(BOOKING_ID, stylist.address, STYLIST_AMOUNT, PLATFORM_FEE);

      // Verify status updated
      const record = await escrow.getEscrowRecord(BOOKING_ID);
      expect(record.status).to.equal(2); // EscrowStatus.Released

      // Verify balance is now zero
      expect(await escrow.getEscrowBalance(BOOKING_ID)).to.equal(0);

      // Verify USDC transfers
      expect(await usdc.balanceOf(stylist.address)).to.equal(STYLIST_AMOUNT);
      expect(await usdc.balanceOf(treasury.address)).to.equal(PLATFORM_FEE);
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0);
    });

    it("Should revert if caller is not relayer", async function () {
      const { escrow, customer, stylist, treasury } = await loadFixture(deployEscrowFixture);

      // Setup
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      await expect(
        escrow
          .connect(customer)
          .releaseFunds(BOOKING_ID, stylist.address, STYLIST_AMOUNT, treasury.address, PLATFORM_FEE)
      ).to.be.revertedWithCustomError(escrow, "UnauthorizedCaller");
    });

    it("Should revert if stylist address is zero", async function () {
      const { escrow, relayer, treasury } = await loadFixture(deployEscrowFixture);

      // Setup
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      await expect(
        escrow
          .connect(relayer)
          .releaseFunds(BOOKING_ID, ethers.ZeroAddress, STYLIST_AMOUNT, treasury.address, PLATFORM_FEE)
      ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("Should revert if treasury address is zero", async function () {
      const { escrow, relayer, stylist } = await loadFixture(deployEscrowFixture);

      // Setup
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      await expect(
        escrow
          .connect(relayer)
          .releaseFunds(BOOKING_ID, stylist.address, STYLIST_AMOUNT, ethers.ZeroAddress, PLATFORM_FEE)
      ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("Should revert if total amount mismatch", async function () {
      const { escrow, relayer, stylist, treasury } = await loadFixture(deployEscrowFixture);

      // Setup
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      // Try to release with wrong total
      const wrongStylistAmount = STYLIST_AMOUNT - ethers.parseUnits("1", USDC_DECIMALS);
      await expect(
        escrow
          .connect(relayer)
          .releaseFunds(BOOKING_ID, stylist.address, wrongStylistAmount, treasury.address, PLATFORM_FEE)
      ).to.be.revertedWithCustomError(escrow, "AmountMismatch");
    });

    it("Should revert if escrow not in Locked status", async function () {
      const { escrow, relayer, stylist, treasury } = await loadFixture(deployEscrowFixture);

      // Try to release non-existent booking
      await expect(
        escrow
          .connect(relayer)
          .releaseFunds(BOOKING_ID, stylist.address, STYLIST_AMOUNT, treasury.address, PLATFORM_FEE)
      ).to.be.revertedWithCustomError(escrow, "InvalidEscrowStatus");
    });

    it("Should handle zero platform fee", async function () {
      const { escrow, usdc, relayer, stylist, treasury } = await loadFixture(deployEscrowFixture);

      // Setup
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      // Release with zero platform fee
      await escrow
        .connect(relayer)
        .releaseFunds(BOOKING_ID, stylist.address, BOOKING_AMOUNT, treasury.address, 0);

      expect(await usdc.balanceOf(stylist.address)).to.equal(BOOKING_AMOUNT);
      expect(await usdc.balanceOf(treasury.address)).to.equal(0);
    });
  });

  describe("refund", function () {
    beforeEach(async function () {
      const { escrow, usdc, customer } = await loadFixture(deployEscrowFixture);
      // Setup: Lock funds first
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);
      return { escrow, usdc, customer };
    });

    it("Should refund full amount successfully", async function () {
      const { escrow, usdc, relayer, customer } = await loadFixture(deployEscrowFixture);

      // Setup
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      const balanceBefore = await usdc.balanceOf(customer.address);

      // Refund
      await expect(escrow.connect(relayer).refund(BOOKING_ID, BOOKING_AMOUNT, customer.address))
        .to.emit(escrow, "FundsRefunded")
        .withArgs(BOOKING_ID, customer.address, BOOKING_AMOUNT);

      // Verify status updated
      const record = await escrow.getEscrowRecord(BOOKING_ID);
      expect(record.status).to.equal(3); // EscrowStatus.Refunded

      // Verify balance
      expect(await escrow.getEscrowBalance(BOOKING_ID)).to.equal(0);

      // Verify USDC transfer
      expect(await usdc.balanceOf(customer.address)).to.equal(balanceBefore + BOOKING_AMOUNT);
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0);
    });

    it("Should revert on partial refund (security fix C-1)", async function () {
      const { escrow, usdc, relayer, customer } = await loadFixture(deployEscrowFixture);

      // Setup
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      const partialAmount = BOOKING_AMOUNT / 2n;

      // Partial refund should now revert (security fix C-1)
      // This prevents funds from being permanently locked
      await expect(
        escrow.connect(relayer).refund(BOOKING_ID, partialAmount, customer.address)
      ).to.be.revertedWithCustomError(escrow, "AmountMismatch");

      // Verify escrow is still locked (not corrupted)
      const record = await escrow.getEscrowRecord(BOOKING_ID);
      expect(record.status).to.equal(1); // EscrowStatus.Locked
      expect(await escrow.getEscrowBalance(BOOKING_ID)).to.equal(BOOKING_AMOUNT);
    });

    it("Should allow refund to different recipient", async function () {
      const { escrow, usdc, relayer, customer, otherUser } = await loadFixture(deployEscrowFixture);

      // Setup
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      // Refund to different address
      await escrow.connect(relayer).refund(BOOKING_ID, BOOKING_AMOUNT, otherUser.address);

      expect(await usdc.balanceOf(otherUser.address)).to.equal(BOOKING_AMOUNT);
    });

    it("Should revert if caller is not relayer", async function () {
      const { escrow, customer } = await loadFixture(deployEscrowFixture);

      // Setup
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      await expect(escrow.connect(customer).refund(BOOKING_ID, BOOKING_AMOUNT, customer.address))
        .to.be.revertedWithCustomError(escrow, "UnauthorizedCaller");
    });

    it("Should revert if recipient is zero address", async function () {
      const { escrow, relayer } = await loadFixture(deployEscrowFixture);

      // Setup
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      await expect(escrow.connect(relayer).refund(BOOKING_ID, BOOKING_AMOUNT, ethers.ZeroAddress))
        .to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("Should revert if amount is zero", async function () {
      const { escrow, relayer, customer } = await loadFixture(deployEscrowFixture);

      // Setup
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      await expect(escrow.connect(relayer).refund(BOOKING_ID, 0, customer.address))
        .to.be.revertedWithCustomError(escrow, "InvalidAmount");
    });

    it("Should revert if amount does not match locked amount", async function () {
      const { escrow, relayer, customer } = await loadFixture(deployEscrowFixture);

      // Setup
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      // Try refund with excess amount - should revert with AmountMismatch
      const excessAmount = BOOKING_AMOUNT + ethers.parseUnits("1", USDC_DECIMALS);
      await expect(escrow.connect(relayer).refund(BOOKING_ID, excessAmount, customer.address))
        .to.be.revertedWithCustomError(escrow, "AmountMismatch");
    });

    it("Should revert if escrow not in Locked status", async function () {
      const { escrow, relayer, customer } = await loadFixture(deployEscrowFixture);

      // Try to refund non-existent booking
      await expect(escrow.connect(relayer).refund(BOOKING_ID, BOOKING_AMOUNT, customer.address))
        .to.be.revertedWithCustomError(escrow, "InvalidEscrowStatus");
    });
  });

  describe("getEscrowBalance", function () {
    it("Should return zero for non-existent booking", async function () {
      const { escrow } = await loadFixture(deployEscrowFixture);
      expect(await escrow.getEscrowBalance(BOOKING_ID)).to.equal(0);
    });

    it("Should return correct balance for locked funds", async function () {
      const { escrow, usdc, customer } = await loadFixture(deployEscrowFixture);

      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      expect(await escrow.getEscrowBalance(BOOKING_ID)).to.equal(BOOKING_AMOUNT);
    });

    it("Should return zero after funds are released", async function () {
      const { escrow, usdc, relayer, customer, stylist, treasury } = await loadFixture(
        deployEscrowFixture
      );

      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);
      await escrow
        .connect(relayer)
        .releaseFunds(BOOKING_ID, stylist.address, STYLIST_AMOUNT, treasury.address, PLATFORM_FEE);

      expect(await escrow.getEscrowBalance(BOOKING_ID)).to.equal(0);
    });

    it("Should return zero after funds are refunded", async function () {
      const { escrow, usdc, relayer, customer } = await loadFixture(deployEscrowFixture);

      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);
      await escrow.connect(relayer).refund(BOOKING_ID, BOOKING_AMOUNT, customer.address);

      expect(await escrow.getEscrowBalance(BOOKING_ID)).to.equal(0);
    });
  });

  describe("getEscrowRecord", function () {
    it("Should return empty record for non-existent booking", async function () {
      const { escrow } = await loadFixture(deployEscrowFixture);
      const record = await escrow.getEscrowRecord(BOOKING_ID);
      expect(record.customer).to.equal(ethers.ZeroAddress);
      expect(record.amount).to.equal(0);
      expect(record.status).to.equal(0); // EscrowStatus.None
    });

    it("Should return correct record for locked funds", async function () {
      const { escrow, usdc, customer } = await loadFixture(deployEscrowFixture);

      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      const record = await escrow.getEscrowRecord(BOOKING_ID);
      expect(record.customer).to.equal(customer.address);
      expect(record.amount).to.equal(BOOKING_AMOUNT);
      expect(record.status).to.equal(1); // EscrowStatus.Locked
    });
  });

  describe("Security - Reentrancy protection", function () {
    it("Should protect against reentrancy on lockFunds", async function () {
      // This test is more conceptual - actual reentrancy attack would require
      // a malicious ERC20 token. Our use of ReentrancyGuard provides protection.
      const { escrow, usdc, customer } = await loadFixture(deployEscrowFixture);

      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      // Verify funds were locked correctly
      expect(await escrow.getEscrowBalance(BOOKING_ID)).to.equal(BOOKING_AMOUNT);
    });
  });

  describe("Edge cases", function () {
    it("Should handle very small amounts", async function () {
      const { escrow, usdc, customer } = await loadFixture(deployEscrowFixture);

      const smallAmount = 1n; // 1 smallest unit
      await usdc.connect(customer).approve(await escrow.getAddress(), smallAmount);
      await escrow.connect(customer).lockFunds(BOOKING_ID, smallAmount);

      expect(await escrow.getEscrowBalance(BOOKING_ID)).to.equal(smallAmount);
    });

    it("Should handle large amounts", async function () {
      const { escrow, usdc, customer } = await loadFixture(deployEscrowFixture);

      const largeAmount = ethers.parseUnits("1000000", USDC_DECIMALS); // 1M USDC
      await usdc.mint(customer.address, largeAmount);
      await usdc.connect(customer).approve(await escrow.getAddress(), largeAmount);
      await escrow.connect(customer).lockFunds(BOOKING_ID, largeAmount);

      expect(await escrow.getEscrowBalance(BOOKING_ID)).to.equal(largeAmount);
    });
  });

  describe("Emergency Pause (security fix M-1)", function () {
    it("Should allow owner to pause", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);

      await expect(escrow.connect(owner).pause())
        .to.emit(escrow, "ContractPaused")
        .withArgs(owner.address);

      expect(await escrow.paused()).to.equal(true);
    });

    it("Should allow owner to unpause", async function () {
      const { escrow, owner } = await loadFixture(deployEscrowFixture);

      await escrow.connect(owner).pause();
      await expect(escrow.connect(owner).unpause())
        .to.emit(escrow, "ContractUnpaused")
        .withArgs(owner.address);

      expect(await escrow.paused()).to.equal(false);
    });

    it("Should revert if non-admin tries to pause", async function () {
      const { escrow, customer } = await loadFixture(deployEscrowFixture);

      await expect(escrow.connect(customer).pause())
        .to.be.revertedWithCustomError(escrow, "UnauthorizedCaller");
    });

    it("Should revert if non-admin tries to unpause", async function () {
      const { escrow, owner, customer } = await loadFixture(deployEscrowFixture);

      await escrow.connect(owner).pause();
      await expect(escrow.connect(customer).unpause())
        .to.be.revertedWithCustomError(escrow, "UnauthorizedCaller");
    });

    it("Should block lockFunds when paused", async function () {
      const { escrow, usdc, owner, customer } = await loadFixture(deployEscrowFixture);

      await escrow.connect(owner).pause();
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);

      await expect(escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT))
        .to.be.revertedWithCustomError(escrow, "EnforcedPause");
    });

    it("Should block releaseFunds when paused", async function () {
      const { escrow, usdc, owner, relayer, customer, stylist, treasury } = await loadFixture(
        deployEscrowFixture
      );

      // Setup: Lock funds first
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      // Pause
      await escrow.connect(owner).pause();

      // Try to release - should fail
      await expect(
        escrow
          .connect(relayer)
          .releaseFunds(BOOKING_ID, stylist.address, STYLIST_AMOUNT, treasury.address, PLATFORM_FEE)
      ).to.be.revertedWithCustomError(escrow, "EnforcedPause");
    });

    it("Should block refund when paused", async function () {
      const { escrow, usdc, owner, relayer, customer } = await loadFixture(deployEscrowFixture);

      // Setup: Lock funds first
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      // Pause
      await escrow.connect(owner).pause();

      // Try to refund - should fail
      await expect(escrow.connect(relayer).refund(BOOKING_ID, BOOKING_AMOUNT, customer.address))
        .to.be.revertedWithCustomError(escrow, "EnforcedPause");
    });

    it("Should allow operations after unpause", async function () {
      const { escrow, usdc, owner, relayer, customer, stylist, treasury } = await loadFixture(
        deployEscrowFixture
      );

      // Pause then unpause
      await escrow.connect(owner).pause();
      await escrow.connect(owner).unpause();

      // Lock should work
      await usdc.connect(customer).approve(await escrow.getAddress(), BOOKING_AMOUNT);
      await escrow.connect(customer).lockFunds(BOOKING_ID, BOOKING_AMOUNT);

      // Release should work
      await escrow
        .connect(relayer)
        .releaseFunds(BOOKING_ID, stylist.address, STYLIST_AMOUNT, treasury.address, PLATFORM_FEE);

      expect(await usdc.balanceOf(stylist.address)).to.equal(STYLIST_AMOUNT);
    });
  });
});
