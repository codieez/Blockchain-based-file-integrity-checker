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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-emerald-600"></div>
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

  const formatNonce = (block) => {
    if (!block || block.nonce === null || block.nonce === undefined || block.nonce === '') {
      return 'Unavailable';
    }

    const nonceText = String(block.nonce);
    const isZeroHex = typeof block.nonceHex === 'string' && /^0x0+$/i.test(block.nonceHex);

    if (isZeroHex) {
      return `${nonceText} (auto-mined)`;
    }

    return nonceText;
  };

  return (
    <div className="space-y-8 fade-in">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-6">Blockchain Status</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card group hover:shadow-lg hover:shadow-blue-500/20">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <FaCube className="text-blue-400 text-xl" />
            </div>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Blocks</p>
          <p className="text-3xl font-bold text-blue-300 group-hover:text-blue-200 transition-colors">{blockchain.stats.totalBlocks}</p>
        </div>

        <div className="card group hover:shadow-lg hover:shadow-purple-500/20">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <FaLink className="text-purple-400 text-xl" />
            </div>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Files</p>
          <p className="text-3xl font-bold text-purple-300 group-hover:text-purple-200 transition-colors">{blockchain.stats.totalFiles}</p>
        </div>

        <div className="card group hover:shadow-lg hover:shadow-sky-500/20">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 rounded-lg bg-sky-500/20 group-hover:bg-sky-500/30 transition-colors">
              <FaTachometerAlt className="text-sky-400 text-xl" />
            </div>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Difficulty</p>
          <p className="text-3xl font-bold text-sky-300 group-hover:text-sky-200 transition-colors">{blockchain.stats.currentDifficulty}</p>
        </div>

        <div className="card group hover:shadow-lg hover:shadow-indigo-500/20">
          <div className="flex items-start justify-between mb-3">
            <div className="p-3 rounded-lg bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-colors">
              <FaClock className="text-indigo-400 text-xl" />
            </div>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Avg Mine Time</p>
          <p className="text-3xl font-bold text-indigo-300 group-hover:text-indigo-200 transition-colors">{blockchain.stats.averageMiningTime}ms</p>
        </div>

        <div className={`card group hover:shadow-lg transition-all ${
          blockchain.stats.isValid
            ? 'hover:shadow-emerald-500/30'
            : 'hover:shadow-red-500/30'
        }`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`p-3 rounded-lg transition-colors ${blockchain.stats.isValid ? 'bg-emerald-500/20 group-hover:bg-emerald-500/30' : 'bg-red-500/20 group-hover:bg-red-500/30'}`}>
              {blockchain.stats.isValid ? (
                <FaCheckCircle className="text-emerald-400 text-xl" />
              ) : (
                <FaTimesCircle className="text-red-400 text-xl" />
              )}
            </div>
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Chain Status</p>
          <p className={`text-2xl font-bold ${blockchain.stats.isValid ? 'text-emerald-300' : 'text-red-300'}`}>
            {blockchain.stats.isValid ? '✓ Valid' : '✗ Invalid'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {[
          { id: 'blocks', label: '🔗 Blocks' },
          { id: 'mining', label: '⚙️ Mining Stats' },
          { id: 'mempool', label: '📦 Mempool' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : 'inactive'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'blocks' && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <FaCube className="text-blue-400 text-xl" />
            </div>
            Blockchain Blocks
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {blockchain.chain.map((block, index) => (
              <div
                key={block.hash}
                className="card cursor-pointer overflow-hidden group hover:border-green-500/60 hover:shadow-lg hover:shadow-green-500/20"
              >
                <button
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm transition-all ${
                      block.isValid 
                        ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/20 text-green-300' 
                        : 'bg-gradient-to-br from-red-500/30 to-pink-500/20 text-red-300'
                    }`}>
                      {block.index}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white">
                        {block.index === 0 ? '🏗️ Genesis Block' : `⛓️ Block #${block.index}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {block.transactionCount} tx • {formatBytes(block.blockSize)}
                      </p>
                    </div>
                  </div>
                  <FaLink className={`text-gray-400 group-hover:text-green-400 transition-all ${expandedIndex === index ? 'rotate-90' : ''}`} />
                </button>

                {expandedIndex === index && (
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/30 border-t border-green-500/30 px-6 py-4 mt-4 text-xs space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-slate-800/30 border border-green-500/20">
                        <p className="text-gray-400 text-xs font-bold uppercase mb-2">Timestamp</p>
                        <p className="text-gray-300 text-xs break-all">{formatDate(block.timestamp)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/30 border border-amber-500/20">
                        <p className="text-gray-400 text-xs font-bold uppercase mb-2">Difficulty</p>
                        <p className="text-amber-300 font-mono font-bold">{block.difficulty}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/30 border border-cyan-500/20">
                        <p className="text-gray-400 text-xs font-bold uppercase mb-2">Nonce</p>
                        <p className="text-cyan-300 font-mono font-bold">{formatNonce(block)}</p>
                        {block.nonceHex && (
                          <p className="text-[10px] text-cyan-500 font-mono mt-1 break-all">{block.nonceHex}</p>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-slate-800/30 border border-green-500/20">
                        <p className="text-gray-400 text-xs font-bold uppercase mb-2">Status</p>
                        <p className={`font-bold ${block.isValid ? 'text-green-300' : 'text-red-300'}`}>
                          {block.isValid ? '✓ Valid' : '✗ Invalid'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-800/40 rounded-lg p-3 border border-green-500/20">
                      <p className="text-gray-400 text-xs font-bold uppercase mb-2">Block Hash</p>
                      <p className="font-mono text-xs text-green-300 break-all">{block.hash}</p>
                    </div>

                    <div className="bg-slate-800/40 rounded-lg p-3 border border-green-500/20">
                      <p className="text-gray-400 text-xs font-bold uppercase mb-2">Previous Hash</p>
                      <p className="font-mono text-xs text-emerald-300 break-all">{block.previousHash}</p>
                    </div>

                    <div className="bg-slate-800/40 rounded-lg p-3 border border-green-500/20">
                      <p className="text-gray-400 text-xs font-bold uppercase mb-2">Merkle Root</p>
                      <p className="font-mono text-xs text-cyan-300 break-all">{block.merkleRoot || 'Unavailable'}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'mining' && miningStats && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <FaBolt className="text-purple-400 text-xl" />
            </div>
            Mining Statistics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card group hover:shadow-lg hover:shadow-blue-500/20">
              <div className="p-3 rounded-lg bg-blue-500/20 w-fit mb-3 group-hover:bg-blue-500/30 transition-colors">
                <FaCube className="text-blue-400 text-lg" />
              </div>
              <p className="text-gray-400 text-xs font-bold uppercase mb-2">Total Blocks Mined</p>
              <p className="text-3xl font-bold text-blue-300">{miningStats.totalBlocksMined}</p>
            </div>
            <div className="card group hover:shadow-lg hover:shadow-indigo-500/20">
              <div className="p-3 rounded-lg bg-indigo-500/20 w-fit mb-3 group-hover:bg-indigo-500/30 transition-colors">
                <FaClock className="text-indigo-400 text-lg" />
              </div>
              <p className="text-gray-400 text-xs font-bold uppercase mb-2">Avg Mining Time</p>
              <p className="text-3xl font-bold text-indigo-300">{miningStats.averageMiningTime}ms</p>
            </div>
            <div className="card group hover:shadow-lg hover:shadow-pink-500/20">
              <div className="p-3 rounded-lg bg-pink-500/20 w-fit mb-3 group-hover:bg-pink-500/30 transition-colors">
                <FaBolt className="text-pink-400 text-lg" />
              </div>
              <p className="text-gray-400 text-xs font-bold uppercase mb-2">Total Iterations</p>
              <p className="text-3xl font-bold text-pink-300">{miningStats.totalIterations.toLocaleString()}</p>
            </div>
          </div>

          <div className="card">
            <h4 className="font-bold mb-4 text-white text-lg">Difficulty History</h4>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {miningStats.difficultyHistory.slice().reverse().map((entry, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-3 bg-slate-800/30 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-all">
                  <span className="text-gray-300 font-medium">Block #{entry.blockIndex}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-amber-400 font-mono font-bold">Diff: {entry.difficulty}</span>
                    <span className="text-cyan-400 font-mono font-bold">{entry.miningTime}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'mempool' && mempool && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <FaCube className="text-purple-400 text-xl" />
              </div>
              Memory Pool
            </h3>
            <span className="text-3xl font-bold text-purple-300 bg-gradient-to-r from-purple-500/30 to-blue-500/20 px-4 py-2 rounded-lg border border-purple-500/40 shadow-lg shadow-purple-500/20">{mempool.mempoolSize}</span>
          </div>

          {mempool.mempoolSize === 0 ? (
            <div className="text-center py-12 card">
              <p className="text-gray-400 text-lg">✨ No pending transactions</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {mempool.transactions.map((tx, idx) => (
                <div key={tx.id} className="card group hover:shadow-lg hover:shadow-green-500/20">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-mono text-green-300 font-bold bg-green-500/20 px-3 py-1 rounded-lg">TX #{idx + 1}</span>
                    <span className="text-xs text-gray-500">{formatDate(tx.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-300 font-mono break-all mb-2 font-semibold">{tx.filename}</p>
                  <p className="text-xs text-gray-400">📦 {formatBytes(tx.size)}</p>
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
