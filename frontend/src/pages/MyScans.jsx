import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  History, 
  Search, 
  ExternalLink, 
  Clock, 
  ShieldCheck,
  ChevronRight,
  ScanLine
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyScans = () => {
  const { user, isAuthenticated } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      fetchScans();
    }
  }, [isAuthenticated, user]);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/consumer/scans/${user._id}`);
      if (!response.ok) throw new Error('Failed to fetch scan history');
      const data = await response.json();
      setScans(data);
    } catch (err) {
      console.error('Fetch scans error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto pt-16 px-4 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
          <ShieldCheck className="w-10 h-10 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Account Required</h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Please log in to track your product scans and maintain a history of verified items.
        </p>
        <Link to="/login" className="btn btn-primary px-8 py-3 rounded-xl font-bold">
          Log In / Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pt-6 pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
              <History className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">My Scan History</h1>
          </div>
          <p className="text-gray-400">View and manage your recently verified products</p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/scan" className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all group">
            <ScanLine className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            Scan New Product
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
          <p className="text-red-400">{error}</p>
          <button onClick={fetchScans} className="mt-4 text-sm font-bold text-red-400 hover:underline">
            Try Again
          </button>
        </div>
      ) : scans.length === 0 ? (
        <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No scans recorded yet</h3>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">
            Scan a product QR code to verify its authenticity and see it here.
          </p>
          <Link to="/scan" className="btn btn-primary px-6 py-2.5 rounded-xl text-sm font-bold">
            Scan First Product
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {scans.map((scan, index) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={scan._id}
              className="group relative"
            >
              <Link to={`/product/${scan.productId}`}>
                <div className="flex items-center justify-between p-5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-indigo-500/30 rounded-2xl transition-all duration-300 backdrop-blur-sm">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-indigo-500/20 transition-colors">
                      <ShieldCheck className="w-7 h-7 text-indigo-400/80" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold group-hover:text-indigo-400 transition-colors">
                        {scan.productName}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                          ID: {scan.productId}
                        </span>
                        <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                          <Clock className="w-3 h-3" />
                          {formatDate(scan.scannedAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      Verified
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-indigo-400 transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyScans;
