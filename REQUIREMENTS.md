# Project Requirements

## Runtime Requirements

- Node.js 18 or higher
- npm 9 or higher
- Linux, macOS, or Windows environment

## Core Dependencies

Root dependencies are managed in package.json:

- express
- multer
- cors
- dotenv
- ethers
- uuid

Root dev dependencies:

- hardhat
- @nomicfoundation/hardhat-ethers
- concurrently

Client dependencies are managed in client/package.json:

- react
- react-dom
- axios
- react-icons
- vite
- tailwindcss
- postcss
- autoprefixer

## Environment Requirements

Create .env from .env.example.

Mandatory for app runtime:

- ENABLE_WEB3_ANCHORING=true
- WEB3_RPC_URL
- WEB3_PRIVATE_KEY
- WEB3_CONTRACT_ADDRESS
- WEB3_CHAIN_ID

Optional for Sepolia deployment script:

- SEPOLIA_RPC_URL
- DEPLOYER_PRIVATE_KEY

## Functional Requirements

- Admin uploads a reference file
- Server computes SHA-256 hash
- Hash metadata is stored in local database
- Hash transaction is written to EVM chain via contract
- User uploads a file for verification
- Server compares uploaded hash against registered hashes
- Verification result is returned as verified or unverified
- Blockchain explorer endpoints return chain, block, mining, and mempool data from connected network

## Blockchain Anchoring Requirements

- Solidity contract compiles with Hardhat
- Contract deploys to local node or Sepolia
- Server records file hash on-chain through API flow
- Server verifies file hash on-chain through API endpoints

## Non-Functional Requirements

- Existing UI layout and styles remain unchanged
- Existing API behavior remains backward-compatible for current frontend flows
- Hardhat/EVM backend remains available for upload and verification flows
