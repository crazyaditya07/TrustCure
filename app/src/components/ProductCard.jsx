import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Package, 
  MapPin, 
  User, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Truck
} from 'lucide-react'

const statusConfig = {
  manufactured: { label: 'Manufactured', color: 'bg-blue-500', icon: Package },
  in_transit: { label: 'In Transit', color: 'bg-purple-500', icon: Truck },
  at_distributor: { label: 'At Distributor', color: 'bg-orange-500', icon: MapPin },
  at_retailer: { label: 'At Retailer', color: 'bg-cyan-500', icon: MapPin },
  sold: { label: 'Sold', color: 'bg-green-500', icon: CheckCircle2 },
}

const ProductCard = ({ product, index = 0 }) => {
  const status = statusConfig[product.status] || statusConfig.manufactured
  const StatusIcon = status.icon

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
              <h3 className="text-white font-semibold group-hover:text-gradient transition-all">
                {product.name}
              </h3>
              <p className="text-gray-500 text-sm">#{product.tokenId}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${status.color}/10 border ${status.color}/20`}>
            <StatusIcon className={`w-3.5 h-3.5 ${status.color.replace('bg-', 'text-')}`} />
            <span className={`text-xs font-medium ${status.color.replace('bg-', 'text-')}`}>
              {status.label}
            </span>
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
            <span className="text-white">{product.manufacturer}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400">Current Owner:</span>
            <span className="text-white truncate max-w-[150px]">{product.currentOwner}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{new Date(product.createdAt).toLocaleDateString()}</span>
          </div>
          
          <Link to={`/verify?id=${product.id}`}>
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
    </motion.div>
  )
}

export default ProductCard
