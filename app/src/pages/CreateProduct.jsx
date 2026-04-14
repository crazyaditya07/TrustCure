import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  Plus, 
  ArrowRightLeft, 
  CheckCircle2, 
  Loader2,
  User,
  MapPin,
  FileText,
  Calendar,
  Shield,
  X
} from 'lucide-react'
import AnimatedButton from '../components/AnimatedButton'

const CreateProduct = () => {
  const [activeTab, setActiveTab] = useState('create')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [certifications, setCertifications] = useState([])
  const [newCert, setNewCert] = useState('')

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    batchNumber: '',
    expiryDate: '',
  })

  const [transferForm, setTransferForm] = useState({
    productId: '',
    newOwner: '',
    location: '',
    notes: '',
  })

  const handleAddCertification = () => {
    if (newCert.trim() && !certifications.includes(newCert.trim())) {
      setCertifications([...certifications, newCert.trim()])
      setNewCert('')
    }
  }

  const handleRemoveCertification = (cert) => {
    setCertifications(certifications.filter((c) => c !== cert))
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate blockchain transaction
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSuccess(true)
    
    // Reset after showing success
    setTimeout(() => {
      setIsSuccess(false)
      setProductForm({
        name: '',
        description: '',
        batchNumber: '',
        expiryDate: '',
      })
      setCertifications([])
    }, 3000)
  }

  const handleTransferSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate blockchain transaction
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSuccess(true)
    
    // Reset after showing success
    setTimeout(() => {
      setIsSuccess(false)
      setTransferForm({
        productId: '',
        newOwner: '',
        location: '',
        notes: '',
      })
    }, 3000)
  }

  const tabs = [
    { id: 'create', label: 'Create Product', icon: Plus },
    { id: 'transfer', label: 'Transfer Ownership', icon: ArrowRightLeft },
  ]

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <Package className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Product Management
          </h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Create new products on the blockchain or transfer ownership 
            to another participant in the supply chain.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex bg-white/5 rounded-xl p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setIsSuccess(false)
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="mb-8 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
              >
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              </motion.div>
              <h3 className="text-xl font-semibold text-green-400 mb-1">
                {activeTab === 'create' ? 'Product Created Successfully!' : 'Ownership Transferred!'}
              </h3>
              <p className="text-green-400/70 text-sm">
                {activeTab === 'create' 
                  ? 'Your product has been registered on the blockchain.' 
                  : 'The ownership transfer has been recorded on the blockchain.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Product Form */}
        <AnimatePresence mode="wait">
          {activeTab === 'create' && !isSuccess && (
            <motion.div
              key="create-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-trustcure-card/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6"
            >
              <form onSubmit={handleProductSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Product Name
                    </label>
                    <div className="relative">
                      <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="Enter product name..."
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Description
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                      <textarea
                        required
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        placeholder="Enter product description..."
                        rows={3}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.batchNumber}
                      onChange={(e) => setProductForm({ ...productForm, batchNumber: e.target.value })}
                      placeholder="e.g., BT-2026-001"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Expiry Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="date"
                        value={productForm.expiryDate}
                        onChange={(e) => setProductForm({ ...productForm, expiryDate: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>


                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Certifications
                    </label>
                    <div className="flex gap-2 mb-3">
                      <div className="relative flex-1">
                        <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={newCert}
                          onChange={(e) => setNewCert(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
                          placeholder="Add certification (e.g., Organic, Fair Trade)..."
                          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAddCertification}
                        className="px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/15 border border-white/10 transition-all"
                      >
                        <Plus className="w-5 h-5" />
                      </motion.button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {certifications.map((cert) => (
                        <motion.span
                          key={cert}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 text-sm rounded-lg"
                        >
                          {cert}
                          <button
                            type="button"
                            onClick={() => handleRemoveCertification(cert)}
                            className="hover:text-indigo-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <AnimatedButton
                    type="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    Create Product on Blockchain
                  </AnimatedButton>
                </div>
              </form>
            </motion.div>
          )}

          {/* Transfer Form */}
          {activeTab === 'transfer' && !isSuccess && (
            <motion.div
              key="transfer-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-trustcure-card/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6"
            >
              <form onSubmit={handleTransferSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Product ID or Token Number
                    </label>
                    <div className="relative">
                      <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={transferForm.productId}
                        onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                        placeholder="Enter product ID..."
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      New Owner Address
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={transferForm.newOwner}
                        onChange={(e) => setTransferForm({ ...transferForm, newOwner: e.target.value })}
                        placeholder="0x..."
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Transfer Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={transferForm.location}
                        onChange={(e) => setTransferForm({ ...transferForm, location: e.target.value })}
                        placeholder="e.g., Los Angeles, USA"
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Transfer Notes
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                      <textarea
                        value={transferForm.notes}
                        onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                        placeholder="Optional notes about this transfer..."
                        rows={3}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <AnimatedButton
                    type="submit"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    Transfer Ownership
                  </AnimatedButton>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <h4 className="text-indigo-400 font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Blockchain Secured
            </h4>
            <p className="text-indigo-400/70 text-sm">
              All transactions are recorded on the Ethereum blockchain for maximum security and transparency.
            </p>
          </div>
          
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <h4 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Instant Verification
            </h4>
            <p className="text-purple-400/70 text-sm">
              Products are immediately verifiable after creation with their unique blockchain ID.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default CreateProduct
