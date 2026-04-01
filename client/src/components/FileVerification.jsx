import React, { useState } from 'react';
import axios from 'axios';
import { FaUpload, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

function FileVerification() {
  const [file, setFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = React.useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
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

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative border-2 border-dashed border-green-500/40 rounded-xl p-8 sm:p-12 text-center hover:border-green-500/80 transition-all duration-300 cursor-pointer bg-green-500/5 hover:bg-green-500/10"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
            <FaUpload className="text-3xl text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2 text-white">
              {file ? file.name : 'Upload Certificate to Verify'}
            </h3>
            <p className="text-gray-400">
              {file ? `${formatBytes(file.size)} • Ready to verify` : 'Drop your file here or click to browse'}
            </p>
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
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <FaTimesCircle className="text-red-400 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className={`border rounded-lg p-6 space-y-4 ${
          result.verified
            ? 'bg-green-500/10 border-green-500/50'
            : 'bg-red-500/10 border-red-500/50'
        }`}>
          <div className="flex items-start gap-3">
            {result.verified ? (
              <>
                <FaCheckCircle className="text-green-400 text-3xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold text-green-400">✓ Certificate Verified!</h3>
                  <p className="text-gray-300 mt-2">{result.message}</p>
                </div>
              </>
            ) : (
              <>
                <FaTimesCircle className="text-red-400 text-3xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold text-red-400">✗ Certificate Not Found</h3>
                  <p className="text-gray-300 mt-2">{result.message}</p>
                </div>
              </>
            )}
          </div>

          {result.verified && result.originalFile && (
            <div className="mt-6 pt-6 border-t border-green-500/20 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Original Filename</p>
                  <p className="font-semibold text-green-400">{result.originalFile.filename}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">File Size</p>
                  <p className="font-semibold text-emerald-400">{formatBytes(result.originalFile.size)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400 text-sm mb-1">Uploaded</p>
                  <p className="text-gray-300">{new Date(result.originalFile.uploadedAt).toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400 text-sm mb-1">Times Verified</p>
                  <p className="text-green-400 font-bold text-lg">{result.originalFile.verificationCount}</p>
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
          className={`w-full py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
            !file || verifying
              ? 'bg-gray-600 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/50 active:scale-95'
          }`}
        >
          <FaUpload className="text-lg" />
          {verifying ? 'Verifying...' : 'Verify Certificate'}
        </button>
      )}
    </div>
  );
}

export default FileVerification;
