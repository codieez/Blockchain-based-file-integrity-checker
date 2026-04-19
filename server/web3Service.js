import { ethers } from 'ethers';

const DEFAULT_CHAIN_ID = 11155111;

export class Web3Service {
  constructor() {
    this.enabled = process.env.ENABLE_WEB3_ANCHORING === 'true';
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.chainId = Number(process.env.WEB3_CHAIN_ID || DEFAULT_CHAIN_ID);
    this.lastError = null;

    if (this.enabled) {
      this.initialize();
    }
  }

  initialize() {
    try {
      const rpcUrl = process.env.WEB3_RPC_URL;
      const privateKey = process.env.WEB3_PRIVATE_KEY;
      const contractAddress = process.env.WEB3_CONTRACT_ADDRESS;

      if (!rpcUrl || !privateKey || !contractAddress) {
        throw new Error('Missing WEB3_RPC_URL, WEB3_PRIVATE_KEY, or WEB3_CONTRACT_ADDRESS');
      }

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(contractAddress, FILE_INTEGRITY_ABI, this.signer);
    } catch (error) {
      this.enabled = false;
      this.lastError = error.message;
      console.error('Web3Service initialization failed:', error.message);
    }
  }

  isReady() {
    return this.enabled && !!this.provider && !!this.signer && !!this.contract;
  }

  async getStatus() {
    if (!this.enabled) {
      return {
        enabled: false,
        ready: false,
        reason: this.lastError || 'Web3 anchoring disabled by configuration'
      };
    }

    if (!this.isReady()) {
      return {
        enabled: true,
        ready: false,
        reason: this.lastError || 'Web3 service not initialized'
      };
    }

    const [network, signerAddress] = await Promise.all([
      this.provider.getNetwork(),
      this.signer.getAddress()
    ]);

    return {
      enabled: true,
      ready: true,
      chainId: Number(network.chainId),
      expectedChainId: this.chainId,
      signerAddress
    };
  }

  async recordFileOnChain({ fileHash, filename, size }) {
    if (!this.isReady()) {
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
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      return {
        anchored: false,
        reason: error.message
      };
    }
  }

  async verifyFileHash(fileHash) {
    if (!this.isReady()) {
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
}

const FILE_INTEGRITY_ABI = [
  'function recordFile(string fileHash, string filename, uint256 size) external',
  'function verifyFileHash(string fileHash) external view returns (bool)',
  'function getRecord(string fileHash) external view returns (tuple(string fileHash, string filename, uint256 size, uint256 recordedAt, address recordedBy))'
];
