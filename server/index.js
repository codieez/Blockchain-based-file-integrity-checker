import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { Blockchain } from './blockchain.js';
import { calculateFileHash, getFileInfo, cleanupFile, verifyFileChain } from './fileHandler.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const blockchain = new Blockchain(2);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

app.use(cors());
app.use(express.json());

// Serve static files from the client build directory
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

const fileRegistry = new Map();

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileInfo = getFileInfo(req.file.path, req.file.originalname);
    const registryId = uuidv4();

    blockchain.addTransactionToMempool(
      fileInfo.fileHash,
      fileInfo.filename,
      fileInfo.size
    );

    const block = blockchain.mineBlock('User');

    fileRegistry.set(fileInfo.fileHash, {
      fileInfo,
      blockIndex: block.index,
      blockHash: block.hash,
      registryId,
      transactionId: block.transactions.find(tx => tx.fileHash === fileInfo.fileHash).id
    });

    res.json({
      success: true,
      data: {
        fileHash: fileInfo.fileHash,
        filename: fileInfo.filename,
        size: fileInfo.size,
        uploadedAt: fileInfo.uploadedAt,
        blockIndex: block.index,
        blockHash: block.hash,
        registryId,
        miningStats: block.miningStats,
        transactionId: block.transactions.find(tx => tx.fileHash === fileInfo.fileHash).id
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file) cleanupFile(req.file.path);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.post('/api/verify', express.json(), (req, res) => {
  try {
    const { fileHash } = req.body;

    if (!fileHash) {
      return res.status(400).json({ error: 'File hash required' });
    }

    const result = blockchain.findTransactionByFileHash(fileHash);

    if (!result) {
      return res.json({
        verified: false,
        message: 'File not found in blockchain'
      });
    }

    const registered = fileRegistry.get(fileHash);
    const verificationResult = blockchain.verifyBlockchain(result.blockIndex, 10);

    res.json({
      verified: true,
      verificationData: {
        transaction: result.transaction,
        blockIndex: result.blockIndex,
        blockHash: result.blockHash,
        blockValid: blockchain.chain[result.blockIndex].isValid(),
        chainIntegrity: blockchain.isChainValid(),
        verificationPath: verificationResult,
        ...registered
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

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
