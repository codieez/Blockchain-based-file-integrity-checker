import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFileInfo, cleanupFile } from './fileHandler.js';
import { Database } from './database.js';
import { Web3Service } from './web3Service.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const db = new Database();
const web3Service = new Web3Service();

// Storage for original reference files (admin uploads)
const originalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../data/originals'));
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Storage for user verification files
const verifyStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../data/verify'));
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadOriginal = multer({
  storage: originalStorage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

const uploadVerify = multer({
  storage: verifyStorage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

// Serve static frontend only when a production build exists.
const clientDistPath = path.join(__dirname, '../client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');
const hasClientBuild = fs.existsSync(clientIndexPath);
if (hasClientBuild) {
  app.use(express.static(clientDistPath));
}

// Simple authentication middleware for admin (in production, use proper JWT)
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  if (adminKey === 'admin123') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Invalid admin key' });
  }
};

const fileRegistry = new Map();

// ===================== ADMIN ENDPOINTS =====================

// Admin: Upload original reference file
app.post('/api/admin/upload-original', adminAuth, uploadOriginal.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileInfo = getFileInfo(req.file.path, req.file.originalname);
    
    // Add to database
    const originalFile = db.addOriginal(
      fileInfo.fileHash,
      fileInfo.filename,
      fileInfo.size,
      fileInfo.uploadedAt
    );

    // Record on the actual EVM chain.
    const chainAnchor = await web3Service.recordFileOnChain({
      fileHash: fileInfo.fileHash,
      filename: fileInfo.filename,
      size: fileInfo.size
    });

    if (!chainAnchor.anchored) {
      db.deleteOriginal(fileInfo.fileHash);
      cleanupFile(req.file.path);
      const reason = chainAnchor.reason || 'Unknown blockchain error';
      return res.status(503).json({
        error: `Blockchain transaction failed. File was not registered. ${reason}`,
        chainAnchor,
        web3: await web3Service.getStatus(),
        nextSteps: [
          'Start local chain: npm run chain:node',
          'Deploy contract: npm run chain:deploy:local:enable',
          'Restart backend: npm run server'
        ]
      });
    }

    res.json({
      success: true,
      message: 'Original reference file uploaded and stored',
      data: {
        ...originalFile,
        blockIndex: chainAnchor.blockNumber,
        blockHash: chainAnchor.blockHash,
        chainAnchor
      },
      web3: await web3Service.getStatus()
    });
  } catch (error) {
    console.error('Admin upload error:', error);
    if (req.file) cleanupFile(req.file.path);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Admin: Get all original files
app.get('/api/admin/originals', adminAuth, (req, res) => {
  try {
    const originals = db.getAllOriginals();
    res.json({
      success: true,
      count: originals.length,
      originals
    });
  } catch (error) {
    console.error('Error fetching originals:', error);
    res.status(500).json({ error: 'Failed to fetch originals' });
  }
});

// Admin: Delete original file
app.delete('/api/admin/originals/:fileHash', adminAuth, (req, res) => {
  try {
    const { fileHash } = req.params;
    const deleted = db.deleteOriginal(fileHash);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Original file deleted'
      });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error deleting original:', error);
    res.status(500).json({ error: 'Failed to delete original' });
  }
});

// ===================== USER ENDPOINTS =====================

// User: Upload file for verification
app.post('/api/verify-file', uploadVerify.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileInfo = getFileInfo(req.file.path, req.file.originalname);
    const hash = fileInfo.fileHash;

    // Check if matching reference file exists in database
    const original = db.findOriginal(hash);
    const hashComparison = {
      algorithm: 'SHA-256',
      uploadedHash: hash,
      originalHash: original ? original.fileHash : null,
      match: !!original && original.fileHash === hash,
      foundInDatabase: !!original
    };

    if (!original) {
      const onChain = await web3Service.verifyFileHash(hash);
      return res.json({
        verified: false,
        message: 'File is not valid. Matching hash was not found in the reference database.',
        status: '✗ UNVERIFIED',
        uploadedFile: {
          filename: fileInfo.filename,
          size: fileInfo.size,
          mimeType: fileInfo.mimeType,
          hash: hash
        },
        hashComparison,
        onChain,
        verificationFlow: {
          generatedHash: true,
          lookedUpInDatabase: true,
          comparedWithReference: false,
          integrityVerified: false
        }
      });
    }

    // File hash matches - increment verification count
    db.incrementVerification(hash);
    const onChain = await web3Service.verifyFileHash(hash);

    res.json({
      verified: true,
      message: 'File verified successfully!',
      status: '✓ VERIFIED',
      originalFile: {
        filename: original.filename,
        size: original.size,
        uploadedAt: original.uploadedAt,
        verificationCount: original.verified + 1
      },
      uploadedFile: {
        size: fileInfo.size,
        mimeType: fileInfo.mimeType,
        hash: hash,
        filename: fileInfo.filename
      },
      hashComparison,
      onChain,
      verificationFlow: {
        generatedHash: true,
        lookedUpInDatabase: true,
        comparedWithReference: true,
        integrityVerified: true
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    if (req.file) cleanupFile(req.file.path);
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.get('/api/web3/status', async (req, res) => {
  try {
    const status = await web3Service.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Web3 status error:', error);
    res.status(500).json({ error: 'Failed to fetch web3 status' });
  }
});

// Browser-friendly RPC check endpoint (Hardhat RPC itself expects JSON-RPC POST requests).
app.get('/api/web3/rpc-health', async (req, res) => {
  try {
    const status = await web3Service.getStatus();

    if (!status.ready) {
      return res.status(503).json({
        working: false,
        message: 'Hardhat RPC is not ready',
        reason: status.reason || 'Unknown',
        expectedRpcUrl: process.env.WEB3_RPC_URL || 'http://127.0.0.1:8545',
        note: 'Opening the RPC URL in a browser uses GET, but JSON-RPC nodes expect POST with a JSON body.'
      });
    }

    const latestBlock = await web3Service.provider.getBlockNumber();

    return res.json({
      working: true,
      message: 'Hardhat RPC is working correctly',
      expectedRpcUrl: process.env.WEB3_RPC_URL || 'http://127.0.0.1:8545',
      chainId: status.chainId,
      latestBlock,
      contractAddress: status.contractAddress,
      note: 'If you open the RPC URL directly in browser and see a parse error, that is expected behavior for JSON-RPC endpoints.'
    });
  } catch (error) {
    console.error('RPC health error:', error);
    return res.status(500).json({
      working: false,
      message: 'Failed to check Hardhat RPC health',
      error: error.message
    });
  }
});

app.get('/api/web3/verify/:fileHash', async (req, res) => {
  try {
    const verification = await web3Service.verifyFileHash(req.params.fileHash);
    res.json(verification);
  } catch (error) {
    console.error('Web3 verify error:', error);
    res.status(500).json({ error: 'Failed to verify hash on chain' });
  }
});

// User: Get all available registered reference files
app.get('/api/files/registered', (req, res) => {
  try {
    const files = db.getAllOriginals();
    res.json({
      success: true,
      count: files.length,
      files: files.map(file => ({
        fileHash: file.fileHash,
        filename: file.filename,
        size: file.size,
        uploadedAt: file.uploadedAt,
        verifications: file.verified,
        integrity: file.integrity
      }))
    });
  } catch (error) {
    console.error('Error fetching registered files:', error);
    res.status(500).json({ error: 'Failed to fetch registered files' });
  }
});

// ===================== BLOCKCHAIN ENDPOINTS =====================

app.get('/api/blockchain', (req, res) => {
  try {
    web3Service
      .getChainSnapshot()
      .then(snapshot => res.json(snapshot))
      .catch(error => {
        console.error('Blockchain error:', error);
        res.status(500).json({ error: 'Failed to retrieve blockchain' });
      });
  } catch (error) {
    console.error('Blockchain error:', error);
    res.status(500).json({ error: 'Failed to retrieve blockchain' });
  }
});

app.get('/api/files', (req, res) => {
  try {
    const files = Array.from(fileRegistry.values()).map(entry => ({
      fileHash: entry.fileInfo.fileHash,
      filename: entry.fileInfo.filename,
      size: entry.fileInfo.size,
      uploadedAt: entry.fileInfo.uploadedAt,
      blockIndex: entry.blockIndex,
      blockHash: entry.blockHash,
      registryId: entry.registryId,
      transactionId: entry.transactionId,
      verified: true
    }));

    res.json({ files, totalFiles: files.length });
  } catch (error) {
    console.error('Files error:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

app.get('/api/block/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const blockInfo = await web3Service.getDetailedBlockInfo(index);

    if (!blockInfo) {
      return res.status(404).json({ error: 'Block not found' });
    }

    res.json(blockInfo);
  } catch (error) {
    console.error('Block info error:', error);
    res.status(500).json({ error: 'Failed to retrieve block information' });
  }
});

app.post('/api/recheck', express.json(), async (req, res) => {
  try {
    const { fileHash, blockIndex } = req.body;

    if (!fileHash || blockIndex === undefined) {
      return res.status(400).json({ error: 'File hash and block index required' });
    }

    const [isIntact, blockInfo, chainSnapshot, verificationPath] = await Promise.all([
      web3Service.verifyFileIntegrity(fileHash, blockIndex),
      web3Service.getDetailedBlockInfo(blockIndex),
      web3Service.getChainSnapshot(),
      web3Service.verifyBlockchain(blockIndex, 10)
    ]);

    res.json({
      fileHash,
      blockIndex,
      isIntact,
      blockValid: Boolean(blockInfo?.isValid),
      chainValid: Boolean(chainSnapshot?.isValid),
      verificationPath,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recheck error:', error);
    res.status(500).json({ error: 'Recheck failed' });
  }
});

app.get('/api/mining-stats', async (req, res) => {
  try {
    const stats = await web3Service.getMiningStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Mining stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve mining statistics' });
  }
});

app.get('/api/mempool', async (req, res) => {
  try {
    const mempool = await web3Service.getMempool();
    res.json(mempool);
  } catch (error) {
    console.error('Mempool error:', error);
    res.status(500).json({ error: 'Failed to retrieve mempool' });
  }
});

app.get('/api/verify-blockchain/:depth', async (req, res) => {
  try {
    const depth = parseInt(req.params.depth) || 10;
    const status = await web3Service.getStatus();

    if (!status.ready) {
      return res.status(503).json({ error: status.reason || 'Web3 service unavailable' });
    }

    const latestBlockIndex = status.latestBlock;

    const verification = await web3Service.verifyBlockchain(latestBlockIndex, depth);

    res.json({
      verification,
      chainValid: verification.valid,
      totalBlocks: latestBlockIndex + 1
    });
  } catch (error) {
    console.error('Chain verification error:', error);
    res.status(500).json({ error: 'Chain verification failed' });
  }
});

app.get('/api/transaction/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const result = await web3Service.findTransactionByFileHash(hash);

    if (!result) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      transaction: result.transaction,
      blockIndex: result.blockIndex,
      blockHash: result.blockHash,
      blockDetails: await web3Service.getDetailedBlockInfo(result.blockIndex)
    });
  } catch (error) {
    console.error('Transaction lookup error:', error);
    res.status(500).json({ error: 'Transaction lookup failed' });
  }
});

// Serve index.html for all non-API routes (SPA routing) when build is present.
if (hasClientBuild) {
  app.get('*', (req, res) => {
    return res.sendFile(clientIndexPath);
  });
} else {
  // In development, backend can run without forcing frontend build artifacts.
  app.get('/', (req, res) => {
    return res.json({
      message: 'Backend is running. Start the client dev server with: cd client && npm run dev',
      apiBase: '/api',
      frontendBuildDetected: false
    });
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🔗 Blockchain Server running on http://localhost:${PORT}`);
  console.log('📊 Real EVM blockchain backend enabled (no simulated chain)\n');
});
