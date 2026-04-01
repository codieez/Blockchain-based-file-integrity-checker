import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUpload, FaCheck, FaShieldAlt, FaLink, FaLock, FaUser, FaKeyboard } from 'react-icons/fa';
import FileVerification from './components/FileVerification';
import CertificateList from './components/CertificateList';
import BlockchainView from './components/BlockchainView';
import AdminUpload from './components/AdminUpload';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [userMode, setUserMode] = useState('user'); // 'user' or 'admin'
  const [activeTab, setActiveTab] = useState('verify');
  const [adminKey, setAdminKey] = useState('');
  const [adminAuth, setAdminAuth] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/blockchain');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAdminLogin = () => {
    if (adminKey === 'admin123') {
      setAdminAuth(true);
      setUserMode('admin');
      setActiveTab('dashboard');
    } else {
      alert('Invalid admin key');
    }
  };

  const handleLogout = () => {
    setAdminAuth(false);
    setUserMode('user');
    setActiveTab('verify');
    setAdminKey('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-b from-slate-900/95 to-slate-900/60 border-b border-blue-500/30 shadow-2xl shadow-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 group">
              <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg shadow-blue-500/40 group-hover:shadow-blue-500/60 transition-all duration-500 group-hover:scale-110">
                <FaShieldAlt className="text-3xl text-white" />
              </div>
              <div className="fade-in">
                <h1 className="text-4xl font-bold gradient-text">
                  File Integrity Checker
                </h1>
                <p className="text-sm text-gray-400 mt-1 font-medium">Secure blockchain-backed file verification</p>
              </div>
            </div>
            {stats && (
              <div className="hidden sm:flex items-center gap-8 slide-in">
                <div className="group text-center cursor-default">
                  <p className="text-4xl font-bold text-blue-400 group-hover:scale-110 transition-transform duration-300">{stats.totalBlocks}</p>
                  <p className="text-xs text-gray-400 mt-1 font-semibold">BLOCKS</p>
                </div>
                <div className={`text-center px-6 py-3 rounded-xl font-semibold transition-all duration-500 group ${stats.isValid ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/60 hover:border-emerald-500/80' : 'bg-gradient-to-r from-red-500/20 to-pink-500/10 border border-red-500/60 hover:border-red-500/80'}`}>
                  <p className={`text-lg font-bold ${stats.isValid ? 'text-emerald-300' : 'text-red-300'}`}>
                    {stats.isValid ? '✓ VALID' : '✗ INVALID'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-semibold">CHAIN</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Mode Selector */}
        <div className="mb-10 flex gap-4 flex-wrap justify-between items-center fade-in">
          <div className="flex gap-3 flex-wrap">
            {!adminAuth ? (
              <>
                <button
                  onClick={() => { setUserMode('user'); setActiveTab('verify'); }}
                  className={`tab-button ${
                    userMode === 'user' ? 'active' : 'inactive'
                  }`}
                >
                  <FaUser className="text-lg" />
                  User Mode
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`tab-button ${
                    activeTab === 'dashboard' ? 'active' : 'inactive'
                  }`}
                >
                  <FaLock className="text-lg" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('upload-cert')}
                  className={`tab-button ${
                    activeTab === 'upload-cert' ? 'active' : 'inactive'
                  }`}
                >
                  <FaUpload className="text-lg" />
                  Add Reference File
                </button>
              </>
            )}
          </div>

          {!adminAuth ? (
            <div className="flex gap-2 slide-in">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Admin key..."
                className="input-field text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
              <button
                onClick={handleAdminLogin}
                className="btn-primary"
              >
                <FaKeyboard className="text-sm" />
                Login
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="btn-secondary px-6 py-3"
            >
              Logout
            </button>
          )}
        </div>

        {/* Tab Navigation for User Mode */}
        {!adminAuth && (
          <div className="flex flex-wrap gap-3 mb-10 fade-in">
            <button
              onClick={() => setActiveTab('verify')}
              className={`tab-button ${
                activeTab === 'verify' ? 'active' : 'inactive'
              }`}
            >
              <FaCheck className="text-lg" />
              Verify File
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`tab-button ${
                activeTab === 'certificates' ? 'active' : 'inactive'
              }`}
            >
              <FaLink className="text-lg" />
              Registered Files
            </button>
            <button
              onClick={() => setActiveTab('blockchain')}
              className={`tab-button ${
                activeTab === 'blockchain' ? 'active' : 'inactive'
              }`}
            >
              <FaShieldAlt className="text-lg" />
              Blockchain
            </button>
          </div>
        )}

        {/* Main Content Card */}
        <div className="card fade-in shadow-2xl border-green-500/40 hover:border-green-500/60">
          {/* User Mode */}
          {!adminAuth && (
            <>
              {activeTab === 'verify' && <FileVerification />}
              {activeTab === 'certificates' && <CertificateList />}
              {activeTab === 'blockchain' && <BlockchainView />}
            </>
          )}

          {/* Admin Mode */}
          {adminAuth && (
            <>
              {activeTab === 'dashboard' && <AdminDashboard />}
              {activeTab === 'upload-cert' && <AdminUpload />}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-blue-500/20 bg-gradient-to-r from-slate-900/60 to-slate-900/40 backdrop-blur-xl mt-20 py-10 fade-in">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-300 font-semibold mb-2">🔐 Secured by Blockchain Technology</p>
          <p className="text-sm text-gray-400">Enterprise-grade integrity validation for any file type</p>
          <div className="mt-6 flex justify-center gap-4">
            <div className="text-xs text-gray-500">✓ Immutable Records</div>
            <div className="text-xs text-gray-500">✓ Cryptographic Verification</div>
            <div className="text-xs text-gray-500">✓ Complete Transparency</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
