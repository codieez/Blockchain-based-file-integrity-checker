import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaLink, FaCube, FaCheckCircle, FaTimesCircle, FaTachometerAlt, FaClock, FaBolt } from 'react-icons/fa';

function BlockchainView() {
  const [blockchain, setBlockchain] = useState(null);
  const [miningStats, setMiningStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('blocks');
  const [mempool, setMempool] = useState(null);

  useEffect(() => {
    fetchBlockchainData();
    const interval = setInterval(fetchBlockchainData, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchBlockchainData = async () => {
    try {
      const [blockchainRes, statsRes, mempoolRes] = await Promise.all([
        axios.get('/api/blockchain'),
        axios.get('/api/mining-stats'),
        axios.get('/api/mempool')
      ]);
      
      setBlockchain(blockchainRes.data);
      setMiningStats(statsRes.data);
      setMempool(mempoolRes.data);
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-secondary"></div>
      </div>
    );
  }

  if (!blockchain) {
    return <div className="text-center text-gray-400">Failed to load blockchain</div>;
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
            <FaCube className="text-primary" /> Total Blocks
          </p>
          <p className="text-2xl font-bold text-primary">{blockchain.stats.totalBlocks}</p>
        </div>
        <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
            <FaLink className="text-secondary" /> Total Files
          </p>
          <p className="text-2xl font-bold text-secondary">{blockchain.stats.totalFiles}</p>
        </div>
        <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
            <FaTachometerAlt className="text-amber-400" /> Current Difficulty
          </p>
          <p className="text-2xl font-bold text-amber-400">{blockchain.stats.currentDifficulty}</p>
        </div>
        <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
          <p className="text-gray-400 text-xs mb-1 flex items-center gap-1">
            <FaClock className="text-blue-400" /> Avg Mine Time
          </p>
          <p className="text-2xl font-bold text-blue-400">{blockchain.stats.averageMiningTime}ms</p>
        </div>
        <div className={`rounded-lg p-4 border ${
          blockchain.stats.isValid
            ? 'bg-success/10 border-success/50'
            : 'bg-danger/10 border-danger/50'
        }`}>
          <p className="text-gray-400 text-xs mb-1">Chain Status</p>
          <div className="flex items-center gap-1">
            {blockchain.stats.isValid ? (
              <>
                <FaCheckCircle className="text-success text-lg" />
                <p className="text-sm font-bold text-success">Valid</p>
              </>
            ) : (
              <> ({blockchain.chain.length})
                <FaTimesCircle className="text-danger text-lg" />
                <p className="text-sm font-bold text-danger">Invalid</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'blocks', label: 'Blocks', icon: '🔗' },
          { id: 'mining', label: 'Mining Stats', icon: '⚙️' },
          { id: 'mempool', label: 'Mempool', icon: '📦' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-primary to-secondary text-white'
                : 'bg-dark/50 border border-primary/20 text-gray-300 hover:border-primary/40'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'blocks' && (

      <div className="space-y-3">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FaCube className="text-primary" />
          Blockchain Blocks
        </h3>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {blockchain.chain.map((block, index) => (
            <div
              key={block.hash}
              className="border border-primary/20 rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full px-4 py-3 flex items-center justify-between bg-dark/50 hover:bg-dark/70 transition-colors"
              >
                <div className="flex items-center gap-3 text-left flex-1">
                  <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg ${
                    block.isValid ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                  }`}>
                    <p className="text-xs font-bold">{block.index}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {block.index === 0 ? 'Genesis Block' : `Block #${block.index}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {block.transactionCount} tx • {formatBytes(block.blockSize)}
                    </p>
                  </div>
                </div>
                <FaLink className={`text-gray-400 ${expandedIndex === index ? 'rotate-90' : ''}`} />
              </button>

              {expandedIndex === index && (
                <div className="bg-dark/30 border-t border-primary/20 px-4 py-4 text-xs space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-gray-400 mb-1">Timestamp</p>
                      <p className="text-gray-300 text-xs">{formatDate(block.timestamp)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Difficulty</p>
                      <p className="text-amber-400 font-mono">{block.difficulty}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Nonce</p>
                      <p className="text-blue-400 font-mono">{block.nonce}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Status</p>
                      <p className={block.isValid ? 'text-success' : 'text-danger'}>
                        {block.isValid ? '✓ Valid' : '✗ Invalid'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 mb-1">Block Hash</p>
                    <p className="font-mono text-xs text-secondary break-all">{block.hash}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 mb-1">Previous Hash</p>
                    <p className="font-mono text-xs text-secondary break-all">{block.previousHash}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 mb-1">Merkle Root</p>
                    <p className="font-mono text-xs text-secondary break-all">{block.merkleRoot}</p>
                  </div>

                  {block.index > 0 && (
                    <div className="pt-2 border-t border-primary/20">
                      <p className="text-gray-400 mb-2">Transactions ({block.transactionCount})</p>
                      <div className="space-y-1">
                        {Array.from({length: Math.min(block.transactionCount, 3)}).map((_, i) => (
                          <p key={i} className="text-xs text-gray-500">• Transaction {i + 1}</p>
                        ))}
                        {block.transactionCount > 3 && (
                          <p className="text-xs text-gray-500">+ {block.transactionCount - 3} more</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      )}

      {activeTab === 'mining' && miningStats && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FaBolt className="text-secondary" />
            Mining Statistics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">Total Blocks Mined</p>
              <p className="text-3xl font-bold text-primary">{miningStats.totalBlocksMined}</p>
            </div>
            <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">Avg Mining Time</p>
              <p className="text-3xl font-bold text-blue-400">{miningStats.averageMiningTime}ms</p>
            </div>
            <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">Total Iterations</p>
              <p className="text-3xl font-bold text-amber-400">{miningStats.totalIterations.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-dark/50 border border-primary/20 rounded-lg p-4">
            <h4 className="font-bold mb-3">Difficulty History</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {miningStats.difficultyHistory.slice().reverse().map((entry, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 bg-dark/50 rounded">
                  <span className="text-gray-400">Block #{entry.blockIndex}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-amber-400 font-mono w-16 text-right">Diff: {entry.difficulty}</span>
                    <span className="text-blue-400 font-mono w-20 text-right">{entry.miningTime}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mempool' && mempool && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FaCube className="text-secondary" />
              Memory Pool
            </h3>
            <span className="text-2xl font-bold text-primary">{mempool.mempoolSize}</span>
          </div>

          {mempool.mempoolSize === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No pending transactions</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {mempool.transactions.map((tx, idx) => (
                <div key={tx.id} className="bg-dark/50 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-gray-400">TX #{idx + 1}</span>
                    <span className="text-xs text-gray-500">{formatDate(tx.timestamp)}</span>
                  </div>
                  <p className="text-xs text-gray-300 font-mono break-all">{tx.filename}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatBytes(tx.size)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BlockchainView;
