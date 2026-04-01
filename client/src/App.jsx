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
                  Certificate Verifier
                </h1>
                <p className="text-sm text-gray-400 mt-1">Secure certificate verification with blockchain</p>
              </div>
            </div>
            {stats && (
              <div className="hidden sm:flex items-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{stats.totalBlocks}</p>
                  <p className="text-xs text-gray-400 mt-1">Blocks</p>
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

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Mode Selector */}
        <div className="mb-8 flex gap-3 flex-wrap justify-between items-center">
          <div className="flex gap-3 flex-wrap">
            {!adminAuth ? (
              <>
                <button
                  onClick={() => { setUserMode('user'); setActiveTab('verify'); }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    userMode === 'user'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50 scale-105'
                      : 'bg-slate-800/50 border border-green-500/20 text-gray-300 hover:border-green-500/40'
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
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === 'dashboard'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50 scale-105'
                      : 'bg-slate-800/50 border border-green-500/20 text-gray-300 hover:border-green-500/40'
                  }`}
                >
                  <FaLock className="text-lg" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('upload-cert')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === 'upload-cert'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50 scale-105'
                      : 'bg-slate-800/50 border border-green-500/20 text-gray-300 hover:border-green-500/40'
                  }`}
                >
                  <FaUpload className="text-lg" />
                  Add Certificate
                </button>
              </>
            )}
          </div>

          {!adminAuth ? (
            <div className="flex gap-2">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Admin key..."
                className="px-4 py-2 bg-slate-700/50 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
              <button
                onClick={handleAdminLogin}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-green-500/50 active:scale-95 flex items-center gap-1"
              >
                <FaKeyboard className="text-sm" />
                Login
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-300 border border-slate-600"
            >
              Logout
            </button>
          )}
        </div>

        {/* Tab Navigation for User Mode */}
        {!adminAuth && (
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setActiveTab('verify')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'verify'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50 scale-105'
                  : 'bg-slate-800/50 border border-green-500/20 text-gray-300 hover:border-green-500/40'
              }`}
            >
              <FaCheck className="text-lg" />
              Verify Certificate
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'certificates'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50 scale-105'
                  : 'bg-slate-800/50 border border-green-500/20 text-gray-300 hover:border-green-500/40'
              }`}
            >
              <FaLink className="text-lg" />
              Certificates
            </button>
            <button
              onClick={() => setActiveTab('blockchain')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'blockchain'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50 scale-105'
                  : 'bg-slate-800/50 border border-green-500/20 text-gray-300 hover:border-green-500/40'
              }`}
            >
              <FaShieldAlt className="text-lg" />
              Blockchain
            </button>
          </div>
        )}

        {/* Main Content Card */}
        <div className="rounded-xl border border-green-500/20 bg-slate-800/40 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-green-500/10">
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
      <footer className="border-t border-green-500/20 bg-slate-900/50 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p className="mb-1">🔐 Secured by Blockchain Technology | Certificate Integrity Guaranteed</p>
          <p className="text-xs text-gray-500">Enterprise-Grade Security for Document Verification</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
