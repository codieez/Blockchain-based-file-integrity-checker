import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { Blockchain } from './blockchain.js';
import { getFileInfo, cleanupFile } from './fileHandler.js';
import { Database } from './database.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const blockchain = new Blockchain(2);
const db = new Database();

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

// Serve static files from the client build directory
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

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
app.post('/api/admin/upload-original', adminAuth, uploadOriginal.single('file'), (req, res) => {
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

    // Add to blockchain
    blockchain.addTransactionToMempool(fileInfo.fileHash, fileInfo.filename, fileInfo.size);
    const block = blockchain.mineBlock('Admin');

    res.json({
      success: true,
      message: 'Original reference file uploaded and stored',
      data: {
        ...originalFile,
        blockIndex: block.index,
        blockHash: block.hash
      }
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
app.post('/api/verify-file', uploadVerify.single('file'), (req, res) => {
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
    const stats = blockchain.getChainStats();
    const chain = blockchain.getBlockchain().map(block => ({
      index: block.index,
      timestamp: block.timestamp,
      hash: block.hash,
      previousHash: block.previousHash,
      merkleRoot: block.merkleRoot,
      difficulty: block.difficulty,
      transactionCount: block.transactions.length,
      blockSize: block.getBlockSize(),
      nonce: block.nonce,
      isValid: block.isValid()
    }));

    res.json({
      stats,
      chain,
      isValid: blockchain.isChainValid()
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
      verified: blockchain.verifyFileIntegrity(entry.fileInfo.fileHash, entry.blockIndex)
    }));

    res.json({ files, totalFiles: files.length });
  } catch (error) {
    console.error('Files error:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

app.get('/api/block/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const blockInfo = blockchain.getDetailedBlockInfo(index);

    if (!blockInfo) {
      return res.status(404).json({ error: 'Block not found' });
    }

    res.json(blockInfo);
  } catch (error) {
    console.error('Block info error:', error);
    res.status(500).json({ error: 'Failed to retrieve block information' });
  }
});

app.post('/api/recheck', express.json(), (req, res) => {
  try {
    const { fileHash, blockIndex } = req.body;

    if (!fileHash || blockIndex === undefined) {
      return res.status(400).json({ error: 'File hash and block index required' });
    }

    const isIntact = blockchain.verifyFileIntegrity(fileHash, blockIndex);
    const blockValid = blockchain.chain[blockIndex]?.isValid() || false;
    const verificationPath = blockchain.verifyBlockchain(blockIndex, 10);

    res.json({
      fileHash,
      blockIndex,
      isIntact,
      blockValid,
      chainValid: blockchain.isChainValid(),
      verificationPath,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recheck error:', error);
    res.status(500).json({ error: 'Recheck failed' });
  }
});

app.get('/api/mining-stats', (req, res) => {
  try {
    const stats = blockchain.getMiningStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Mining stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve mining statistics' });
  }
});

app.get('/api/mempool', (req, res) => {
  try {
    const mempool = blockchain.mempool.map(tx => ({
      id: tx.id,
      fileHash: tx.fileHash,
      filename: tx.filename,
      size: tx.size,
      timestamp: tx.timestamp
    }));

    res.json({
      mempoolSize: mempool.length,
      transactions: mempool
    });
  } catch (error) {
    console.error('Mempool error:', error);
    res.status(500).json({ error: 'Failed to retrieve mempool' });
  }
});

app.post('/api/mine', express.json(), (req, res) => {
  try {
    const { minerAddress } = req.body;

    if (blockchain.mempool.length === 0) {
      return res.status(400).json({ error: 'No transactions in mempool to mine' });
    }

    const block = blockchain.mineBlock(minerAddress || 'Manual Miner');

    res.json({
      success: true,
      block: {
        index: block.index,
        hash: block.hash,
        timestamp: block.timestamp,
        difficulty: block.difficulty,
        nonce: block.nonce,
        transactionCount: block.transactions.length,
        miningStats: block.miningStats
      },
      chainStats: blockchain.getChainStats()
    });
  } catch (error) {
    console.error('Mining error:', error);
    res.status(500).json({ error: 'Mining failed' });
  }
});

app.post('/api/simulate-attack', express.json(), (req, res) => {
  try {
    const { blockIndex } = req.body;

    if (blockIndex === undefined) {
      return res.status(400).json({ error: 'Block index required' });
    }

    const result = blockchain.simulateAttack(blockIndex);

    res.json({
      attackSimulation: result,
      currentChainState: {
        isValid: blockchain.isChainValid(),
        totalBlocks: blockchain.chain.length
      }
    });
  } catch (error) {
    console.error('Attack simulation error:', error);
    res.status(500).json({ error: 'Attack simulation failed' });
  }
});

app.get('/api/verify-blockchain/:depth', (req, res) => {
  try {
    const depth = parseInt(req.params.depth) || 10;
    const latestBlockIndex = blockchain.chain.length - 1;

    const verification = blockchain.verifyBlockchain(latestBlockIndex, depth);

    res.json({
      verification,
      chainValid: blockchain.isChainValid(),
      totalBlocks: blockchain.chain.length
    });
  } catch (error) {
    console.error('Chain verification error:', error);
    res.status(500).json({ error: 'Chain verification failed' });
  }
});

app.get('/api/transaction/:hash', (req, res) => {
  try {
    const { hash } = req.params;
    const result = blockchain.findTransactionByFileHash(hash);

    if (!result) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      transaction: result.transaction,
      blockIndex: result.blockIndex,
      blockHash: result.blockHash,
      blockDetails: blockchain.getDetailedBlockInfo(result.blockIndex)
    });
  } catch (error) {
    console.error('Transaction lookup error:', error);
    res.status(500).json({ error: 'Transaction lookup failed' });
  }
});

// Serve index.html for all non-API routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🔗 Blockchain Server running on http://localhost:${PORT}`);
  console.log(`📊 Blockchain initialized with difficulty: ${blockchain.difficulty}`);
  console.log(`🔐 Genesis block created: ${blockchain.chain[0].hash.substring(0, 16)}...\n`);
});
