import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_LOCAL_CHAIN_ID = 31337;
const DEFAULT_LOCAL_RPC_URL = 'http://127.0.0.1:8545';
const DEFAULT_LOCAL_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

export class Web3Service {
  constructor() {
    const anchoringFlag = String(process.env.ENABLE_WEB3_ANCHORING ?? 'true').toLowerCase();
    // Simulation mode is deprecated: keep backend on real chain path by default.
    this.enabled = anchoringFlag !== 'off';
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.WEB3_CONTRACT_ADDRESS || null;
    this.chainId = Number(process.env.WEB3_CHAIN_ID || DEFAULT_LOCAL_CHAIN_ID);
    this.scanBlockLimit = Number(process.env.WEB3_SCAN_BLOCK_LIMIT || 200);
    this.lastError = null;
    this.initializationPromise = this.initialize();
  }

  async initialize() {
    if (!this.enabled) {
      this.lastError =
        'Web3 anchoring is disabled. Set ENABLE_WEB3_ANCHORING=true to use Hardhat/EVM backend.';
      return;
    }

    try {
      const rpcUrl = process.env.WEB3_RPC_URL || DEFAULT_LOCAL_RPC_URL;
      const privateKey = process.env.WEB3_PRIVATE_KEY || DEFAULT_LOCAL_PRIVATE_KEY;

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.signer = new ethers.Wallet(privateKey, this.provider);

      if (!this.contractAddress) {
        this.contractAddress = await this.deployContract();
      }

      this.contract = new ethers.Contract(this.contractAddress, FILE_INTEGRITY_ABI, this.signer);
      await this.provider.getBlockNumber();
    } catch (error) {
      this.lastError = `Web3 initialization failed: ${error.message}. Ensure local chain is running (npm run chain:node) and contract is deployed (npm run chain:deploy:local:enable).`;
      this.contract = null;
      console.error('Web3Service initialization failed:', error.message);
    }
  }

  async deployContract() {
    const artifactPath = path.join(
      __dirname,
      '../artifacts/contracts/FileIntegrityRegistry.sol/FileIntegrityRegistry.json'
    );

    if (!fs.existsSync(artifactPath)) {
      throw new Error('Contract artifact not found. Run: npm run chain:compile');
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, this.signer);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    const deployedAddress = await contract.getAddress();

    console.log(`Auto-deployed FileIntegrityRegistry at ${deployedAddress}`);
    return deployedAddress;
  }

  async ensureReady() {
    await this.initializationPromise;
    return this.isReady();
  }

  isReady() {
    return this.enabled && !!this.provider && !!this.signer && !!this.contract;
  }

  async getStatus() {
    if (!(await this.ensureReady())) {
      return {
        enabled: this.enabled,
        ready: false,
        reason: this.lastError || 'Web3 service unavailable',
        hints: [
          'Run: npm run chain:node',
          'Run: npm run chain:deploy:local:enable',
          'Restart backend: npm run server'
        ]
      };
    }

    const [network, signerAddress, latestBlock] = await Promise.all([
      this.provider.getNetwork(),
      this.signer.getAddress(),
      this.provider.getBlockNumber()
    ]);

    return {
      enabled: true,
      ready: true,
      chainId: Number(network.chainId),
      expectedChainId: this.chainId,
      signerAddress,
      contractAddress: this.contractAddress,
      latestBlock
    };
  }

  async recordFileOnChain({ fileHash, filename, size }) {
    if (!(await this.ensureReady())) {
      return {
        anchored: false,
        reason: this.lastError || 'Web3 service unavailable'
      };
    }

    try {
      const tx = await this.contract.recordFile(fileHash, filename, size);
      const receipt = await tx.wait();

      return {
        anchored: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        gasUsed: receipt.gasUsed.toString(),
        contractAddress: this.contractAddress
      };
    } catch (error) {
      return {
        anchored: false,
        reason: error.message
      };
    }
  }

  async verifyFileHash(fileHash) {
    if (!(await this.ensureReady())) {
      return {
        available: false,
        verified: false,
        reason: this.lastError || 'Web3 service unavailable'
      };
    }

    try {
      const exists = await this.contract.verifyFileHash(fileHash);
      return {
        available: true,
        verified: Boolean(exists)
      };
    } catch (error) {
      return {
        available: true,
        verified: false,
        reason: error.message
      };
    }
  }

  parseContractTx(tx) {
    if (!tx?.to || tx.to.toLowerCase() !== this.contractAddress?.toLowerCase()) {
      return null;
    }

    try {
      const parsed = this.contract.interface.parseTransaction({ data: tx.data, value: tx.value });
      if (!parsed || parsed.name !== 'recordFile') return null;

      return {
        id: tx.hash,
        txHash: tx.hash,
        fileHash: parsed.args[0],
        filename: parsed.args[1],
        size: Number(parsed.args[2]),
        from: tx.from,
        to: tx.to
      };
    } catch {
      return null;
    }
  }

