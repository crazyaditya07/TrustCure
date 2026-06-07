import { motion } from 'framer-motion'

const AnimatedButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  icon: Icon = null,
  disabled = false,
  loading = false,
  className = '',
  type = 'button'
}) => {
  const variants = {
    primary: 'bg-[var(--accent-teal)] text-[var(--text-primary)] border border-transparent',
    secondary: 'bg-transparent text-[var(--accent-teal-lt)] hover:bg-[var(--bg-raised)] border border-[var(--border-warm)]',
    outline: 'bg-transparent text-[var(--accent-teal-lt)] hover:bg-[var(--bg-raised)] border border-[var(--border-warm)]',
    ghost: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)]',
    amber: 'bg-[var(--accent-amber)] text-[#1A1208] border border-transparent',
    success: 'bg-[var(--verified-bg)] text-[var(--verified-text)] border border-[var(--verified-border)]',
    danger: 'bg-[var(--danger-bg)] text-[var(--danger-text)] border border-[var(--danger-border)]',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02, y: disabled || loading ? 0 : -1 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`
        relative inline-flex items-center justify-center gap-2 
        rounded-[6px] font-medium transition-all duration-300
        ${variants[variant]}
        ${sizes[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
        />
      )}
      
      {!loading && Icon && <Icon className="w-4 h-4" />}
      
      <span>{children}</span>
      
      {/* Shine Effect */}
      {!disabled && !loading && variant === 'primary' && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          whileHover={{ x: '100%', opacity: 0.3 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
        />
      )}
    </motion.button>
  )
}

export default AnimatedButton
