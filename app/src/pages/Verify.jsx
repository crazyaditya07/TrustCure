import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Scan, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Package, 
  User, 
  MapPin, 
  Calendar,
  Shield,
  QrCode,
  Loader2
} from 'lucide-react'
import Timeline from '../components/Timeline'
import AnimatedButton from '../components/AnimatedButton'
import { mockProducts } from '../data/mockProducts'

const Verify = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifiedProduct, setVerifiedProduct] = useState(null)
  const [error, setError] = useState(null)

  const handleScan = () => {
    setIsScanning(true)
    setError(null)
    setVerifiedProduct(null)
    
    // Simulate QR scanning
    setTimeout(() => {
      setIsScanning(false)
      setSearchQuery('0x7a3f...8e2d')
      handleVerify('0x7a3f...8e2d')
    }, 2000)
  }

  const handleVerify = (query = searchQuery) => {
    if (!query.trim()) {
      setError('Please enter a product ID or scan a QR code')
      return
    }

    setIsVerifying(true)
    setError(null)
    setVerifiedProduct(null)

    // Simulate verification
    setTimeout(() => {
      const product = mockProducts.find(
        (p) => p.id.toLowerCase().includes(query.toLowerCase()) || 
               p.tokenId.toString() === query
      )

      if (product) {
        setVerifiedProduct(product)
      } else {
        setError('Product not found. Please check the ID and try again.')
      }
      setIsVerifying(false)
    }, 1500)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleVerify()
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
          >
            <Scan className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Verify Product Authenticity
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Enter a product ID or scan a QR code to verify its authenticity 
            and view its complete supply chain journey.
          </p>
        </motion.div>

        {/* Verification Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-trustcure-card/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 mb-8"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter product ID or token number..."
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleScan}
                  disabled={isScanning}
                  className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl hover:bg-white/15 border border-white/10 transition-all disabled:opacity-50"
                >
                  {isScanning ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <QrCode className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">Scan QR</span>
                </motion.button>
                
                <AnimatedButton
                  type="submit"
                  loading={isVerifying}
                  disabled={isVerifying || isScanning}
                >
                  Verify
                </AnimatedButton>
              </div>
            </div>
          </form>

          {/* QR Scanner Placeholder */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6"
              >
                <div className="relative aspect-video max-w-sm mx-auto bg-black rounded-2xl overflow-hidden border-2 border-indigo-500/50">
                  {/* Scanner Animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white/30 rounded-lg relative">
                      {/* Corner Markers */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-500" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-500" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-500" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-500" />
                      
                      {/* Scanning Line */}
                      <motion.div
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-lg shadow-indigo-500/50"
                      />
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-white/70 text-sm">Position QR code within frame</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
            >
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verification Result */}
        <AnimatePresence>
          {verifiedProduct && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Verification Badge */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                className="flex items-center justify-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                >
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </motion.div>
                <div>
                  <p className="text-green-400 font-semibold">Product Verified</p>
                  <p className="text-green-400/70 text-sm">This product is authentic and registered on the blockchain</p>
                </div>
              </motion.div>

              {/* Product Details */}
              <div className="bg-trustcure-card/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                    <Package className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {verifiedProduct.name}
                    </h2>
                    <p className="text-gray-400 text-sm mb-2">
                      {verifiedProduct.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-medium rounded-full">
                        Token #{verifiedProduct.tokenId}
                    </span>
                      <span className="px-3 py-1 bg-white/5 text-gray-400 text-xs font-medium rounded-full font-mono">
                        {verifiedProduct.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <User className="w-4 h-4" />
                      <span>Manufacturer</span>
                    </div>
                    <p className="text-white font-medium">{verifiedProduct.manufacturer}</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <MapPin className="w-4 h-4" />
                      <span>Current Owner</span>
                    </div>
                    <p className="text-white font-medium truncate">{verifiedProduct.currentOwner}</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created</span>
                    </div>
                    <p className="text-white font-medium">
                      {new Date(verifiedProduct.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Certifications */}
                {verifiedProduct.metadata.certifications.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-400" />
                      Certifications
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {verifiedProduct.metadata.certifications.map((cert) => (
                        <span
                          key={cert}
                          className="px-3 py-1.5 bg-green-500/10 text-green-400 text-sm rounded-lg border border-green-500/20"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Supply Chain Journey */}
              <div className="bg-trustcure-card/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">
                  Supply Chain Journey
                </h3>
                <Timeline stages={verifiedProduct.journey} animated={true} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Verify
