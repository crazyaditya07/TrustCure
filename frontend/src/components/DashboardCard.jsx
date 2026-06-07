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
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-[10px] p-6 transition-all duration-300"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)'
      }}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className="w-11 h-11 rounded-[8px] flex items-center justify-center" style={{ background: 'var(--icon-bg)', color: 'var(--accent-teal-lt)' }}>
            <Icon className="w-5 h-5" />
          </div>
          
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-xs font-[600] ${trendColor}`}>
              <TrendIcon className="w-3.5 h-3.5" />
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        <p style={{ color: 'var(--text-hint)', fontSize: '10px' }} className="font-[600] uppercase tracking-wider mb-2">{title}</p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: delay + 0.15 }}
          className="font-[600] text-[var(--text-primary)] mb-1.5 text-3xl"
        >
          {value}
        </motion.div>
        
        {subtitle && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>
    </motion.div>
  )
}

export default DashboardCard
