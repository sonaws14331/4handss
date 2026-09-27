import solc from "solc";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export function compile() {
  const input = {
    language: "Solidity",
    sources: {
      "AMBER.sol": {
        content: readFileSync(path.join(root, "contracts/AMBER.sol"), "utf8"),
      },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "shanghai",
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode", "evm.deployedBytecode"] },
      },
    },
  };
  const result = JSON.parse(
    solc.compile(JSON.stringify(input), {
      import(name) {
        try {
          return {
            contents: readFileSync(
              path.join(root, "node_modules", name),
              "utf8",
            ),
          };
        } catch {
          return { error: `Import not found: ${name}` };
        }
      },
    }),
  );
  const errors = result.errors?.filter((e) => e.severity === "error") || [];
  if (errors.length)
    throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
  const contract = result.contracts["AMBER.sol"].AMBER;
  return {
    contractName: "AMBER",
    compiler: solc.version(),
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
    settings: input.settings,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(path.join(root, "artifacts"), { recursive: true });
  writeFileSync(
    path.join(root, "artifacts/AMBER.json"),
    JSON.stringify(compile(), null, 2),
  );
  console.log("AMBER compiled successfully: artifacts/AMBER.json");
}
