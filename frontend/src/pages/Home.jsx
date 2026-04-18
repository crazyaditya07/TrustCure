import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    ArrowRight,
    ShieldCheck,
    Globe,
    Search,
} from 'lucide-react'
import AnimatedButton from '../components/AnimatedButton'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
    const { isAuthenticated } = useAuth();
    // Note: copied from pages_new/Home.jsx content and adapted slightly if needed
    // Assuming pages_new/Home.jsx content is correct and compatible
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5
            }
        }
    }

    const features = [
        {
            icon: ShieldCheck,
            title: "Blockchain Verified",
            description: "Every product journey is immutable and transparently recorded on Ethereum."
        },
        {
            icon: Globe,
            title: "Global Tracking",
            description: "Monitor supply chain movements in real-time across the world."
        },
        {
            icon: Search,
            title: "Instant Verification",
            description: "Scan QR codes to instantly verify product authenticity and origin."
        }
    ]

    return (
        <div className="relative">
            {/* Hero Section */}
            <section className="relative pt-24 pb-36 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-center max-w-4xl mx-auto"
                    >
                        <motion.div variants={itemVariants} className="mb-8 flex justify-center">
                            <div className="px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                Next Generation Supply Chain
                            </div>
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-[1.15] tracking-tight"
                        >
                            Track Products with{' '}<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                                Unbreakable Trust
                            </span>
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
                        >
                            TrustCure leverages blockchain technology to provide transparent, tamper-proof tracking for your entire supply chain lifecycle.
                        </motion.p>

                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        >
                            {isAuthenticated ? (
                                <Link to="/dashboard">
                                    <AnimatedButton variant="primary" size="lg" icon={ArrowRight}>
                                        Go to Dashboard
                                    </AnimatedButton>
                                </Link>
                            ) : (
                                <Link to="/register">
                                    <AnimatedButton variant="primary" size="lg" icon={ArrowRight}>
                                        Get Started
                                    </AnimatedButton>
                                </Link>
                            )}
                            <Link to="/scan">
                                <AnimatedButton variant="outline" size="lg" icon={Search}>
                                    Verify Product
                                </AnimatedButton>
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Background Gradient */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] -z-10" />
            </section>

            {/* Features Section */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {features.map((feature, index) => {
                            const Icon = feature.icon
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                    className="p-8 rounded-2xl bg-white/[0.04] border border-white/8 backdrop-blur-sm hover:border-indigo-500/25 hover:bg-white/[0.06] transition-all duration-300 group cursor-default"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-indigo-500/15 flex items-center justify-center mb-6 group-hover:bg-indigo-500/25 transition-colors duration-300">
                                        <Icon className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-3 tracking-tight">{feature.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                </div>
            </section>
        </div>
    )
}

export default Home
