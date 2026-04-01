import React, { useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaCopy, FaChevronDown } from 'react-icons/fa';

function FileList({ files, isLoading }) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const copyToClipboard = (text, hash) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-secondary"></div>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No files uploaded yet</p>
        <p className="text-gray-500 text-sm mt-2">Upload a file to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file, index) => (
        <div
          key={file.fileHash}
          className="border border-primary/20 rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
        >
          <button
            onClick={() => toggleExpand(index)}
            className="w-full px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between bg-dark/50 hover:bg-dark/70 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 text-left">
              <div className={`p-2 rounded-lg ${file.verified ? 'bg-success/20' : 'bg-danger/20'}`}>
                {file.verified ? (
                  <FaCheckCircle className="text-success text-lg" />
                ) : (
                  <FaTimesCircle className="text-danger text-lg" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{file.filename}</p>
                <p className="text-xs text-gray-400">{formatBytes(file.size)} • Block #{file.blockIndex}</p>
              </div>
            </div>
            <FaChevronDown
              className={`text-gray-400 transition-transform ml-2 ${
                expandedIndex === index ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedIndex === index && (
            <div className="bg-dark/30 border-t border-primary/20 px-4 py-4 sm:px-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Status</p>
                  <p className={`font-semibold ${file.verified ? 'text-success' : 'text-danger'}`}>
                    {file.verified ? 'Verified' : 'Unverified'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Block Index</p>
                  <p className="text-primary font-mono">{file.blockIndex}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-400 mb-1">Uploaded</p>
                  <p className="text-gray-300">{formatDate(file.uploadedAt)}</p>
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-400 mb-1">File Hash (SHA-256)</p>
                      <p className="text-xs font-mono text-secondary break-all">
                        {file.fileHash}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(file.fileHash, file.fileHash)}
                      className="ml-2 p-2 hover:bg-primary/20 rounded transition-colors"
                      title="Copy hash"
                    >
                      <FaCopy className={`text-sm ${
                        copiedHash === file.fileHash ? 'text-success' : 'text-gray-400'
                      }`} />
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-400 mb-1">Block Hash</p>
                      <p className="text-xs font-mono text-secondary break-all">
                        {file.blockHash}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(file.blockHash, file.blockHash)}
                      className="ml-2 p-2 hover:bg-primary/20 rounded transition-colors"
                      title="Copy block hash"
                    >
                      <FaCopy className={`text-sm ${
                        copiedHash === file.blockHash ? 'text-success' : 'text-gray-400'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default FileList;
