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

Mandatory for base app:

- No additional variables required (works in local mode by default)

Optional for Web3 anchoring:

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
- Hash transaction is added to local PoW blockchain
- User uploads a file for verification
- Server compares uploaded hash against registered hashes
- Verification result is returned as verified or unverified
- Blockchain explorer endpoints return chain, block, mining, and mempool data

## Optional Blockchain Anchoring Requirements

- Solidity contract compiles with Hardhat
- Contract deploys to local node or Sepolia
- Server can record file hash on-chain when enabled
- Server can verify file hash on-chain through API endpoints
- App remains fully functional when anchoring is disabled

## Non-Functional Requirements

- Existing UI layout and styles remain unchanged
- Existing API behavior remains backward-compatible for current frontend flows
- Web3 integration degrades gracefully when not configured
