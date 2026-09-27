import {
  JsonRpcProvider,
  Wallet,
  ContractFactory,
  getAddress,
  ZeroAddress,
} from "ethers";
import { writeFileSync, mkdirSync } from "node:fs";
import { compile } from "./compile-contract.js";
const {
  BSC_RPC_URL,
  DEPLOYER_PRIVATE_KEY,
  TOKEN_OWNER_ADDRESS,
  CONFIRM_MAINNET,
} = process.env;
if (!BSC_RPC_URL || !DEPLOYER_PRIVATE_KEY || !TOKEN_OWNER_ADDRESS)
  throw new Error(
    "Set BSC_RPC_URL, DEPLOYER_PRIVATE_KEY and TOKEN_OWNER_ADDRESS privately.",
  );
const owner = getAddress(TOKEN_OWNER_ADDRESS);
if (owner === ZeroAddress)
  throw new Error("The owner cannot be the zero address.");
const provider = new JsonRpcProvider(BSC_RPC_URL);
const network = await provider.getNetwork();
if (![56n, 97n].includes(network.chainId))
  throw new Error("Expected BSC mainnet (56) or testnet (97).");
if (network.chainId === 56n && CONFIRM_MAINNET !== "AMBER-1B")
  throw new Error(
    "Mainnet costs real BNB. Review the contract, owner and supply, then explicitly set CONFIRM_MAINNET=AMBER-1B.",
  );
const signer = new Wallet(DEPLOYER_PRIVATE_KEY, provider);
const artifact = compile();
console.log(
  `Deploying AMBER with 1,000,000,000 AMBR to treasury ${owner} on chain ${network.chainId}.`,
);
const contract = await new ContractFactory(
  artifact.abi,
  artifact.bytecode,
  signer,
).deploy(owner);
await contract.waitForDeployment();
const receipt = await contract.deploymentTransaction().wait(3);
const result = {
  address: await contract.getAddress(),
  owner,
  chainId: Number(network.chainId),
  transactionHash: receipt.hash,
  blockNumber: receipt.blockNumber,
  compiler: artifact.compiler,
};
mkdirSync("artifacts", { recursive: true });
writeFileSync(
  `artifacts/deployment-${network.chainId}.json`,
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
