import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCopy, FaCheckCircle } from 'react-icons/fa';

function CertificateList() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await axios.get('/api/certificates');
      setCertificates(response.data.certificates || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, hash) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-emerald-600"></div>
      </div>
    );
  }

  if (!certificates || certificates.length === 0) {
    return (
      <div className="text-center py-12">
        <FaCheckCircle className="text-4xl text-green-400 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">No certificates registered yet</p>
        <p className="text-gray-500 text-sm mt-2">Admin will add certificates here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Available Certificates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certificates.map((cert) => (
          <div
            key={cert.fileHash}
            className="border border-green-500/20 rounded-lg bg-slate-800/40 p-5 hover:border-green-500/40 transition-all hover:shadow-lg hover:shadow-green-500/10"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg text-white">{cert.filename}</h3>
                <p className="text-xs text-gray-400 mt-1">{formatBytes(cert.size)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-g ray-400">Verified</p>
                <p className="text-xl font-bold text-green-400">{cert.verifications}</p>
              </div>
            </div>

            <div className="border-t border-green-500/20 pt-3 space-y-2">
              <p className="text-xs text-gray-500">Uploaded: {formatDate(cert.uploadedAt)}</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-gray-400 break-all bg-slate-900/50 rounded px-2 py-1 flex-1">
                  {cert.fileHash.substring(0, 20)}...
                </code>
                <button
                  onClick={() => copyToClipboard(cert.fileHash, cert.fileHash)}
                  className="p-2 hover:bg-green-500/20 rounded transition-colors"
                  title="Copy hash"
                >
                  <FaCopy className={`text-sm ${
                    copiedHash === cert.fileHash ? 'text-green-400' : 'text-gray-400'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CertificateList;
