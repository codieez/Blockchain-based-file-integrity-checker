import React, { useState } from 'react';
import axios from 'axios';
import { FaUpload, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

function FileVerification() {
  const [file, setFile] = useState(null);
  const [clientHash, setClientHash] = useState(null);
  const [hashingPreview, setHashingPreview] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = React.useRef(null);

  const toHex = (buffer) => {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const generateClientHash = async (selectedFile) => {
    setHashingPreview(true);
    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', fileBuffer);
      setClientHash(toHex(digest));
    } catch (hashError) {
      console.error('Error generating client hash:', hashError);
      setClientHash(null);
    } finally {
      setHashingPreview(false);
    }
  };

  const selectFile = async (selectedFile) => {
    setFile(selectedFile);
    setError(null);
    setResult(null);
    await generateClientHash(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      void selectFile(droppedFile);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      void selectFile(selectedFile);
    }
  };

  const handleVerify = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setVerifying(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/verify-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(response.data);
      setFile(null);
      setClientHash(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const shortHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 14)}...${hash.slice(-14)}`;
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto fade-in">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-6">Verify File Integrity</h2>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative border-2 border-dashed border-blue-500/60 rounded-2xl p-12 sm:p-16 text-center hover:border-blue-500 transition-all duration-500 cursor-pointer bg-gradient-to-br from-blue-500/5 to-purple-500/3 hover:from-blue-500/10 hover:to-purple-500/8 group overflow-hidden"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500" />
        <div className="relative space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-xl shadow-blue-500/40 group-hover:shadow-blue-500/60 group-hover:scale-110 transition-all duration-500">
            <FaUpload className="text-4xl text-white float" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-blue-300 transition-colors duration-300">
              {file ? file.name : 'Upload a File to Verify'}
            </h3>
            <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
              {file ? `${formatBytes(file.size)} • Ready to verify` : 'Drop your file here or click to browse'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Any file type can be verified by hash (SHA-256)</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <div className="flex items-center gap-3 p-6 bg-gradient-to-r from-red-500/20 to-pink-500/10 border border-red-500/60 rounded-xl slide-in shadow-lg shadow-red-500/20">
          <FaTimesCircle className="text-red-400 flex-shrink-0 text-2xl" />
          <p className="text-red-300 font-medium">{error}</p>
        </div>
      )}

      {file && (
        <div className="rounded-xl border border-blue-500/40 bg-slate-900/40 p-5 space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-blue-300">Live Hash Demo (Before Submit)</h4>
          <p className="text-sm text-gray-300">This hash is generated in-browser from file bytes using SHA-256.</p>
          {hashingPreview ? (
            <p className="text-sm text-yellow-300">Generating hash preview...</p>
          ) : (
            <>
              <p className="text-xs text-gray-400">Client-side SHA-256 hash</p>
              <p className="font-mono text-cyan-300 break-all text-sm">{clientHash || 'Could not generate hash preview'}</p>
              <p className="text-xs text-gray-500">This should match the server hash for the same file.</p>
            </>
          )}
        </div>
      )}

      {result && (
        <div className={`border rounded-2xl p-8 space-y-6 slide-in backdrop-blur-xl ${
          result.verified
            ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/60 shadow-lg shadow-green-500/30'
            : 'bg-gradient-to-br from-red-500/20 to-pink-500/10 border-red-500/60 shadow-lg shadow-red-500/30'
        }`}>
          <div className="flex items-start gap-4">
            {result.verified ? (
              <>
                <FaCheckCircle className="text-green-400 text-4xl mt-1 flex-shrink-0 float" />
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-green-300 mb-2">✓ Verified!</h3>
                  <p className="text-gray-300 leading-relaxed">{result.message}</p>
                </div>
              </>
            ) : (
              <>
                <FaTimesCircle className="text-red-400 text-4xl mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-red-300 mb-2">File Not Found in Database or Possibly Tampered</h3>
                  <p className="text-gray-300 leading-relaxed">{result.message}</p>
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-500/30 bg-slate-900/40 p-5 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-300">Integrity Check Flow</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-gray-300">1. Generate hash from uploaded file bytes</p>
                <span className="text-green-300 font-semibold">Done</span>
              </div>
              <div className="rounded-lg bg-slate-800/60 p-3 border border-slate-700/60">
                <p className="text-gray-400 text-xs mb-1">Uploaded File Hash (SHA-256)</p>
                <p className="font-mono text-cyan-300 break-all">{result.hashComparison?.uploadedHash || result.uploadedFile?.hash || 'N/A'}</p>
                <p className="text-gray-500 text-xs mt-2">Short: {shortHash(result.hashComparison?.uploadedHash || result.uploadedFile?.hash)}</p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-gray-300">2. Lookup hash in reference database</p>
                <span className={`font-semibold ${result.hashComparison?.foundInDatabase ? 'text-green-300' : 'text-red-300'}`}>
                  {result.hashComparison?.foundInDatabase ? 'Found' : 'Not Found in Database or Possibly Tampered'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-gray-300">3. Compare uploaded hash with stored reference hash</p>
                <span className={`font-semibold ${result.hashComparison?.match ? 'text-green-300' : 'text-red-300'}`}>
                  {result.hashComparison?.match ? 'Match' : 'No Match'}
                </span>
              </div>

              <div className="rounded-lg bg-slate-800/60 p-3 border border-slate-700/60">
                <p className="text-gray-400 text-xs mb-1">Reference File Hash</p>
                <p className="font-mono text-amber-300 break-all">{result.hashComparison?.originalHash || 'Not available (file not found in database or possibly tampered)'}</p>
                {result.hashComparison?.originalHash && (
                  <p className="text-gray-500 text-xs mt-2">Short: {shortHash(result.hashComparison.originalHash)}</p>
                )}
              </div>
            </div>
          </div>

          {result.verified && result.originalFile && (
            <div className="mt-8 pt-8 border-t border-green-500/30 space-y-6">
              <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Registered File Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Original Filename</p>
                  <p className="font-bold text-green-300 text-lg truncate">{result.originalFile.filename}</p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">File Size</p>
                  <p className="font-bold text-emerald-300 text-lg">{formatBytes(result.originalFile.size)}</p>
                </div>
                <div className="sm:col-span-2 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Uploaded At</p>
                  <p className="text-gray-300 font-medium">{new Date(result.originalFile.uploadedAt).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Times Verified</p>
                  <p className="font-bold text-purple-300 text-lg">{result.originalFile.verificationCount}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!result && (
        <button
          onClick={handleVerify}
          disabled={!file || verifying}
          className={`btn-primary w-full justify-center py-4 text-lg ${!file || verifying ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FaUpload className="text-xl" />
          {verifying ? 'Verifying...' : 'Verify File'}
        </button>
      )}
    </div>
  );
}

export default FileVerification;
