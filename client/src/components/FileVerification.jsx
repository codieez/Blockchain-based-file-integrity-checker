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
          <label className="block text-sm font-semibold mb-2">Enter File Hash</label>
          <input
            type="text"
            value={fileHash}
            onChange={(e) => setFileHash(e.target.value)}
            placeholder="Enter SHA-256 hash of your file..."
            className="w-full px-4 py-3 bg-dark/50 border border-primary/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary/80 transition-colors"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-danger/10 border border-danger/50 rounded-lg">
            <FaTimesCircle className="text-danger" />
            <p className="text-danger">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={verifying || !fileHash.trim()}
          className={`w-full py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
            verifying || !fileHash.trim()
              ? 'bg-gray-600 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50'
          }`}
        >
          <FaSearch className="text-lg" />
          {verifying ? 'Verifying...' : 'Verify File'}
        </button>
      </form>

      {verificationResult && (
        <div className={`border rounded-lg p-6 space-y-4 ${
          verificationResult.verified
            ? 'bg-success/10 border-success/50'
            : 'bg-danger/10 border-danger/50'
        }`}>
          <div className="flex items-start gap-3">
            {verificationResult.verified ? (
              <>
                <FaCheckCircle className="text-success text-2xl mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-success">File Verified</h3>
                  <p className="text-gray-300">This file is registered and verified in the blockchain.</p>
                </div>
              </>
            ) : (
              <>
                <FaTimesCircle className="text-danger text-2xl mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-danger">File Not Found</h3>
                  <p className="text-gray-300">{verificationResult.message}</p>
                </div>
              </>
            )}
          </div>

          {verificationResult.verified && verificationResult.verificationData && (
            <div className="mt-4 pt-4 border-t border-primary/20 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Block Index</p>
                  <p className="font-mono text-primary">{verificationResult.verificationData.blockIndex}</p>
                </div>
                <div>
                  <p className="text-gray-400">Verified</p>
                  <p className="font-mono text-success">
                    {verificationResult.verificationData.verified ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400">Block Hash</p>
                  <p className="font-mono text-xs text-secondary break-all">
                    {verificationResult.verificationData.blockHash}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400">Timestamp</p>
                  <p className="font-mono text-sm text-gray-300">
                    {formatDate(verificationResult.verificationData.timestamp)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400">Chain Status</p>
                  <p className={`font-mono font-bold ${
                    verificationResult.verificationData.chainIntegrity
                      ? 'text-success'
                      : 'text-danger'
                  }`}>
                    {verificationResult.verificationData.chainIntegrity ? 'Valid' : 'Invalid'}
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
