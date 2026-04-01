# Blockchain File Integrity Checker

A comprehensive blockchain-based file integrity verification system with educational blockchain simulation.

## Features

### Core Blockchain Features
- **Proof of Work (PoW)**: SHA-256 based mining with configurable difficulty
- **Merkle Tree**: Transaction hashing using merkle tree structure
- **Block Validation**: Complete block validation including hash verification
- **Chain Validation**: Multiple levels of blockchain integrity checking
- **Difficulty Adjustment**: Automatic difficulty adjustment every 5 blocks
- **Transaction Pool (Mempool)**: Pending transactions before mining
- **Block Rewards**: Mining incentive simulation

### File Integrity System
- **SHA-256 Hashing**: Cryptographic file hashing
- **Block Linking**: Each block cryptographically links to previous blocks
- **Transaction Records**: Files stored as transactions in blocks
- **Verification Hierarchy**: Multi-level verification paths
- **Attack Detection**: Simulated attack detection mechanism

### User Interface
- **Real-time Dashboard**: Live blockchain statistics
- **File Upload**: Drag-and-drop file upload with automatic hashing
- **File Verification**: Verify file integrity against blockchain
- **Blockchain Explorer**: Browse all blocks and transactions
- **Mining Statistics**: Track mining performance and difficulty changes
- **Mempool Monitor**: View pending transactions
- **Visual Feedback**: Status indicators and validation checks

## Technical Stack

### Backend
- Node.js with Express.js
- Crypto module for SHA-256 hashing
- Multer for file handling
- CORS support

### Frontend
- React 18
- Vite for bundling
- Tailwind CSS for styling
- React Icons for UI elements
- Axios for API calls

## API Endpoints

### File Operations
- `POST /api/upload` - Upload and hash a file
- `POST /api/verify` - Verify file integrity
- `GET /api/files` - List all uploaded files
- `GET /api/transaction/:hash` - Get transaction details

### Blockchain Operations
- `GET /api/blockchain` - Get full blockchain
- `GET /api/block/:index` - Get specific block details
- `GET /api/mining-stats` - Get mining statistics
- `POST /api/recheck` - Verify file integrity in block
- `GET /api/mempool` - View pending transactions
- `POST /api/mine` - Mine pending transactions
- `POST /api/simulate-attack` - Simulate attack detection

## Setup & Installation

```bash
npm install
cd client && npm install && cd ..
npm run dev
```

Server runs on http://localhost:5000
Client runs on http://localhost:3000