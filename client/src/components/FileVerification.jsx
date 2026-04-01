import React, { useState } from 'react';
import axios from 'axios';
import { FaSearch, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

function FileVerification({ onVerified }) {
  const [fileHash, setFileHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!fileHash.trim()) {
      setError('Please enter a file hash');
      return;
    }

    setVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      const response = await axios.post('/api/verify', { fileHash });
      setVerificationResult(response.data);
      onVerified();
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300">Enter File Hash</label>
          <input
            type="text"
            value={fileHash}
            onChange={(e) => setFileHash(e.target.value)}
            placeholder="Paste your SHA-256 file hash here..."
            className="w-full px-4 py-3 bg-slate-700/50 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <FaTimesCircle className="text-red-400 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={verifying || !fileHash.trim()}
          className={`w-full py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
            verifying || !fileHash.trim()
              ? 'bg-gray-600 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/50 active:scale-95'
          }`}
        >
          <FaSearch className="text-lg" />
          {verifying ? 'Verifying...' : 'Verify File'}
        </button>
      </form>

      {verificationResult && (
        <div className={`border rounded-lg p-6 space-y-4 ${
          verificationResult.verified
            ? 'bg-green-500/10 border-green-500/50'
            : 'bg-red-500/10 border-red-500/50'
        }`}>
          <div className="flex items-start gap-3">
            {verificationResult.verified ? (
              <>
                <FaCheckCircle className="text-green-400 text-2xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-green-400">✓ File Verified</h3>
                  <p className="text-gray-300 mt-1">This file is registered and verified in the blockchain.</p>
                </div>
              </>
            ) : (
              <>
                <FaTimesCircle className="text-red-400 text-2xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-red-400">✗ File Not Found</h3>
                  <p className="text-gray-300 mt-1">{verificationResult.message}</p>
                </div>
              </>
            )}
          </div>

          {verificationResult.verified && verificationResult.verificationData && (
            <div className="mt-4 pt-4 border-t border-green-500/20 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Block Index</p>
                  <p className="font-mono text-green-400 font-bold text-lg">#{verificationResult.verificationData.blockIndex}</p>
                </div>
                <div>
                  <p className="text-gray-400">Verified</p>
                  <p className="font-mono text-green-400 font-bold">
                    {verificationResult.verificationData.verified ? '✓ Yes' : '✗ No'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400 mb-1">Block Hash</p>
                  <p className="font-mono text-xs text-gray-300 break-all bg-slate-800/50 rounded p-2 border border-green-500/20">
                    {verificationResult.verificationData.blockHash}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400 mb-1">Timestamp</p>
                  <p className="font-mono text-sm text-gray-300">
                    {formatDate(verificationResult.verificationData.timestamp)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400 mb-1">Chain Status</p>
                  <p className={`font-mono font-bold ${
                    verificationResult.verificationData.chainIntegrity
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {verificationResult.verificationData.chainIntegrity ? '✓ Valid' : '✗ Invalid'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FileVerification;
