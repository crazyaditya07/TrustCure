import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Blocks,
  Shield,
  Scan,
  Zap,
  ArrowRight,
  Factory,
  Truck,
  Store,
  User,
  CheckCircle2,
  Globe,
  Lock
} from 'lucide-react'
import AnimatedButton from '../components/AnimatedButton'
import { useAuth } from '../contexts/AuthContext'

const features = [
  {
    icon: Shield,
    title: 'Immutable Records',
    description: 'Every product journey is permanently recorded on the blockchain, ensuring complete transparency and trust.',
    color: 'indigo',
  },
  {
    icon: Scan,
    title: 'Instant Verification',
    description: 'Verify product authenticity in seconds with our QR code scanning and blockchain verification system.',
    color: 'purple',
  },
  {
    icon: Zap,
    title: 'Real-time Tracking',
    description: 'Track products in real-time as they move through the supply chain from manufacturer to consumer.',
    color: 'cyan',
  },
  {
    icon: Lock,
    title: 'Role-based Access',
    description: 'Secure role-based permissions ensure only authorized participants can access and modify product data.',
    color: 'green',
  },
  {
    icon: Globe,
    title: 'Global Coverage',
    description: 'Support for international supply chains with multi-location tracking and compliance.',
    color: 'orange',
  },
  {
    icon: CheckCircle2,
    title: 'Certified Authentic',
    description: 'Products are verified at every checkpoint, ensuring consumers receive genuine items.',
    color: 'pink',
  },
]

const supplyChainSteps = [
  { icon: Factory, label: 'Manufacturer', color: 'from-blue-500 to-blue-600' },
  { icon: Truck, label: 'Distributor', color: 'from-purple-500 to-purple-600' },
  { icon: Store, label: 'Retailer', color: 'from-orange-500 to-orange-600' },
  { icon: User, label: 'Consumer', color: 'from-green-500 to-green-600' },
]

const Home = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
            >
              <Blocks className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-gray-300">Powered by Ethereum Blockchain</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
            >
              <span className="text-white">Trace It.</span>{' '}
              <span className="text-gradient">Trust It.</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
            >
              Blockchain-powered supply chain tracking. Ensuring transparency,
              authenticity, and trust from manufacturer to consumer.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/dashboard">
                <AnimatedButton size="lg" icon={ArrowRight}>
                  Explore Dashboard
                </AnimatedButton>
              </Link>
              <Link to="/verify">
                <AnimatedButton variant="secondary" size="lg" icon={Scan}>
                  Verify Product
                </AnimatedButton>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {[
                { value: '1,247+', label: 'Products Tracked' },
                { value: '89', label: 'Supply Partners' },
                { value: '99.9%', label: 'Verification Rate' },
                { value: '24/7', label: 'Real-time Tracking' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl lg:text-4xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Supply Chain Flow Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Supply Chain Flow
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Products move seamlessly through the supply chain with complete
              transparency and verification at every step.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 via-orange-500 to-green-500 transform -translate-y-1/2" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {supplyChainSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    className="relative"
                  >
                    <motion.div
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="bg-trustcure-card/80 backdrop-blur-xl border border-white/5 rounded-2xl p-8 text-center hover:border-white/10 transition-all duration-300"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.15 + 0.2,
                          type: 'spring',
                          stiffness: 200
                        }}
                        className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-10 h-10 text-white" />
                      </motion.div>

                      <h3 className="text-xl font-semibold text-white mb-2">
                        {step.label}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        Step {index + 1} of the journey
                      </p>

                      {/* Arrow for desktop */}
                      {index < supplyChainSteps.length - 1 && (
                        <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                          <motion.div
                            animate={{ x: [0, 8, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <ArrowRight className="w-8 h-8 text-white/30" />
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Why Choose TrustCure
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our platform provides everything you need to track, verify, and
              trust your supply chain.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colorVariants = {
                indigo: 'text-indigo-400 bg-indigo-500/20',
                purple: 'text-purple-400 bg-purple-500/20',
                cyan: 'text-cyan-400 bg-cyan-500/20',
                green: 'text-green-400 bg-green-500/20',
                orange: 'text-orange-400 bg-orange-500/20',
                pink: 'text-pink-400 bg-pink-500/20',
              }

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <div className="h-full bg-trustcure-card/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-300">
                    <div className={`w-12 h-12 rounded-xl ${colorVariants[feature.color]} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gradient transition-all">
                      {feature.title}
                    </h3>

                    <p className="text-gray-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 p-12 text-center"
          >
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Supply Chain?
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto mb-8">
                Join hundreds of companies already using TrustCure to ensure
                transparency and trust in their supply chains.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <AnimatedButton size="lg" icon={ArrowRight}>
                      Go to Dashboard
                    </AnimatedButton>
                  </Link>
                ) : (
                  <Link to="/register">
                    <AnimatedButton size="lg" icon={ArrowRight}>
                      Get Started
                    </AnimatedButton>
                  </Link>
                )}
                <Link to="/verify">
                  <AnimatedButton variant="secondary" size="lg">
                    Learn More
                  </AnimatedButton>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home
