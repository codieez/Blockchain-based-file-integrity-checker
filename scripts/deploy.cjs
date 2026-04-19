const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const DEFAULT_LOCAL_RPC = "http://127.0.0.1:8545";
const DEFAULT_LOCAL_CHAIN_ID = "31337";
const DEFAULT_LOCAL_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

function upsertEnvValue(envText, key, value) {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(envText)) {
    return envText.replace(regex, line);
  }
  const suffix = envText.endsWith("\n") ? "" : "\n";
  return `${envText}${suffix}${line}\n`;
}

function writeLocalEnv(contractAddress) {
  const projectRoot = path.join(__dirname, "..");
  const envPath = path.join(projectRoot, ".env");
  const envExamplePath = path.join(projectRoot, ".env.example");

  let envText = "";
  if (fs.existsSync(envPath)) {
    envText = fs.readFileSync(envPath, "utf8");
  } else if (fs.existsSync(envExamplePath)) {
    envText = fs.readFileSync(envExamplePath, "utf8");
  }

  envText = upsertEnvValue(envText, "ENABLE_WEB3_ANCHORING", "true");
  envText = upsertEnvValue(envText, "WEB3_CHAIN_ID", DEFAULT_LOCAL_CHAIN_ID);
  envText = upsertEnvValue(envText, "WEB3_RPC_URL", DEFAULT_LOCAL_RPC);
  envText = upsertEnvValue(envText, "WEB3_PRIVATE_KEY", DEFAULT_LOCAL_PRIVATE_KEY);
  envText = upsertEnvValue(envText, "WEB3_CONTRACT_ADDRESS", contractAddress);

  fs.writeFileSync(envPath, envText, "utf8");
  console.log(`Updated .env with local-chain Web3 settings at: ${envPath}`);
}

async function main() {
  const registry = await hre.ethers.deployContract("FileIntegrityRegistry");
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("FileIntegrityRegistry deployed to:", address);

  const shouldWriteEnv = process.env.WRITE_ENV === "true";
  if (shouldWriteEnv && hre.network.name === "localhost") {
    writeLocalEnv(address);
  }

  console.log("\nFor local-chain viva demo:");
  console.log("1) Keep hardhat node running");
  console.log("2) Start backend: npm run server");
  console.log("3) Check status: curl -s http://localhost:5000/api/web3/status | jq .");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
