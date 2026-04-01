import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FaCloudUploadAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

function FileUpload({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

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
      setStatus(null);
      setUploadResult(null);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ type: 'error', message: 'Please select a file' });
      return;
    }

    setUploading(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setStatus({ type: 'success', message: 'File uploaded successfully!' });
        setUploadResult(response.data.data);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onUploaded();
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.error || 'Upload failed'
      });
    } finally {
      setUploading(false);
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
    <div className="space-y-6">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative border-2 border-dashed border-green-500/40 rounded-xl p-8 sm:p-12 text-center hover:border-green-500/80 transition-all duration-300 cursor-pointer bg-green-500/5 hover:bg-green-500/10"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
            <FaCloudUploadAlt className="text-3xl text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2 text-white">
              {file ? file.name : 'Drop your file here'}
            </h3>
            <p className="text-gray-400">
              {file ? `${formatBytes(file.size)} • Ready to upload` : 'or click to browse'}
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

      {status && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${
          status.type === 'success'
            ? 'bg-green-500/10 border-green-500/50'
            : 'bg-red-500/10 border-red-500/50'
        }`}>
          {status.type === 'success' ? (
            <FaCheckCircle className={`text-xl ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`} />
          ) : (
            <FaExclamationCircle className={`text-xl ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`} />
          )}
          <p className={status.type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {status.message}
          </p>
        </div>
      )}

      {uploadResult && (
        <div className="bg-slate-700/30 border border-green-500/30 rounded-lg p-6 space-y-3 hover:border-green-500/50 transition-colors">
          <h4 className="font-bold text-lg text-green-400">✓ Upload Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 mb-1">Filename</p>
              <p className="font-mono text-green-400 break-all">{uploadResult.filename}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">File Size</p>
              <p className="font-mono text-emerald-400">{formatBytes(uploadResult.size)}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-gray-400 mb-1">File Hash (SHA-256)</p>
              <p className="font-mono text-xs text-gray-300 break-all bg-slate-800/50 rounded p-2 border border-green-500/20">{uploadResult.fileHash}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Block Index</p>
              <p className="font-mono text-emerald-400 font-bold text-lg">#{uploadResult.blockIndex}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Block Hash</p>
              <p className="font-mono text-xs text-gray-300 break-all bg-slate-800/50 rounded p-2 border border-green-500/20">{uploadResult.blockHash.substring(0, 32)}...</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`w-full py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
          !file || uploading
            ? 'bg-gray-600 cursor-not-allowed opacity-50'
            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/50 active:scale-95'
        }`}
      >
        <FaCloudUploadAlt className="text-lg" />
        {uploading ? 'Uploading...' : 'Upload File'}
      </button>
    </div>
  );
}

export default FileUpload;
