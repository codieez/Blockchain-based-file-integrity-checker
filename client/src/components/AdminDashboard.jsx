import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCopy, FaTrash, FaSync } from 'react-icons/fa';

function AdminDashboard() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState(null);
  const adminKey = 'admin123';

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await axios.get('/api/admin/originals', {
        headers: { 'X-Admin-Key': adminKey }
      });
      setCertificates(response.data.originals || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCertificate = async (fileHash) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/originals/${fileHash}`, {
        headers: { 'X-Admin-Key': adminKey }
      });
      setCertificates(certificates.filter(c => c.fileHash !== fileHash));
    } catch (error) {
      console.error('Error deleting certificate:', error);
      alert('Failed to delete certificate');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <button
          onClick={fetchCertificates}
          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-300 flex items-center gap-2"
        >
          <FaSync className="text-sm" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/40 border border-green-500/20 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Total Certificates</p>
          <p className="text-3xl font-bold text-green-400">{certificates.length}</p>
        </div>
        <div className="bg-slate-800/40 border border-green-500/20 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Total Verifications</p>
          <p className="text-3xl font-bold text-emerald-400">
            {certificates.reduce((sum, c) => sum + (c.verified || 0), 0)}
          </p>
        </div>
        <div className="bg-slate-800/40 border border-green-500/20 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">System Status</p>
          <p className="text-2xl font-bold text-green-400">✓ Active</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white">Registered Certificates</h3>
        {certificates.length === 0 ? (
          <div className="text-center py-8 bg-slate-800/20 rounded-lg border border-green-500/20">
            <p className="text-gray-400">No certificates registered yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {certificates.map((cert) => (
              <div
                key={cert.fileHash}
                className="border border-green-500/20 rounded-lg bg-slate-800/40 p-4 hover:border-green-500/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-white">{cert.filename}</h4>
                    <p className="text-xs text-gray-400 mt-1">{formatBytes(cert.size)} • {formatDate(cert.uploadedAt)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-xs font-mono text-gray-400 bg-slate-900/50 rounded px-2 py-1 max-w-xs truncate">
                        {cert.fileHash}
                      </code>
                      <button
                        onClick={() => copyToClipboard(cert.fileHash, cert.fileHash)}
                        className="p-1 hover:bg-green-500/20 rounded transition-colors"
                      >
                        <FaCopy className={`text-xs ${
                          copiedHash === cert.fileHash ? 'text-green-400' : 'text-gray-400'
                        }`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Verified</p>
                      <p className="text-2xl font-bold text-green-400">{cert.verified || 0}</p>
                    </div>
                    <button
                      onClick={() => deleteCertificate(cert.fileHash)}
                      className="p-2 hover:bg-red-500/20 rounded transition-colors text-red-400"
                      title="Delete certificate"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
