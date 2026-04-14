import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, 
  CheckCircle2, 
  ArrowRightLeft, 
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  User,
  Box,
  ChevronRight
} from 'lucide-react'
import DashboardCard from '../components/DashboardCard'
import ProductCard from '../components/ProductCard'
import { mockProducts, mockStats, mockActivities, roleBadges } from '../data/mockProducts'

const Dashboard = () => {
  const [userRole] = useState('manufacturer')
  const roleBadge = roleBadges[userRole]

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'product_created':
        return Box
      case 'ownership_transferred':
        return ArrowRightLeft
      case 'product_verified':
        return CheckCircle2
      default:
        return Activity
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'product_created':
        return 'bg-blue-500/20 text-blue-400'
      case 'ownership_transferred':
        return 'bg-purple-500/20 text-purple-400'
      case 'product_verified':
        return 'bg-green-500/20 text-green-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                Dashboard
              </h1>
              <p className="text-gray-400">
                Welcome back! Here's what's happening with your supply chain.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-xl ${roleBadge.color}/20 border ${roleBadge.color}/30`}>
                <span className={`text-sm font-medium ${roleBadge.color.replace('bg-', 'text-')}`}>
                  {roleBadge.label}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="Total Products"
            value={mockStats.totalProducts.toLocaleString()}
            subtitle="Across all supply chains"
            icon={Package}
            trend="up"
            trendValue="12%"
            color="indigo"
            delay={0}
          />
          <DashboardCard
            title="Verified Products"
            value={mockStats.verifiedProducts.toLocaleString()}
            subtitle="95.3% verification rate"
            icon={CheckCircle2}
            trend="up"
            trendValue="8%"
            color="green"
            delay={0.1}
          />
          <DashboardCard
            title="Active Transfers"
            value={mockStats.activeTransfers.toString()}
            subtitle="Currently in transit"
            icon={ArrowRightLeft}
            trend="down"
            trendValue="3%"
            color="purple"
            delay={0.2}
          />
          <DashboardCard
            title="Participants"
            value={mockStats.totalParticipants.toString()}
            subtitle="Manufacturers to consumers"
            icon={Users}
            trend="up"
            trendValue="15%"
            color="cyan"
            delay={0.3}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Products</h2>
              <motion.button
                whileHover={{ x: 4 }}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockProducts.slice(0, 4).map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
              <Activity className="w-5 h-5 text-gray-500" />
            </div>
            
            <div className="bg-trustcure-card/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4">
              <div className="space-y-4">
                {mockActivities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type)
                  const colorClass = getActivityColor(activity.type)
                  
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {activity.type === 'product_created' && 'New product created'}
                          {activity.type === 'ownership_transferred' && 'Ownership transferred'}
                          {activity.type === 'product_verified' && 'Product verified'}
                        </p>
                        <p className="text-gray-400 text-sm truncate">{activity.product}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-500 text-xs truncate">{activity.actor}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-gray-500 text-xs flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-2 p-4 bg-trustcure-card/80 backdrop-blur-xl border border-white/5 rounded-xl hover:border-white/10 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-white text-sm font-medium">Create Product</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-2 p-4 bg-trustcure-card/80 backdrop-blur-xl border border-white/5 rounded-xl hover:border-white/10 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-white text-sm font-medium">Transfer</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-2 p-4 bg-trustcure-card/80 backdrop-blur-xl border border-white/5 rounded-xl hover:border-white/10 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-white text-sm font-medium">Verify</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center gap-2 p-4 bg-trustcure-card/80 backdrop-blur-xl border border-white/5 rounded-xl hover:border-white/10 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-white text-sm font-medium">Manage Users</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
