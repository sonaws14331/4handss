import test from "node:test";
import assert from "node:assert/strict";
import { createHardhatRuntimeEnvironment } from "hardhat/hre";
import {
  BrowserProvider,
  ContractFactory,
  parseEther,
  ZeroAddress,
} from "ethers";
import { compile } from "../scripts/compile-contract.js";

test("BIMZI fixed supply, transfers, owner authorization and safe ownership transitions", async () => {
  const hre = await createHardhatRuntimeEnvironment({
    networks: {
      test: { type: "edr-simulated", chainType: "l1", hardfork: "shanghai" },
    },
  });
  const connection = await hre.network.create("test");
  const evm = connection.provider;
  try {
    const provider = new BrowserProvider(evm);
    const owner = await provider.getSigner(0),
      member = await provider.getSigner(1),
      nextOwner = await provider.getSigner(2);
    const ownerAddress = await owner.getAddress(),
      memberAddress = await member.getAddress(),
      nextAddress = await nextOwner.getAddress();
    const { abi, bytecode } = compile();
    const factory = new ContractFactory(abi, bytecode, owner);
    await assert.rejects(() => factory.deploy(ZeroAddress));
    const token = await factory.deploy(ownerAddress);
    await token.waitForDeployment();
    assert.equal(await token.name(), "BIMZI");
    assert.equal(await token.symbol(), "BIMZI");
    assert.equal(await token.decimals(), 18n);
    const total = parseEther("1000000000");
    assert.equal(await token.totalSupply(), total);
    assert.equal(await token.balanceOf(ownerAddress), total);
    assert.equal(
      abi.some((entry) => entry.name === "mint"),
      false,
    );
    await (await token.transfer(memberAddress, parseEther("100"))).wait();
    assert.equal(await token.balanceOf(memberAddress), parseEther("100"));
    await assert.rejects(() => token.connect(member).pause());
    await (
      await token.connect(member).approve(ownerAddress, parseEther("10"))
    ).wait();
    await (
      await token.transferFrom(memberAddress, nextAddress, parseEther("10"))
    ).wait();
    await (await token.pause()).wait();
    assert.equal(await token.paused(), true);
    await assert.rejects(() =>
      token.connect(member).transfer.staticCall(ownerAddress, 1n),
    );
    await assert.rejects(() =>
      token.transferFrom.staticCall(memberAddress, nextAddress, 1n),
    );
    await assert.rejects(() => token.renounceOwnership.staticCall());
    await assert.rejects(() => token.connect(member).unpause());
    await (await token.transferOwnership(nextAddress)).wait();
    assert.equal(await token.owner(), ownerAddress);
    await assert.rejects(() => token.connect(member).acceptOwnership());
    await (await token.connect(nextOwner).acceptOwnership()).wait();
    assert.equal(await token.getOwner(), nextAddress);
    await assert.rejects(() => token.unpause());
    await (await token.connect(nextOwner).unpause()).wait();
    await (await token.connect(member).transfer(ownerAddress, 1n)).wait();
    assert.equal(await token.totalSupply(), total);
    await (await token.connect(nextOwner).renounceOwnership()).wait();
    assert.equal(await token.owner(), ZeroAddress);
    await assert.rejects(() => token.connect(nextOwner).pause());
  } finally {
    await connection.close();
  }
});
