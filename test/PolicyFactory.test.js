const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PolicyFactory", function () {
  let policyFactory, mockToken;
  let owner, insurer, user;

  beforeEach(async function () {
    [owner, insurer, user] = await ethers.getSigners();

    // Deploy mock token
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    mockToken = await ERC20Mock.deploy("Mock USDT", "MUSDT", 6, ethers.parseUnits("1000000", 6));

    // Deploy PolicyFactory
    const PolicyFactory = await ethers.getContractFactory("PolicyFactory");
    policyFactory = await PolicyFactory.deploy();
  });

  describe("Deployment", function () {
    it("Should set the deployer as authorized insurer", async function () {
      expect(await policyFactory.authorizedInsurers(owner.address)).to.be.true;
    });

    it("Should initialize with zero policies", async function () {
      expect(await policyFactory.getTotalPolicies()).to.equal(0);
    });
  });

  describe("Insurer Management", function () {
    it("Should authorize new insurer", async function () {
      await policyFactory.authorizeInsurer(insurer.address);
      expect(await policyFactory.authorizedInsurers(insurer.address)).to.be.true;
    });

    it("Should revoke insurer authorization", async function () {
      await policyFactory.authorizeInsurer(insurer.address);
      await policyFactory.revokeInsurer(insurer.address);
      expect(await policyFactory.authorizedInsurers(insurer.address)).to.be.false;
    });

    it("Should revert when non-owner tries to authorize", async function () {
      await expect(
        policyFactory.connect(user).authorizeInsurer(insurer.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Policy Creation", function () {
    beforeEach(async function () {
      await policyFactory.authorizeInsurer(insurer.address);
    });

    it("Should create policy successfully", async function () {
      const tx = await policyFactory.connect(insurer).createPolicy(
        "DEFI_HACK",
        ethers.parseUnits("100", 6),
        ethers.parseUnits("10000", 6),
        86400 * 30, // 30 days
        mockToken.target
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => log.fragment?.name === "PolicyCreated");
      
      expect(event).to.not.be.undefined;
      expect(await policyFactory.getTotalPolicies()).to.equal(1);
    });

    it("Should revert with invalid parameters", async function () {
      await expect(
        policyFactory.connect(insurer).createPolicy(
          "",
          ethers.parseUnits("100", 6),
          ethers.parseUnits("10000", 6),
          86400 * 30,
          mockToken.target
        )
      ).to.be.revertedWith("Invalid policy type");

      await expect(
        policyFactory.connect(insurer).createPolicy(
          "DEFI_HACK",
          0,
          ethers.parseUnits("10000", 6),
          86400 * 30,
          mockToken.target
        )
      ).to.be.revertedWith("Premium must be positive");
    });

    it("Should revert when unauthorized user tries to create policy", async function () {
      await expect(
        policyFactory.connect(user).createPolicy(
          "DEFI_HACK",
          ethers.parseUnits("100", 6),
          ethers.parseUnits("10000", 6),
          86400 * 30,
          mockToken.target
        )
      ).to.be.revertedWith("Not authorized insurer");
    });
  });

  describe("Policy Retrieval", function () {
    it("Should return correct policy address", async function () {
      await policyFactory.authorizeInsurer(insurer.address);
      
      const tx = await policyFactory.connect(insurer).createPolicy(
        "DEFI_HACK",
        ethers.parseUnits("100", 6),
        ethers.parseUnits("10000", 6),
        86400 * 30,
        mockToken.target
      );

      const policyAddress = await policyFactory.getPolicy(1);
      expect(policyAddress).to.not.equal(ethers.ZeroAddress);
    });
  });
});