  async getMempool() {
    if (!(await this.ensureReady())) {
      return { mempoolSize: 0, transactions: [] };
    }

    try {
      const pending = await this.provider.send('eth_getBlockByNumber', ['pending', true]);
      const pendingTxs = Array.isArray(pending?.transactions) ? pending.transactions : [];

      const transactions = pendingTxs
        .map(tx => this.parseContractTx(tx))
        .filter(Boolean)
        .map(tx => ({
          ...tx,
          timestamp: Date.now()
        }));

      return {
        mempoolSize: transactions.length,
        transactions
      };
    } catch {
      return { mempoolSize: 0, transactions: [] };
    }
  }

  async getBlockHeaders(blockNumbers) {
    const headers = await Promise.all(
      blockNumbers.map(n => this.provider.send('eth_getBlockByNumber', [ethers.toQuantity(n), false]))
    );

    return new Map(
      headers
        .filter(Boolean)
        .map(header => [Number(header.number), header])
    );
  }

  async getChainSnapshot(maxBlocks = 30) {
    if (!(await this.ensureReady())) {
      throw new Error(this.lastError || 'Web3 service unavailable');
    }

    const latest = await this.provider.getBlockNumber();
    const start = Math.max(0, latest - maxBlocks + 1);
    const blockNumbers = [];
    for (let i = start; i <= latest; i++) blockNumbers.push(i);

    const [blocks, blockHeaders] = await Promise.all([
      Promise.all(blockNumbers.map(n => this.provider.getBlock(n, true))),
      this.getBlockHeaders(blockNumbers)
    ]);

    const chain = blocks.map((block, idx) => {
      const contractTxs = (block.transactions || [])
        .map(tx => this.parseContractTx(tx))
        .filter(Boolean);

      const blockSize = JSON.stringify({
        number: block.number,
        hash: block.hash,
        parentHash: block.parentHash,
        transactions: contractTxs
      }).length;

      const header = blockHeaders.get(Number(block.number));

      return {
        index: Number(block.number),
        timestamp: Number(block.timestamp) * 1000,
        hash: block.hash,
        previousHash: block.parentHash,
        merkleRoot: header?.transactionsRoot || null,
        difficulty: Number(block.difficulty || 0),
        transactionCount: contractTxs.length,
        blockSize,
        nonce: Number(block.nonce || 0),
        isValid:
          idx === 0 ||
          (block.parentHash === blocks[idx - 1].hash && Number(block.number) === Number(blocks[idx - 1].number) + 1)
      };
    });

    const minedSegments = [];
    for (let i = 1; i < blocks.length; i++) {
      const ms = Math.max(0, Number(blocks[i].timestamp) - Number(blocks[i - 1].timestamp)) * 1000;
      minedSegments.push(ms);
    }

    const averageMiningTime = minedSegments.length
      ? Math.round(minedSegments.reduce((sum, val) => sum + val, 0) / minedSegments.length)
      : 0;

    const totalTransactions = chain.reduce((sum, b) => sum + b.transactionCount, 0);
    const totalBlockSize = chain.reduce((sum, b) => sum + b.blockSize, 0);
    const mempool = await this.getMempool();

    return {
      stats: {
        totalBlocks: chain.length,
        totalFiles: totalTransactions,
        totalTransactions,
        totalBlockSize,
        currentDifficulty: Number(blocks[blocks.length - 1]?.difficulty || 0),
        minDifficulty: 0,
        maxDifficulty: Number(blocks[blocks.length - 1]?.difficulty || 0),
        isValid: chain.every(block => block.isValid),
        mempoolSize: mempool.mempoolSize,
        averageMiningTime,
        estimatedNextTime: averageMiningTime
      },
      chain,
      isValid: chain.every(block => block.isValid)
    };
  }

  async getMiningStatistics(maxBlocks = 100) {
    if (!(await this.ensureReady())) {
      throw new Error(this.lastError || 'Web3 service unavailable');
    }

    const latest = await this.provider.getBlockNumber();
    const start = Math.max(0, latest - maxBlocks + 1);
    const blockNumbers = [];
    for (let i = start; i <= latest; i++) blockNumbers.push(i);

    const blocks = await Promise.all(blockNumbers.map(n => this.provider.getBlock(n, true)));

    const difficultyHistory = blocks.map((block, idx) => {
      const previous = idx > 0 ? blocks[idx - 1] : null;
      const miningTime = previous
        ? Math.max(0, Number(block.timestamp) - Number(previous.timestamp)) * 1000
        : 0;

      return {
        blockIndex: Number(block.number),
        difficulty: Number(block.difficulty || 0),
        miningTime
      };
    });

    const averageMiningTime = difficultyHistory.length > 1
      ? Math.round(
          difficultyHistory.slice(1).reduce((sum, stat) => sum + stat.miningTime, 0) /
            (difficultyHistory.length - 1)
        )
      : 0;

    const totalIterations = blocks.reduce((sum, block) => sum + (block.transactions?.length || 0), 0);

    return {
      totalBlocksMined: blocks.length,
      averageMiningTime,
      totalIterations,
      difficultyHistory,
      miningStats: difficultyHistory
    };
  }

