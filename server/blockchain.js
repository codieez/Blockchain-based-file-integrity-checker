import crypto from 'crypto';

class Transaction {
  constructor(fileHash, filename, size, timestamp) {
    this.fileHash = fileHash;
    this.filename = filename;
    this.size = size;
    this.timestamp = timestamp;
    this.id = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(this.fileHash + this.filename + this.size + this.timestamp)
      .digest('hex');
  }
}

class Block {
  constructor(index, timestamp, transactions, previousHash, difficulty = 2) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.difficulty = difficulty;
    this.nonce = 0;
    this.minerReward = 10;
    this.merkleRoot = this.calculateMerkleRoot();
    this.hash = this.calculateHash();
    this.miningStats = {
      startTime: Date.now(),
      endTime: null,
      iterationsToMine: 0
    };
  }

  calculateMerkleRoot() {
    if (this.transactions.length === 0) {
      return crypto.createHash('sha256').update('0').digest('hex');
    }

    let hashes = this.transactions.map(tx => tx.id);
    
    while (hashes.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const combined = hashes[i] + (hashes[i + 1] || hashes[i]);
        const hash = crypto.createHash('sha256').update(combined).digest('hex');
        nextLevel.push(hash);
      }
      hashes = nextLevel;
    }

    return hashes[0];
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
        this.timestamp +
        this.merkleRoot +
        this.previousHash +
        this.difficulty +
        this.nonce
      )
      .digest('hex');
  }

  mineBlock() {
    const target = '0'.repeat(this.difficulty);
    this.miningStats.startTime = Date.now();

    while (this.hash.substring(0, this.difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
      this.miningStats.iterationsToMine++;
    }

    this.miningStats.endTime = Date.now();
    this.miningStats.miningTime = this.miningStats.endTime - this.miningStats.startTime;

    return this.miningStats;
  }

  isValid() {
    if (this.hash !== this.calculateHash()) {
      return false;
    }

    if (this.merkleRoot !== this.calculateMerkleRoot()) {
      return false;
    }

    const target = '0'.repeat(this.difficulty);
    if (!this.hash.startsWith(target)) {
      return false;
    }

    return true;
  }

  getBlockSize() {
    const blockData = JSON.stringify({
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions,
      previousHash: this.previousHash,
      hash: this.hash,
      nonce: this.nonce
    });
    return blockData.length;
  }
}

export class Blockchain {
  constructor(initialDifficulty = 2) {
    this.chain = [];
    this.difficulty = initialDifficulty;
    this.minDifficulty = 2;
    this.maxDifficulty = 6;
    this.targetMiningTime = 2000;
    this.blocksPerAdjustment = 5;
    this.mempool = [];
    this.miningStats = [];
    this.createGenesisBlock();
  }

  createGenesisBlock() {
    const genesisBlock = new Block(
      0,
      Date.now(),
      [new Transaction('0x0', 'Genesis Block', 0, Date.now())],
      '0x0',
      this.difficulty
    );
    genesisBlock.mineBlock();
    this.chain.push(genesisBlock);
    this.miningStats.push({
      blockIndex: 0,
      ...genesisBlock.miningStats,
      difficulty: this.difficulty
    });
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransactionToMempool(fileHash, filename, size) {
    const transaction = new Transaction(fileHash, filename, size, Date.now());
    this.mempool.push(transaction);
    return transaction;
  }

  mineBlock(minerAddress = 'System') {
    if (this.mempool.length === 0) {
      const transaction = new Transaction(
        crypto.randomBytes(32).toString('hex'),
        'Empty Block',
        0,
        Date.now()
      );
      this.mempool.push(transaction);
    }

    const blockData = this.mempool.slice();
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      blockData,
      this.getLatestBlock().hash,
      this.difficulty
    );

    const miningStats = newBlock.mineBlock();
    this.chain.push(newBlock);
    this.mempool = [];

    this.miningStats.push({
      blockIndex: newBlock.index,
      ...miningStats,
      difficulty: this.difficulty,
      miner: minerAddress
    });

    this.adjustDifficulty();

    return newBlock;
  }

  adjustDifficulty() {
    if (this.chain.length % this.blocksPerAdjustment !== 0) return;

    const lastBlockIndex = this.chain.length - 1;
    const referenceBlockIndex = Math.max(0, lastBlockIndex - this.blocksPerAdjustment);
    const recentBlocks = this.chain.slice(referenceBlockIndex + 1);

    let totalMiningTime = 0;
    for (let i = 1; i < recentBlocks.length; i++) {
      const blockTime = recentBlocks[i].timestamp - recentBlocks[i - 1].timestamp;
      totalMiningTime += blockTime;
    }

    const averageMiningTime = totalMiningTime / (recentBlocks.length - 1);

    if (averageMiningTime < this.targetMiningTime / 2 && this.difficulty < this.maxDifficulty) {
      this.difficulty++;
    } else if (averageMiningTime > this.targetMiningTime * 2 && this.difficulty > this.minDifficulty) {
      this.difficulty = Math.max(this.minDifficulty, this.difficulty - 1);
    }
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (!currentBlock.isValid()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      if (currentBlock.timestamp <= previousBlock.timestamp) {
        return false;
      }

      if (currentBlock.index !== previousBlock.index + 1) {
        return false;
      }
    }
    return true;
  }

