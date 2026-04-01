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
        className="relative border-2 border-dashed border-primary/40 rounded-xl p-8 sm:p-12 text-center hover:border-primary/80 transition-colors duration-300 cursor-pointer bg-primary/5"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary">
            <FaCloudUploadAlt className="text-3xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">
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
        <div className={`flex items-center gap-3 p-4 rounded-lg ${
          status.type === 'success'
            ? 'bg-success/10 border border-success/50'
            : 'bg-danger/10 border border-danger/50'
        }`}>
          {status.type === 'success' ? (
            <FaCheckCircle className="text-success text-xl" />
          ) : (
            <FaExclamationCircle className="text-danger text-xl" />
          )}
          <p className={status.type === 'success' ? 'text-success' : 'text-danger'}>
            {status.message}
          </p>
        </div>
      )}

      {uploadResult && (
        <div className="bg-dark/50 border border-primary/30 rounded-lg p-6 space-y-3">
          <h4 className="font-bold text-lg text-primary">Upload Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Filename</p>
              <p className="font-mono text-primary break-all">{uploadResult.filename}</p>
            </div>
            <div>
              <p className="text-gray-400">File Size</p>
              <p className="font-mono text-primary">{formatBytes(uploadResult.size)}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-gray-400">File Hash</p>
              <p className="font-mono text-xs text-secondary break-all">{uploadResult.fileHash}</p>
            </div>
            <div>
              <p className="text-gray-400">Block Index</p>
              <p className="font-mono text-primary">{uploadResult.blockIndex}</p>
            </div>
            <div>
              <p className="text-gray-400">Block Hash</p>
              <p className="font-mono text-xs text-secondary break-all">{uploadResult.blockHash.substring(0, 32)}...</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`w-full py-3 px-6 rounded-lg font-bold transition-all duration-300 ${
          !file || uploading
            ? 'bg-gray-600 cursor-not-allowed opacity-50'
            : 'bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50'
        }`}
      >
        {uploading ? 'Uploading...' : 'Upload File'}
      </button>
    </div>
  );
}

export default FileUpload;