  async getDetailedBlockInfo(blockIndex) {
    if (!(await this.ensureReady())) {
      throw new Error(this.lastError || 'Web3 service unavailable');
    }

    const [block, blockHeader] = await Promise.all([
      this.provider.getBlock(Number(blockIndex), true),
      this.provider.send('eth_getBlockByNumber', [ethers.toQuantity(Number(blockIndex)), false])
    ]);
    if (!block) return null;

    const transactions = (block.transactions || [])
      .map(tx => this.parseContractTx(tx))
      .filter(Boolean);

    const blockSize = JSON.stringify({
      number: block.number,
      hash: block.hash,
      parentHash: block.parentHash,
      transactions
    }).length;

    const previousBlock = block.number > 0 ? await this.provider.getBlock(Number(block.number) - 1) : null;
    const miningTime = previousBlock
      ? Math.max(0, Number(block.timestamp) - Number(previousBlock.timestamp)) * 1000
      : 0;

    return {
      index: Number(block.number),
      timestamp: Number(block.timestamp) * 1000,
      hash: block.hash,
      previousHash: block.parentHash,
      merkleRoot: blockHeader?.transactionsRoot || null,
      difficulty: Number(block.difficulty || 0),
      nonce: Number(block.nonce || 0),
      transactions,
      miningStats: {
        miningTime,
        iterationsToMine: block.transactions?.length || 0
      },
      blockSize,
      isValid: previousBlock ? block.parentHash === previousBlock.hash : true
    };
  }

  async verifyBlockchain(index, depth = 10) {
    if (!(await this.ensureReady())) {
      return { valid: false, reason: this.lastError || 'Web3 service unavailable' };
    }

    const latest = await this.provider.getBlockNumber();
    if (index < 0 || index > latest) {
      return { valid: false, reason: 'Invalid block index' };
    }

    const start = Math.max(0, index - depth + 1);
    const blockNumbers = [];
    for (let i = start; i <= index; i++) blockNumbers.push(i);

    const blocks = await Promise.all(blockNumbers.map(n => this.provider.getBlock(n)));

    let valid = true;
    const details = blocks.map((block, idx) => {
      const linked = idx === 0 || block.parentHash === blocks[idx - 1].hash;
      if (!linked) valid = false;

      return {
        index: Number(block.number),
        valid: linked,
        hash: block.hash,
        previousHash: block.parentHash
      };
    });

    return {
      blockIndex: index,
      valid,
      verificationsChecked: blocks.length,
      verificationsRequired: Math.min(depth, index + 1),
      details
    };
  }

  async verifyFileIntegrity(fileHash, blockIndex) {
    if (!(await this.ensureReady())) return false;

    const block = await this.provider.getBlock(Number(blockIndex), true);
    if (!block) return false;

    return (block.transactions || [])
      .map(tx => this.parseContractTx(tx))
      .filter(Boolean)
      .some(tx => tx.fileHash === fileHash);
  }

  async findTransactionByFileHash(fileHash) {
    if (!(await this.ensureReady())) return null;

    const latest = await this.provider.getBlockNumber();
    const start = Math.max(0, latest - this.scanBlockLimit + 1);

    for (let blockNumber = latest; blockNumber >= start; blockNumber--) {
      const block = await this.provider.getBlock(blockNumber, true);
      const match = (block.transactions || [])
        .map(tx => this.parseContractTx(tx))
        .filter(Boolean)
        .find(tx => tx.fileHash === fileHash);

      if (match) {
        return {
          transaction: {
            id: match.id,
            fileHash: match.fileHash,
            filename: match.filename,
            size: match.size,
            timestamp: Number(block.timestamp) * 1000,
            txHash: match.txHash
          },
          blockIndex: Number(block.number),
          blockHash: block.hash
        };
      }
    }

    return null;
  }
}

const FILE_INTEGRITY_ABI = [
  'event FileRecorded(string indexed fileHash, string filename, uint256 size, uint256 recordedAt, address indexed recordedBy)',
  'function recordFile(string fileHash, string filename, uint256 size) external',
  'function verifyFileHash(string fileHash) external view returns (bool)',
  'function getRecord(string fileHash) external view returns (tuple(string fileHash, string filename, uint256 size, uint256 recordedAt, address recordedBy))'
];
