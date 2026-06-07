import React from 'react';
import { motion } from 'framer-motion';
import { 
  PlusCircle, 
  ArrowRight, 
  ShoppingBag, 
  ExternalLink,
  Clock,
  Activity
} from 'lucide-react';

const ActionHistory = ({ actions = [], loading = false }) => {
  const getActionConfig = (type) => {
    switch (type) {
      case 'ProductMinted':
        return { label: 'Manufactured', icon: PlusCircle };
      case 'TransferredToDistributor':
      case 'TransferredToRetailer':
      case 'ProductTransferred':
        return { label: 'Transfer', icon: ArrowRight };
      case 'ProductSold':
        return { label: 'Sold', icon: ShoppingBag };
      default:
        return { label: 'Activity', icon: Activity };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="space-y-3 p-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-gray-500 text-sm italic">No recent activity recorded on the blockchain.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
      {actions.map((action, index) => {
        const config = getActionConfig(action.eventType);
        const Icon = config.icon;

        return (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            key={action._id || index}
            className="group flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1A2820', border: '1px solid #28402E' }}>
                <Icon className="w-5 h-5" style={{ color: '#5A9A70' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#5A9A70' }}>
                    {config.label}
                  </span>
                  <span className="text-gray-500 text-[10px]">#{(action.productId || action.tokenId || '').slice(-8)}</span>
                </div>
                <div className="text-gray-400 text-xs mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 opacity-50" />
                  {formatDate(action.timestamp)}
                </div>
              </div>
            </div>

            <a 
              href={`https://sepolia.etherscan.io/tx/${action.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100"
              title="View on Explorer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ActionHistory;