  verifyBlockchain(index, depth = 10) {
    if (index < 0 || index >= this.chain.length) {
      return { valid: false, reason: 'Invalid block index' };
    }

    const blockIndex = Math.max(0, index - depth);
    const verificationsRequired = Math.min(index + 1, depth);
    const verificationsChecked = index - blockIndex + 1;

    const validationResult = {
      blockIndex: index,
      valid: true,
      verificationsChecked,
      verificationsRequired,
      details: []
    };

    for (let i = blockIndex; i <= index; i++) {
      const block = this.chain[i];
      const isBlockValid = block.isValid();
      
      const linkValid = i === 0 || 
        (this.chain[i].previousHash === this.chain[i - 1].hash &&
         this.chain[i].timestamp > this.chain[i - 1].timestamp);

      validationResult.details.push({
        index: i,
        valid: isBlockValid && linkValid,
        hash: block.hash,
        previousHash: block.previousHash
      });

      if (!isBlockValid || !linkValid) {
        validationResult.valid = false;
      }
    }

    return validationResult;
  }

  getBlockchain() {
    return this.chain;
  }

  verifyFileIntegrity(fileHash, blockIndex) {
    if (blockIndex < 0 || blockIndex >= this.chain.length) {
      return false;
    }
    const block = this.chain[blockIndex];
    return block.transactions.some(tx => tx.fileHash === fileHash);
  }

  findBlockByFileHash(fileHash) {
    return this.chain.find(block =>
      block.transactions.some(tx => tx.fileHash === fileHash)
    );
  }

  findTransactionByFileHash(fileHash) {
    for (const block of this.chain) {
      const transaction = block.transactions.find(tx => tx.fileHash === fileHash);
      if (transaction) {
        return {
          transaction,
          blockIndex: block.index,
          blockHash: block.hash
        };
      }
    }
    return null;
  }

  getChainStats() {
    const totalBlockSize = this.chain.reduce((sum, block) => sum + block.getBlockSize(), 0);
    const totalTransactions = this.chain.reduce((sum, block) => sum + block.transactions.length, 0);
    
    let avgMiningTime = 0;
    if (this.miningStats.length > 0) {
      avgMiningTime = this.miningStats.reduce((sum, stat) => sum + stat.miningTime, 0) / this.miningStats.length;
    }

    return {
      totalBlocks: this.chain.length,
      totalFiles: this.chain.length - 1,
      totalTransactions,
      totalBlockSize,
      currentDifficulty: this.difficulty,
      minDifficulty: this.minDifficulty,
      maxDifficulty: this.maxDifficulty,
      isValid: this.isChainValid(),
      mempoolSize: this.mempool.length,
      averageMiningTime: Math.round(avgMiningTime),
      estimatedNextTime: this.estimateNextMiningTime()
    };
  }

  estimateNextMiningTime() {
    if (this.miningStats.length === 0) return 0;
    const recentStats = this.miningStats.slice(-5);
    const avgTime = recentStats.reduce((sum, stat) => sum + stat.miningTime, 0) / recentStats.length;
    return Math.round(avgTime * (this.difficulty / recentStats[0].difficulty));
  }

  getDetailedBlockInfo(blockIndex) {
    if (blockIndex < 0 || blockIndex >= this.chain.length) {
      return null;
    }

    const block = this.chain[blockIndex];
    return {
      index: block.index,
      timestamp: block.timestamp,
      hash: block.hash,
      previousHash: block.previousHash,
      merkleRoot: block.merkleRoot,
      difficulty: block.difficulty,
      nonce: block.nonce,
      transactions: block.transactions.map(tx => ({
        id: tx.id,
        fileHash: tx.fileHash,
        filename: tx.filename,
        size: tx.size
      })),
      miningStats: block.miningStats,
      blockSize: block.getBlockSize(),
      isValid: block.isValid()
    };
  }

  getMiningStatistics() {
    return {
      totalBlocksMined: this.miningStats.length,
      averageMiningTime: this.miningStats.length > 0
        ? Math.round(this.miningStats.reduce((sum, stat) => sum + stat.miningTime, 0) / this.miningStats.length)
        : 0,
      totalIterations: this.miningStats.reduce((sum, stat) => sum + stat.iterationsToMine, 0),
      difficultyHistory: this.miningStats.map(stat => ({
        blockIndex: stat.blockIndex,
        difficulty: stat.difficulty,
        miningTime: stat.miningTime
      })),
      miningStats: this.miningStats
    };
  }

  simulateAttack(targetBlockIndex) {
    if (targetBlockIndex < 1 || targetBlockIndex >= this.chain.length) {
      return { success: false, reason: 'Cannot attack genesis or latest blocks' };
    }

    const targetBlock = this.chain[targetBlockIndex];
    const originalHash = targetBlock.hash;

    targetBlock.transactions[0].fileHash = 'MANIPULATED_HASH';
    targetBlock.hash = targetBlock.calculateHash();

    const validBefore = this.chain[targetBlockIndex].hash === originalHash;
    const validAfter = this.isChainValid();

    targetBlock.transactions[0].fileHash = 'RESTORED';
    targetBlock.hash = originalHash;

    return {
      success: !validAfter,
      blockTargeted: targetBlockIndex,
      chainIsNowValid: this.isChainValid(),
      message: 'Blockchain detected tampering and marked as invalid'
    };
  }
}

export default Blockchain;
