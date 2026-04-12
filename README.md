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

## Animated Workflow Chart

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {
'primaryColor': '#0b1020',
'primaryTextColor': '#e5f0ff',
'primaryBorderColor': '#00d4ff',
'lineColor': '#7bd3ff',
'secondaryColor': '#11233f',
'tertiaryColor': '#0f172a'
}}}%%
flowchart LR
	U[User or Admin Uploads File]:::entry
	H[SHA-256 Hash Generated]:::process

	subgraph Admin Path
		A1[POST /api/admin/upload-original]:::admin
		A2[Store Metadata in SQLite]:::store
		A3[Add Transaction to Mempool]:::chain
		A4[Mine New Block (PoW)]:::mine
		A5[Return blockIndex + blockHash]:::ok
	end

	subgraph Verification Path
		V1[POST /api/verify-file]:::user
		V2[Find Matching Hash in SQLite]:::store
		V3{Hash Match?}:::decision
		V4[Verified: increment count]:::ok
		V5[Unverified: hash not found]:::fail
	end

	U e1@--> H
	H e2@--> A1
	H e3@--> V1

	A1 --> A2 --> A3 --> A4 --> A5
	V1 --> V2 --> V3
	V3 -->|Yes| V4
	V3 -->|No| V5

	classDef entry fill:#082f49,stroke:#22d3ee,color:#ecfeff,stroke-width:2px;
	classDef process fill:#1e293b,stroke:#38bdf8,color:#e2e8f0,stroke-width:2px;
	classDef admin fill:#052e16,stroke:#22c55e,color:#dcfce7,stroke-width:2px;
	classDef user fill:#3b0764,stroke:#c084fc,color:#f3e8ff,stroke-width:2px;
	classDef store fill:#172554,stroke:#60a5fa,color:#dbeafe,stroke-width:2px;
	classDef chain fill:#3f1d0f,stroke:#fb923c,color:#ffedd5,stroke-width:2px;
	classDef mine fill:#431407,stroke:#f97316,color:#ffedd5,stroke-width:3px;
	classDef ok fill:#052e16,stroke:#4ade80,color:#dcfce7,stroke-width:2px;
	classDef fail fill:#450a0a,stroke:#ef4444,color:#fee2e2,stroke-width:2px;
	classDef decision fill:#111827,stroke:#facc15,color:#fef9c3,stroke-width:2px;

	classDef animated stroke-dasharray: 6 4, animation: fast;
	class e1,e2,e3 animated;
```

The animated links highlight the core timeline: upload -> hash -> register or verify.

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