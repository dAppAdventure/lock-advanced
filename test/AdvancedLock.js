const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("AdvancedLock", function () {
  async function deployFixture() {
    const ONE_DAY = 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockInterval = ONE_DAY;
    const lockedAmount = ONE_GWEI;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, thirdAccount] = await ethers.getSigners();

    const AdvancedLock = await ethers.getContractFactory("AdvancedLock");
    const advancedLock = await AdvancedLock.deploy(ONE_DAY);

    return { advancedLock, lockInterval, lockedAmount, owner, otherAccount, thirdAccount };
  }

  describe("AdvancedLock", function () {
    it("Should release funds for authorized addresses", async function () {
      const { advancedLock, lockInterval, lockedAmount, owner, otherAccount, thirdAccount } =
        await loadFixture(deployFixture);
      var array = [otherAccount.address, thirdAccount.address];
      await expect(advancedLock.lockForAuthorized(array, { value: lockedAmount }))
        .to
        .emit(advancedLock, "Lock")
        .withArgs(owner.address, array, lockedAmount);

      await time.increase(lockInterval);

      await expect(advancedLock.connect(otherAccount).withdraw(owner.address))
        .to
        .emit(advancedLock, "Withdrawal")
        .withArgs(otherAccount.address, lockedAmount);

    });

    it("Should revert withdrawal if unlock time is not passed", async function () {
      const { advancedLock, lockInterval, lockedAmount, owner, otherAccount, thirdAccount } =
        await loadFixture(deployFixture);
      var array = [otherAccount.address, thirdAccount.address];
      await expect(advancedLock.lockForAuthorized(array, { value: lockedAmount }))
        .to
        .emit(advancedLock, "Lock")
        .withArgs(owner.address, array, lockedAmount);

      await time.increase(lockInterval);
      await advancedLock.ping();

      await expect(advancedLock.connect(otherAccount)
        .withdraw(owner.address))
        .to
        .revertedWith("Funds are locked");

    });
  });
});
