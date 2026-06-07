import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Blocks,
  LayoutDashboard,
  ScanLine,
  PlusCircle,
  History,
  Menu,
  X,
  LogOut,
  User,
  LogIn
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userRoles = user?.roles || (user?.role ? [user.role] : [])
  const isManufacturerOrAdmin = userRoles.some(r => ['MANUFACTURER', 'ADMIN'].includes(r))

  const navLinks = [
    { path: '/', label: 'Home', icon: Blocks },
    { path: '/scan', label: 'Verify', icon: ScanLine },
    ...(isAuthenticated ? [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ...(!isManufacturerOrAdmin ? [{ path: '/my-scans', label: 'My Scans', icon: History }] : []),
      ...(isManufacturerOrAdmin ? [{ path: '/create-product', label: 'Create', icon: PlusCircle }] : [])
    ] : [])
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
        ? ''
        : 'bg-transparent'
        }`}
      style={isScrolled ? { background: 'rgba(18,18,20,0.88)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #1E1E20' } : {}}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center p-0.5 rounded-2xl bg-gradient-to-br from-[#0a0a0f] to-[#12121a]"
            >
              <div>
                <Blocks className="w-5 h-5 text-teal-400 m-2.5" />
              </div>
            </motion.div>
            <span className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-teal-400 group-hover:to-cyan-500 transition-all">
              TrustCure
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = location.pathname === link.path

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="relative px-4 py-2"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[8px] transition-all duration-300`}
                    style={{ color: isActive ? 'var(--accent-teal)' : 'var(--text-muted)' }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 rounded-[8px]"
                        style={{ background: 'var(--bg-raised)' }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="relative z-10 font-medium">{link.label}</span>
                  </motion.div>
                </Link>
              )
            })}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm hidden xl:block">
                  {user?.name || user?.email}
                </span>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-5 py-2.5 font-[600] transition-all duration-300"
                  style={{ background: '#2E1C1C', color: '#B06050', border: '1px solid #4A2828', borderRadius: '6px' }}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-[6px] font-[600] hover:bg-[var(--bg-raised)] transition-all duration-300"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Login
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-[6px] font-[600] transition-all duration-300"
                    style={{ background: '#3A6A5A', color: '#D4EDE4' }}
                  >
                    Get Started
                  </motion.button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/5 text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden"
            style={{ background: 'rgba(18,18,20,0.88)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #1E1E20' }}
          >
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link, index) => {
                const Icon = link.icon
                const isActive = location.pathname === link.path

                return (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-[8px] transition-all hover:bg-[var(--bg-raised)]"
                      style={{ color: isActive ? 'var(--accent-teal)' : 'var(--text-muted)', background: isActive ? 'var(--bg-raised)' : 'transparent' }}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  </motion.div>
                )
              })}

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.1 }}
                className="pt-4 space-y-3"
              >
                {isAuthenticated ? (
                  <button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 font-[600] transition-all duration-300"
                    style={{ background: '#2E1C1C', color: '#B06050', border: '1px solid #4A2828', borderRadius: '6px' }}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <button className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-[6px] font-[600] hover:bg-[var(--bg-raised)] transition-all duration-300 mb-2" style={{ color: 'var(--text-muted)' }}>
                        Login
                      </button>
                    </Link>
                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                      <button className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-[6px] font-[600] transition-all duration-300" style={{ background: '#3A6A5A', color: '#D4EDE4' }}>
                        Get Started
                      </button>
                    </Link>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default Navbar
