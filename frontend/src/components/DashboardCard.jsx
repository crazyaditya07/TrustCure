import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const DashboardCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend = null, 
  trendValue = null,
  color = 'indigo',
  delay = 0 
}) => {
  // Solid dark glass card — no gradient backgrounds on cards
  const borderColors = {
    indigo: 'border-indigo-500/20 hover:border-indigo-500/40',
    purple: 'border-purple-500/20 hover:border-purple-500/35',
    cyan:   'border-cyan-500/20 hover:border-cyan-500/35',
    green:  'border-green-500/20 hover:border-green-500/35',
    orange: 'border-orange-500/20 hover:border-orange-500/35',
    pink:   'border-pink-500/20 hover:border-pink-500/35',
  }

  const iconColors = {
    indigo: 'text-indigo-400 bg-indigo-500/15',
    purple: 'text-purple-400 bg-purple-500/15',
    cyan:   'text-cyan-400 bg-cyan-500/15',
    green:  'text-green-400 bg-green-500/15',
    orange: 'text-orange-400 bg-orange-500/15',
    pink:   'text-pink-400 bg-pink-500/15',
  }

  const glowColors = {
    indigo: 'rgba(99,102,241,0.18)',
    purple: 'rgba(139,92,246,0.12)',
    cyan:   'rgba(6,182,212,0.12)',
    green:  'rgba(34,197,94,0.12)',
    orange: 'rgba(249,115,22,0.12)',
    pink:   'rgba(236,72,153,0.12)',
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'

  // Primary stat gets a larger value and a subtle glow ring
  const isPrimary = color === 'indigo'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl border bg-white/[0.04] backdrop-blur-sm p-6 transition-all duration-300 ${
        borderColors[color]
      } ${
        isPrimary ? 'ring-1 ring-indigo-500/10' : ''
      }`}
      style={isPrimary ? { boxShadow: `0 0 0 1px ${glowColors[color]}, 0 4px 24px ${glowColors[color]}` } : {}}
    >
      {/* Subtle ambient glow in corner */}
      <div
        className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-2xl opacity-60 pointer-events-none"
        style={{ background: glowColors[color] }}
      />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className={`w-11 h-11 rounded-xl ${iconColors[color]} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
          
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">{title}</p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: delay + 0.15 }}
          className={`font-bold text-white mb-1.5 ${isPrimary ? 'text-4xl' : 'text-3xl'}`}
        >
          {value}
        </motion.div>
        
        {subtitle && (
          <p className="text-gray-600 text-xs">{subtitle}</p>
        )}
      </div>
    </motion.div>
  )
}

export default DashboardCard
