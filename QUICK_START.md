# Quick Start Guide

## Installation

```bash
# Install all dependencies
npm install
cd client && npm install && cd ..
```

## Running the Application

### Option 1: Using npm script (recommended)
```bash
npm run dev
```

This will start:
- Backend Server: http://localhost:5000
- Frontend Client: http://localhost:3000

### Option 2: Using start script
```bash
chmod +x start.sh
./start.sh
```

### Option 3: Run separately
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

## Testing the System

### Test with Demo Script
```bash
chmod +x test-demo.sh
./test-demo.sh
```

This will:
1. Create a test file
2. Upload it to the blockchain
3. Verify file integrity
4. Display blockchain statistics

### Manual Testing

**1. Upload a File:**
```bash
curl -X POST -F "file=@myfile.txt" http://localhost:5000/api/upload
```

**2. Verify File:**
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"fileHash": "YOUR_FILE_HASH"}' \
  http://localhost:5000/api/verify
```

**3. Check Blockchain:**
```bash
curl http://localhost:5000/api/blockchain
```

**4. View Mining Stats:**
```bash
curl http://localhost:5000/api/mining-stats
```

## Key Features Tested

✅ File Upload & Hashing
✅ Proof of Work Mining
✅ Merkle Tree Implementation
✅ Block Validation
✅ Chain Verification
✅ Difficulty Adjustment
✅ File Integrity Verification
✅ Mining Statistics
✅ Transaction Mempool
✅ Beautiful React UI with Tailwind CSS

## Project Structure

```
.
├── server/
│   ├── blockchain.js       (Core blockchain with PoW, Merkle trees)
│   ├── fileHandler.js      (File hashing and processing)
│   └── index.js            (Express API server)
├── client/
│   ├── src/
│   │   ├── App.jsx         (Main application)
│   │   ├── index.css       (Global styles)
│   │   └── components/
│   │       ├── FileUpload.jsx
│   │       ├── FileVerification.jsx
│   │       ├── FileList.jsx
│   │       └── BlockchainView.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
├── package.json
├── BLOCKCHAIN_SIMULATION.md (Detailed blockchain concepts)
└── README.md
```

## API Documentation

### Upload File
```
POST /api/upload
Content-Type: multipart/form-data
Body: file=<binary>

Response:
{
  "success": true,
  "data": {
    "fileHash": "string",
    "filename": "string",
    "blockIndex": number,
    "blockHash": "string",
    "miningStats": {...}
  }
}
```

### Verify File
```
POST /api/verify
Content-Type: application/json
Body: {"fileHash": "string"}

Response:
{
  "verified": boolean,
  "verificationData": {
    "blockIndex": number,
    "blockValid": boolean,
    "chainIntegrity": boolean
  }
}
```

### Get Blockchain
```
GET /api/blockchain

Response:
{
  "stats": {...},
  "chain": [...],
  "isValid": boolean
}
```

### Get Mining Stats
```
GET /api/mining-stats

Response:
{
  "totalBlocksMined": number,
  "averageMiningTime": number,
  "difficultyHistory": [...]
}
```

### Get Files
```
GET /api/files

Response:
{
  "files": [...],
  "totalFiles": number
}
```

### Get Mempool
```
GET /api/mempool

Response:
{
  "mempoolSize": number,
  "transactions": [...]
}
```

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Dependencies Not Installed
```bash
npm install --force
cd client && npm install --force && cd ..
```

### Build Issues
```bash
# Clean cache
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json
npm install
cd client && npm install && cd ..
```

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Hashing**: Node.js Crypto module (SHA-256)
- **Database**: In-memory (file-based upon request)
- **Icons**: React Icons

## Performance Metrics

- Genesis Block Mining: ~1ms
- Average Block Mining Time: 2-5ms
- File Upload + Mining: 10-50ms
- Verification Speed: <1ms
- Blockchain Validation Speed: O(n) where n = number of blocks

## Features Implemented

### Blockchain Core
- ✅ Proof of Work with difficulty adjustment
- ✅ Merkle tree for transaction integrity
- ✅ SHA-256 hashing
- ✅ Block validation
- ✅ Chain validation
- ✅ Transaction pool
- ✅ Mining statistics

### File System
- ✅ File upload with drag-and-drop
- ✅ SHA-256 file hashing
- ✅ File integrity verification
- ✅ File registry management
- ✅ Detailed file information

### User Interface
- ✅ Real-time blockchain dashboard
- ✅ File upload component
- ✅ File verification search
- ✅ Blockchain explorer
- ✅ Mining statistics display
- ✅ Mempool viewer
- ✅ Responsive design
- ✅ Dark theme

### Educational Features
- ✅ Visual block chain representation
- ✅ Mining difficulty explanation
- ✅ Transaction pool demonstration
- ✅ Verification path display
- ✅ Attack simulation
- ✅ Merkle root visualization

## Contact & Support

For issues or questions, check:
- BLOCKCHAIN_SIMULATION.md (Detailed concepts)
- README.md (Project overview)
- server/index.js (API documentation in comments)
- client/src/components (Frontend implementation)

---

**Happy Blockchain Learning! 🚀**
