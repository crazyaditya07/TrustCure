import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Package,
  MapPin,
  User,
  ArrowRight,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRightLeft
} from 'lucide-react'

const statusConfig = {
  manufactured: { label: 'Manufactured', color: 'bg-blue-500', icon: Package },
  in_transit: { label: 'In Transit', color: 'bg-purple-500', icon: Truck },
  at_distributor: { label: 'At Distributor', color: 'bg-orange-500', icon: MapPin },
  at_retailer: { label: 'At Retailer', color: 'bg-cyan-500', icon: MapPin },
  sold: { label: 'Sold', color: 'bg-green-500', icon: CheckCircle2 },
}

// Truncate a wallet address for compact display: 0x3f12…858e
const truncateWallet = (w) => (w && w.length > 10) ? `${w.slice(0, 6)}…${w.slice(-4)}` : (w || '');

const ProductCard = ({ product, index = 0, onTransfer, currentUserWallet }) => {
  const status = statusConfig[product.status] || statusConfig.manufactured
  const StatusIcon = status.icon

  const isOwner = currentUserWallet && product.currentOwnerWallet === currentUserWallet;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative bg-trustcure-card/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <Link to={`/product/${product.productId}`} className="hover:text-indigo-400 transition-colors">
                <h3 className="text-white font-semibold hover:text-indigo-400 transition-all">
                  {product.name}
                </h3>
              </Link>
              <Link to={`/product/${product.productId}`} className="hover:text-indigo-300 transition-colors">
                <p className="text-gray-500 text-sm hover:text-gray-400">#{product.tokenId}</p>
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${status.color}/10 border ${status.color}/20`}>
              <StatusIcon className={`w-3.5 h-3.5 ${status.color.replace('bg-', 'text-')}`} />
              <span className={`text-xs font-medium ${status.color.replace('bg-', 'text-')}`}>
                {status.label}
              </span>
            </div>

            {/* Transfer Status Badge */}
            {product.transferStatus && product.transferStatus !== 'none' && (
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider
                ${product.transferStatus === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                  product.transferStatus === 'confirmed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                  'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'}`}>
                {product.transferStatus === 'pending' ? 'Awaiting Receiver' : 
                 product.transferStatus === 'confirmed' ? 'Awaiting Settlement' : 
                 'Processing...'}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400">Manufacturer:</span>
            <span className="text-white">
              {typeof product.manufacturer === 'object' ? product.manufacturer?.name : product.manufacturer}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400">Current Owner:</span>
            <span
              className="text-white truncate max-w-[150px]"
              title={product.currentOwnerWallet || ''}
            >
              {product.currentOwner || truncateWallet(product.currentOwnerWallet) || 'N/A'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{new Date(product.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-3">
            {product.status !== 'sold' && product.transferStatus === 'none' && (
              <div className="relative group/tooltip">
                <motion.button
                  whileHover={isOwner ? { scale: 1.05 } : {}}
                  whileTap={isOwner ? { scale: 0.95 } : {}}
                  onClick={(e) => {
                    e.preventDefault();
                    if (isOwner) onTransfer();
                  }}
                  disabled={!isOwner}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all border 
                    ${isOwner 
                      ? 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border-indigo-500/30' 
                      : 'bg-gray-800/40 text-gray-500 border-gray-700/50 cursor-not-allowed'
                    }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Transfer
                </motion.button>
                
                {/* Tooltip for non-owners */}
                {!isOwner && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-900 border border-white/10 text-gray-300 text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none">
                    You do not own this product
                  </div>
                )}
              </div>
            )}
            
            <Link to={`/product/${product.productId}`}>
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
              >
                Verify
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProductCard
