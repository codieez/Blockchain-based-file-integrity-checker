# Blockchain Simulation Documentation

This document explains the blockchain simulation features and educational concepts implemented in this project.

## Proof of Work (PoW) Implementation

### Mining Algorithm
The system implements a standard PoW mechanism using SHA-256 hashing:

```
while (hash.startsWith('0' * difficulty)) {
  nonce++
  hash = SHA256(block_header + nonce)
}
```

### Difficulty Adjustment
- **Initial Difficulty**: 2 leading zeros (difficulty = 2)
- **Min Difficulty**: 2
- **Max Difficulty**: 6
- **Adjustment Interval**: Every 5 blocks
- **Target Time Per Block**: 2000ms (2 seconds)

### Algorithm
```
if (avg_mining_time < 1000ms) difficulty++
if (avg_mining_time > 4000ms) difficulty--
```

This ensures consistent block times regardless of hardware speed.

## Merkle Tree Implementation

Each block maintains a Merkle tree of all transactions:

### Structure
```
        Root
       /    \
      /      \
     A        B
    / \      / \
   Tx1 Tx2  Tx3 Tx4
```

### Calculation
1. Hash each transaction individually
2. Pair hashes and hash the pairs
3. Repeat until single root hash remains
4. If odd number of items, duplicate last hash

### Purpose
- Provides integrity check for entire transaction set
- Allows quick verification of transaction inclusion
- Prevents modification of transactions

## Block Structure & Validation

### Block Components
```
{
  index: number                    // Block position in chain
  timestamp: number                // Time of creation
  transactions: Transaction[]      // Array of transactions
  previousHash: string             // Hash of previous block
  merkleRoot: string              // Root of merkle tree
  difficulty: number              // Difficulty of this block
  nonce: number                   // Proof of work value
  hash: string                    // Block hash
  miningStats: {                  // Mining performance metrics
    iterations: number
    time: number
  }
}
```

### Validation Checklist
When a block is validated, the system checks:
1. ✓ Hash is correct for block data + nonce
2. ✓ Hash meets difficulty requirement (leading zeros)
3. ✓ Merkle root matches all transactions
4. ✓ Timestamp is newer than previous block
5. ✓ Index is sequential

## Chain Validation

### Multi-Level Verification

**Level 1: Block Validation**
- Each block validates independently
- Checks hash and difficulty

**Level 2: Link Validation**
- Each block's `previousHash` matches previous block's hash
- Ensures chain continuity

**Level 3: Chronological Validation**
- Block timestamps are strictly increasing
- Prevents time manipulation

**Level 4: Structural Validation**
- Block indices are sequential
- Total block count is consistent

### Verification Depth
The system can verify backwards any depth:
```
verifyBlockchain(targetBlock, depth=10)
// Validates targetBlock and 9 blocks before it
```

## Transaction Pool (Mempool)

### Purpose
- Holds pending transactions before mining
- Simulates real blockchain transaction pools

### Lifecycle
```
Transaction Created → Added to Mempool → Mined into Block → Cleared from Pool
```

### API
- `GET /api/mempool` - View all pending transactions
- `POST /api/upload` - Adds file transaction to mempool
- `POST /api/mine` - Mines all mempool transactions

## File Integrity Verification

### Upload Process
1. File is hashed using SHA-256
2. Transaction created with file metadata
3. Transaction added to mempool
4. Block is automatically mined
5. Block added to blockchain

### Verification Process
1. User provides file hash
2. System searches blockchain for matching transaction
3. System finds containing block
4. System validates block (hash, difficulty, merkle root)
5. System validates block's chain position
6. Returns verification path

### Verification Data Returns
```
{
  verified: boolean
  fileHash: string
  blockIndex: number
  blockHash: string
  merkleRoot: string
  chainValid: boolean
  blockValid: boolean
  verificationPath: {
    details: [block, block, ...]
  }
}
```

## Mining Statistics

### Tracked Metrics
- **Total Blocks Mined**: Cumulative block count
- **Average Mining Time**: Mean time per block
- **Total Iterations**: Total hash computations
- **Difficulty History**: How difficulty changed over time

### Performance Analysis
```
Mining Efficiency = transactions_mined / total_iterations
Chain Stability = average_mining_time / target_mining_time
```

### Real-Time Monitoring
Dashboard displays:
- Current difficulty level
- Average mining time trend
- Block mining time distribution
- Difficulty adjustment history

## Attack Simulation

### Detected Attack Scenario
System can simulate what happens if past transaction is modified:

```
Original: Block[3] contains TX(fileHash="abc123")
Attack:   Modify to TX(fileHash="different")
          Now hash(Block[3]) != stored hash

Result:   Block[3] now invalid
          Block[4]'s previousHash no longer valid
          Entire chain from Block[3] onwards invalid
          Attack detected!
```

### Why Immutable
To change past transaction:
1. Must recalculate block's hash
2. Must meet new difficulty requirement (re-mine)
3. Must update all subsequent blocks' previousHash
4. Must re-mine all subsequent blocks
5. Exponential computational cost makes infeasible

## Educational Concepts Demonstrated

### Cryptographic Hashing
- SHA-256 function properties
- Hash collision resistance
- Avalanche effect

### Consensus Mechanism
- Proof of Work concept
- Difficulty adjustment
- Block time targeting

### Data Structures
- Merkle trees for integrity
- Linked lists for chain
- Hash maps for fast lookup

### Security Properties
- Immutability through hashing
- Tamper detection
- Computational difficulty

### Distributed Systems
- Node consensus
- Transaction propagation
- Chain validation

## Performance Characteristics

### Time Complexity
- Adding block: O(n) where n = transactions in block
- Validating block: O(n)
- Full chain validation: O(b) where b = total blocks
- Finding transaction: O(b)

### Space Complexity
- Per block: O(n) for transactions
- Full chain: O(b*n) where b = blocks, n = avg transactions

### Scalability
- Genesis block: ~314 bytes
- Average block: ~1-2 KB
- With 100 files: ~100-200 KB blockchain size

## Customization Options

### Adjustable Parameters
Edit `server/blockchain.js`:

```javascript
// Difficulty settings
constructor(initialDifficulty = 2) {
  this.minDifficulty = 2;      // Minimum difficulty
  this.maxDifficulty = 6;      // Maximum difficulty
  this.targetMiningTime = 2000; // Target ms per block
  this.blocksPerAdjustment = 5; // Adjustment frequency
}
```

### Adding New Features
- Custom transaction types
- Advanced consensus mechanisms
- Transaction validation rules
- Custom hashing algorithms

## Conclusion

This blockchain simulation provides a realistic yet educational implementation of core blockchain concepts. It demonstrates:
- How blockchain security works
- Why immutability is important
- How consensus mechanisms function
- Real practical file integrity verification

Students using this system gain hands-on experience with blockchain technology and cryptographic principles.
