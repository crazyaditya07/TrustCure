import React from 'react';
import { motion } from 'framer-motion';
import { Factory, Truck, Store, User, Package, CheckCircle2 } from 'lucide-react';

const STAGES = [
  { id: 0, label: 'Manufacturer', icon: Factory, color: 'indigo' },
  { id: 1, label: 'Distributor', icon: Truck, color: 'purple' },
  { id: 2, label: 'Retailer', icon: Store, color: 'emerald' },
  { id: 3, label: 'Consumer', icon: User, color: 'blue' },
];

/**
 * ProductJourney Component - Phase 1 Structure
 * 
 * Implements a responsive 4-stage supply chain stepper.
 * - Desktop: Horizontal layout with connecting lines.
 * - Mobile: Vertical timeline layout.
 */
/**
 * ProductJourney Component - Phase 4 UX Polish & Trust Signals
 * 
 * Finalized with motion effects, loading skeletons, and trust signals.
 */
const ProductJourney = ({ currentStage = 0, checkpoints = [], isLoading = false }) => {
  
  // Map raw stage to a consumer-safe role label for tooltips
  const stageRoleLabel = (stage) => {
    const map = {
      Manufacturer: 'Verified Manufacturer',
      Distributor:  'Verified Distributor',
      Retailer:     'Verified Retailer',
      Consumer:     'Verified Consumer',
    };
    return map[stage] || stage;
  };

  // Format timestamp to date-only (no time, no timezone)
  const formatTime = (ts) => {
    if (!ts || ts === 0) return 'Pending';
    const date = new Date(Number(ts) * 1000);
    if (isNaN(date.getTime())) return 'Pending';
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl animate-pulse">
        <div className="h-6 w-48 bg-gray-700 rounded mb-8" />
        <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-0">
          {[1,2,3,4].map((i) => (
            <div key={i} className="flex md:flex-col items-center gap-5 md:gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-800" />
              <div className="h-3 w-16 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-white tracking-tight">Product Journey</h3>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto cursor-default"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          On-Chain Verified
        </motion.div>
      </div>

      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-10 md:gap-0">
        {/* Progress Line (Desktop) */}
        <div className="hidden md:block absolute top-7 left-0 right-0 h-0.5 bg-gray-700/30 -z-10" />
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentStage / (STAGES.length - 1)) * 100}%` }}
          transition={{ duration: 1, ease: 'circOut' }}
          className="hidden md:block absolute top-7 left-0 h-0.5 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 bg-[length:200%_auto] animate-gradient-x -z-10"
        />
        
        {/* Progress Line (Mobile) */}
        <div className="md:hidden absolute left-7 top-0 bottom-0 w-0.5 bg-gray-700/30 -z-10" />
        <motion.div 
          initial={{ height: 0 }}
          animate={{ height: `${(currentStage / (STAGES.length - 1)) * 100}%` }}
          transition={{ duration: 1.2, ease: 'circOut' }}
          className="md:hidden absolute left-7 top-0 w-0.5 bg-gradient-to-b from-indigo-500 to-cyan-500 -z-10"
        />

        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const isCompleted = index < currentStage;
          const isActive = index === currentStage;
          const cp = checkpoints[index];
          
          return (
            <motion.div 
              key={stage.id} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex md:flex-col items-center gap-5 md:gap-4 relative z-10 w-full md:w-auto group"
            >
              {/* Node Icon Container */}
              <div className="relative group cursor-help">
                {/* Active Glow */}
                {isActive && (
                  <motion.div 
                    layoutId="active-glow"
                    className="absolute inset-0 rounded-2xl bg-indigo-500/30 blur-2xl"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  />
                )}

                <motion.div 
                  whileHover={{ scale: (isCompleted || isActive) ? 1.05 : 1 }}
                  animate={{ 
                    scale: isActive ? 1.1 : 1,
                    borderColor: (isCompleted || isActive) ? 'rgb(99 102 241)' : 'rgb(55 65 81)',
                    backgroundColor: isCompleted ? 'rgb(99 102 241)' : 'rgb(17 24 39)',
                    boxShadow: isActive ? '0 0 30px rgba(99,102,241,0.2)' : 'none'
                  }}
                  className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 relative z-20`}
                >
                  <Icon className={`w-6 h-6 transition-colors duration-500 ${
                    isCompleted ? 'text-white' : (isActive ? 'text-indigo-400' : 'text-gray-600')
                  }`} />

                  {/* Floating Product Marker */}
                  {isActive && (
                    <motion.div 
                      layoutId="product-marker"
                      initial={{ y: 0 }}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      className="absolute -top-4 -right-3 w-8 h-8 bg-white rounded-xl shadow-2xl flex items-center justify-center border border-indigo-100 z-30"
                    >
                      <Package className="w-4 h-4 text-indigo-600" />
                    </motion.div>
                  )}

                  {/* Trust Badge */}
                  {isCompleted && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-xl ring-2 ring-indigo-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 fill-white" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Detail Tooltip */}
                {(isCompleted || isActive) && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-[110%] mb-3 w-52 p-4 rounded-xl bg-gray-900/95 backdrop-blur shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 scale-95 group-hover:scale-100 origin-bottom">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Verified Actor</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      </div>
                      <div className="text-[11px] text-indigo-300 font-medium">
                        {stageRoleLabel(stage.label)}
                      </div>
                      <div className="pt-2 mt-2 border-t border-white/5">
                        <div className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Entry Date</div>
                        <div className="text-[11px] text-white/90 font-medium">{cp ? formatTime(cp.timestamp) : 'Pending...'}</div>
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900/95" />
                  </div>
                )}
              </div>

              {/* Node Label */}
              <div className="flex flex-col md:items-center text-left md:text-center select-none">
                <motion.span 
                  animate={{ color: (isCompleted || isActive) ? 'rgb(255 255 255)' : 'rgb(107 114 128)' }}
                  className="text-[11px] font-black uppercase tracking-[0.2em]"
                >
                  {stage.label}
                </motion.span>
                <div className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight transition-colors duration-500 ${
                  isCompleted ? 'bg-indigo-500/20 text-indigo-400' : (isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800/50 text-gray-600')
                }`}>
                  {isCompleted ? 'Verified' : (isActive ? 'Current' : 'Upcoming')}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ProductJourney;
