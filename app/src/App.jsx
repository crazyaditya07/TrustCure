import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Verify from './pages/Verify'
import CreateProduct from './pages/CreateProduct'

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
}

const AnimatedPage = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="min-h-screen"
  >
    {children}
  </motion.div>
)

function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-trustcure-darker relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="gradient-orb w-96 h-96 bg-indigo-600 top-0 left-1/4" />
        <div className="gradient-orb w-80 h-80 bg-purple-600 bottom-1/4 right-0" />
        <div className="gradient-orb w-64 h-64 bg-cyan-600 top-1/2 left-0" />
        <div className="absolute inset-0 bg-grid" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <Navbar />
        
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <AnimatedPage>
                  <Home />
                </AnimatedPage>
              }
            />
            <Route
              path="/dashboard"
              element={
                <AnimatedPage>
                  <Dashboard />
                </AnimatedPage>
              }
            />
            <Route
              path="/verify"
              element={
                <AnimatedPage>
                  <Verify />
                </AnimatedPage>
              }
            />
            <Route
              path="/create"
              element={
                <AnimatedPage>
                  <CreateProduct />
                </AnimatedPage>
              }
            />
          </Routes>
        </AnimatePresence>
        
        <Footer />
      </div>
    </div>
  )
}

export default App
