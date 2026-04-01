# Blockchain File Integrity Checker

Blockchain-backed integrity verification for any file type.

This project is a full-stack app where an admin registers reference files and users verify uploaded files against those registered hashes. Each registration is recorded in a simulated blockchain using Proof of Work, so integrity evidence is auditable and tamper-evident.

## What This Project Is

- A blockchain-backed file integrity checker for any file format.
- Works with any file format (PDF, image, document, archive, etc.).
- Uses SHA-256 hashes plus blockchain-style block linking for traceability.

## Key Features

- File hash registration and verification using SHA-256.
- Proof of Work mining with difficulty tracking.
- Merkle root per block for transaction integrity.
- Blockchain explorer data (blocks, mempool, mining stats).
- Admin workflow for managing registered reference files.
- User workflow for checking whether a file matches a registered original.

## Tech Stack

- Backend: Node.js, Express, Multer, SQLite (better-sqlite3)
- Frontend: React, Vite, Tailwind CSS, Axios
- Crypto: SHA-256 hashing via Node crypto APIs

## Project Structure

```text
.
├── server/              # API and blockchain logic
├── client/              # React frontend
├── data/                # Local data storage
├── uploads/             # Uploaded files (runtime)
├── start.sh             # Convenience startup script
└── test-demo.sh         # API demo script
```

## Setup

### Prerequisites

- Node.js 18+
- npm

### Install Dependencies

```bash
npm install
cd client && npm install && cd ..
```

### Run in Development

```bash
npm run dev
```

This starts:

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### Other Useful Commands

```bash
# Run backend only
npm run server

# Run frontend only
npm run client

# Build frontend
npm run build

# Alternative startup script
chmod +x start.sh && ./start.sh
```

## Basic Usage

1. Open the app in the browser.
2. Admin logs in and uploads a reference file.
3. User uploads a file to verify integrity.
4. System compares hashes and returns verified/unverified status.
5. Blockchain stats and block data can be inspected from the UI/API.

Default admin key in this demo: `admin123`

## API Overview

### Admin

- `POST /api/admin/upload-original` - Register and mine a reference file.
- `GET /api/admin/originals` - List registered files.
- `DELETE /api/admin/originals/:fileHash` - Remove a registered file.

### User Verification

- `POST /api/verify-file` - Upload a file and verify against registered originals.
- `GET /api/files/registered` - List registered files for user view.

### Blockchain / Diagnostics

- `GET /api/blockchain`
- `GET /api/block/:index`
- `GET /api/mining-stats`
- `GET /api/mempool`
- `POST /api/mine`
- `POST /api/simulate-attack`
- `GET /api/verify-blockchain/:depth`

## Notes

- This is a local/demo environment and uses a simple admin key check.
- For production use, replace admin auth with proper identity and authorization.
- Persisted data and uploaded files are stored locally under `data/`.