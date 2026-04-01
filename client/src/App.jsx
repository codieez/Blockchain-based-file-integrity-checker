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
    <div className="min-h-screen bg-gradient-to-br from-darker via-dark to-darker text-white">
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-darker/80 border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                <FaShieldAlt className="text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  BlockChain File Integrity Checker
                </h1>
                <p className="text-sm text-gray-400">Secure your file integrity with blockchain</p>
              </div>
            </div>
            {stats && (
              <div className="hidden sm:flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{stats.totalBlocks}</p>
                  <p className="text-xs text-gray-400">Blocks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-secondary">{stats.totalFiles}</p>
                  <p className="text-xs text-gray-400">Files</p>
                </div>
                <div className={`text-center px-3 py-2 rounded-lg ${stats.isValid ? 'bg-success/10' : 'bg-danger/10'}`}>
                  <p className={`text-lg font-bold ${stats.isValid ? 'text-success' : 'text-danger'}`}>
                    {stats.isValid ? 'Valid' : 'Invalid'}
                  </p>
                  <p className="text-xs text-gray-400">Chain</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
                  ? 'bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/50'
                  : 'bg-dark/50 border border-primary/20 hover:border-primary/40'
              }`}
            >
              <tab.icon className="text-lg" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-primary/20 bg-dark/50 backdrop-blur p-6 sm:p-8 shadow-2xl">
          {activeTab === 'upload' && <FileUpload onUploaded={handleFileUploaded} />}
          {activeTab === 'verify' && <FileVerification onVerified={handleFileVerified} />}
          {activeTab === 'files' && <FileList files={files} isLoading={loading} />}
          {activeTab === 'blockchain' && <BlockchainView />}
        </div>
      </div>

      <footer className="border-t border-primary/20 bg-dark/30 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>Secured by Blockchain Technology | File Integrity Guaranteed</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
