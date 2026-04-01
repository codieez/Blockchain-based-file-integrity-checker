import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUpload, FaCheck, FaShieldAlt, FaLink } from 'react-icons/fa';
import FileUpload from './components/FileUpload';
import FileVerification from './components/FileVerification';
import FileList from './components/FileList';
import BlockchainView from './components/BlockchainView';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchFiles();
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/files');
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/blockchain');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFileUploaded = async () => {
    setLoading(true);
    await fetchFiles();
    await fetchStats();
    setLoading(false);
    setActiveTab('files');
  };

  const handleFileVerified = async () => {
    await fetchFiles();
    await fetchStats();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-green-500/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/30">
                <FaShieldAlt className="text-3xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  BlockChain File Integrity
                </h1>
                <p className="text-sm text-gray-400 mt-1">Secure file verification with blockchain technology</p>
              </div>
            </div>
            {stats && (
              <div className="hidden sm:flex items-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{stats.totalBlocks}</p>
                  <p className="text-xs text-gray-400 mt-1">Blocks</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-400">{stats.totalFiles}</p>
                  <p className="text-xs text-gray-400 mt-1">Files</p>
                </div>
                <div className={`text-center px-4 py-2 rounded-lg ${stats.isValid ? 'bg-green-500/10 border border-green-500/50' : 'bg-red-500/10 border border-red-500/50'}`}>
                  <p className={`text-lg font-bold ${stats.isValid ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.isValid ? '✓ Valid' : '✗ Invalid'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Chain</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { id: 'upload', label: 'Upload File', icon: FaUpload },
            { id: 'verify', label: 'Verify File', icon: FaCheck },
            { id: 'files', label: 'Files', icon: FaLink },
            { id: 'blockchain', label: 'Blockchain', icon: FaShieldAlt }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50 scale-105'
                  : 'bg-slate-800/50 border border-green-500/20 text-gray-300 hover:border-green-500/40 hover:text-white'
              }`}
            >
              <tab.icon className="text-lg" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Card */}
        <div className="rounded-xl border border-green-500/20 bg-slate-800/40 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-green-500/10">
          {activeTab === 'upload' && <FileUpload onUploaded={handleFileUploaded} />}
          {activeTab === 'verify' && <FileVerification onVerified={handleFileVerified} />}
          {activeTab === 'files' && <FileList files={files} isLoading={loading} />}
          {activeTab === 'blockchain' && <BlockchainView />}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-green-500/20 bg-slate-900/50 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p className="mb-1">🔐 Secured by Blockchain Technology | File Integrity Guaranteed</p>
          <p className="text-xs text-gray-500">Enterprise-Grade Security for Your Most Important Files</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
