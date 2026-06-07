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
        <div className="relative bg-[#18181A]">
            {/* Hero Section */}
            <section className="relative pt-24 pb-36 overflow-hidden min-h-[700px] flex items-center">
                {/* Low-poly background SVG */}
                <svg
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
                    viewBox="0 0 1440 900"
                    preserveAspectRatio="xMidYMid slice"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <radialGradient id="polyBase" cx="50%" cy="50%" r="55%">
                            <stop offset="0%" stopColor="#242424"/>
                            <stop offset="100%" stopColor="#0E0E0F"/>
                        </radialGradient>
                        <radialGradient id="edgeDarken" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#18181A" stopOpacity="0"/>
                            <stop offset="100%" stopColor="#0A0A0C" stopOpacity="0.75"/>
                        </radialGradient>
                    </defs>
                    <rect width="1440" height="900" fill="url(#polyBase)"/>
                    {/* row 1 */}
                    <polygon points="0,0 200,0 100,150" fill="#141416" stroke="#1E1E1E" strokeWidth="0.6"/>
                    <polygon points="200,0 420,0 310,130" fill="#161618" stroke="#222222" strokeWidth="0.6"/>
                    <polygon points="420,0 660,0 540,140" fill="#121214" stroke="#1C1C1C" strokeWidth="0.6"/>
                    <polygon points="660,0 900,0 780,150" fill="#181818" stroke="#202020" strokeWidth="0.6"/>
                    <polygon points="900,0 1120,0 1010,130" fill="#141416" stroke="#1E1E1E" strokeWidth="0.6"/>
                    <polygon points="1120,0 1340,0 1230,140" fill="#161618" stroke="#222222" strokeWidth="0.6"/>
                    <polygon points="1340,0 1440,0 1440,160" fill="#121214" stroke="#1C1C1C" strokeWidth="0.6"/>
                    {/* row 2 */}
                    <polygon points="0,0 100,150 0,260" fill="#181818" stroke="#202020" strokeWidth="0.6"/>
                    <polygon points="100,150 200,0 340,180" fill="#202020" stroke="#282828" strokeWidth="0.6"/>
                    <polygon points="200,0 420,0 340,180" fill="#1C1C1C" stroke="#242424" strokeWidth="0.6"/>
                    <polygon points="420,0 540,140 480,280" fill="#181818" stroke="#222222" strokeWidth="0.6"/>
                    <polygon points="540,140 660,0 800,160" fill="#202020" stroke="#2A2A2A" strokeWidth="0.6"/>
                    <polygon points="660,0 900,0 800,160" fill="#1A1A1A" stroke="#222222" strokeWidth="0.6"/>
                    <polygon points="900,0 1010,130 960,270" fill="#1E1E1E" stroke="#272727" strokeWidth="0.6"/>
                    <polygon points="1010,130 1120,0 1260,170" fill="#222222" stroke="#2C2C2C" strokeWidth="0.6"/>
                    <polygon points="1120,0 1340,0 1260,170" fill="#181818" stroke="#202020" strokeWidth="0.6"/>
                    <polygon points="1340,0 1440,0 1440,160" fill="#1C1C1C" stroke="#242424" strokeWidth="0.6"/>
                    {/* row 3 */}
                    <polygon points="0,260 100,150 220,310" fill="#1E1E1E" stroke="#272727" strokeWidth="0.6"/>
                    <polygon points="100,150 340,180 280,340" fill="#242424" stroke="#2E2E2E" strokeWidth="0.6"/>
                    <polygon points="340,180 480,280 400,420" fill="#202020" stroke="#2A2A2A" strokeWidth="0.6"/>
                    <polygon points="480,280 800,160 720,360" fill="#282828" stroke="#323232" strokeWidth="0.6"/>
                    <polygon points="800,160 960,270 880,420" fill="#242424" stroke="#2E2E2E" strokeWidth="0.6"/>
                    <polygon points="960,270 1260,170 1180,350" fill="#222222" stroke="#2C2C2C" strokeWidth="0.6"/>
                    <polygon points="1260,170 1440,160 1440,380" fill="#1E1E1E" stroke="#272727" strokeWidth="0.6"/>
                    {/* row 4 */}
                    <polygon points="0,420 220,310 180,520" fill="#1C1C1C" stroke="#252525" strokeWidth="0.6"/>
                    <polygon points="220,310 400,420 340,560" fill="#222222" stroke="#2C2C2C" strokeWidth="0.6"/>
                    <polygon points="400,420 720,360 660,520" fill="#262626" stroke="#303030" strokeWidth="0.6"/>
                    <polygon points="720,360 880,420 820,560" fill="#282828" stroke="#323232" strokeWidth="0.6"/>
                    <polygon points="880,420 1180,350 1120,520" fill="#242424" stroke="#2E2E2E" strokeWidth="0.6"/>
                    <polygon points="1180,350 1440,380 1440,560" fill="#1E1E1E" stroke="#272727" strokeWidth="0.6"/>
                    {/* row 5 */}
                    <polygon points="0,520 180,520 120,680" fill="#181818" stroke="#222222" strokeWidth="0.6"/>
                    <polygon points="180,520 340,560 280,700" fill="#1E1E1E" stroke="#282828" strokeWidth="0.6"/>
                    <polygon points="340,560 660,520 600,700" fill="#222222" stroke="#2C2C2C" strokeWidth="0.6"/>
                    <polygon points="660,520 820,560 760,700" fill="#262626" stroke="#303030" strokeWidth="0.6"/>
                    <polygon points="820,560 1120,520 1060,690" fill="#222222" stroke="#2C2C2C" strokeWidth="0.6"/>
                    <polygon points="1120,520 1440,560 1440,720" fill="#1E1E1E" stroke="#282828" strokeWidth="0.6"/>
                    {/* row 6 */}
                    <polygon points="0,680 120,680 60,900" fill="#181818" stroke="#222222" strokeWidth="0.6"/>
                    <polygon points="120,680 280,700 200,900" fill="#1C1C1C" stroke="#252525" strokeWidth="0.6"/>
                    <polygon points="280,700 600,700 520,900" fill="#202020" stroke="#2A2A2A" strokeWidth="0.6"/>
                    <polygon points="600,700 760,700 700,900" fill="#242424" stroke="#2E2E2E" strokeWidth="0.6"/>
                    <polygon points="760,700 1060,690 1000,900" fill="#202020" stroke="#2A2A2A" strokeWidth="0.6"/>
                    <polygon points="1060,690 1440,720 1440,900" fill="#1C1C1C" stroke="#252525" strokeWidth="0.6"/>
                    <rect width="1440" height="900" fill="url(#edgeDarken)"/>
                </svg>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center w-full">
                    {/* Left Column: Text Content */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-left max-w-2xl lg:w-1/2 relative"
                    >
                        <motion.div variants={itemVariants} className="mb-8 flex justify-start">
                            <div className="px-4 py-1.5 rounded-[6px] border border-[var(--border-warm)] bg-[var(--bg-surface)] text-[var(--accent-teal-lt)] text-sm font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[var(--verified-text)] animate-pulse"></span>
                                Next Generation Supply Chain
                            </div>
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.15] tracking-tight"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Track Products with{' '}<br />
                            <span style={{ color: '#5A9A72', fontWeight: 700 }}>
                                Unbreakable Trust
                            </span>
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="text-lg text-gray-400 mb-12 max-w-2xl leading-relaxed"
                        >
                            TrustCure leverages blockchain technology to provide transparent, tamper-proof tracking for your entire supply chain lifecycle.
                        </motion.p>

                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center justify-start gap-4"
                        >
                            {isAuthenticated ? (
                                <Link to="/dashboard">
                                    <button style={{ background: '#C08840', color: '#1A1208', borderRadius: '30px', fontWeight: 600, padding: '12px 24px' }}>
                                        Go to Dashboard
                                    </button>
                                </Link>
                            ) : (
                                <Link to="/register">
                                    <button style={{ background: '#C08840', color: '#1A1208', borderRadius: '30px', fontWeight: 600, padding: '12px 24px' }}>
                                        Get Started
                                    </button>
                                </Link>
                            )}
                            <Link to="/scan">
                                <button style={{ background: 'transparent', border: '1px solid #2E2E2A', color: '#5A8A7A', borderRadius: '30px', fontWeight: 600, padding: '12px 24px' }}>
                                    Verify Product
                                </button>
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Right Column: Visuals */}
                    <div className="hidden lg:block lg:w-1/2 relative min-h-[500px] w-full">
                        {/* Star trail orbit SVG */}
                        <svg
                            viewBox="0 0 500 500"
                            style={{
                                position: 'absolute',
                                right: '-60px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '500px',
                                height: '500px',
                                zIndex: 2,
                                pointerEvents: 'none'
                            }}
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <defs>
                                <linearGradient id="orbit-green" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#5A9A72" stopOpacity="0"/>
                                    <stop offset="40%" stopColor="#5A9A72" stopOpacity="0.15"/>
                                    <stop offset="70%" stopColor="#5A9A72" stopOpacity="0.5"/>
                                    <stop offset="100%" stopColor="#5A9A72" stopOpacity="0.08"/>
                                </linearGradient>
                                <linearGradient id="orbit-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#C08840" stopOpacity="0"/>
                                    <stop offset="35%" stopColor="#C08840" stopOpacity="0.12"/>
                                    <stop offset="65%" stopColor="#C08840" stopOpacity="0.45"/>
                                    <stop offset="100%" stopColor="#C08840" stopOpacity="0.06"/>
                                </linearGradient>
                                <linearGradient id="orbit-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#7A8ACA" stopOpacity="0"/>
                                    <stop offset="30%" stopColor="#7A8ACA" stopOpacity="0.1"/>
                                    <stop offset="60%" stopColor="#7A8ACA" stopOpacity="0.38"/>
                                    <stop offset="100%" stopColor="#7A8ACA" stopOpacity="0.05"/>
                                </linearGradient>
                                <linearGradient id="orbit-sand" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#9A7A5A" stopOpacity="0"/>
                                    <stop offset="45%" stopColor="#9A7A5A" stopOpacity="0.18"/>
                                    <stop offset="75%" stopColor="#9A7A5A" stopOpacity="0.4"/>
                                    <stop offset="100%" stopColor="#9A7A5A" stopOpacity="0.06"/>
                                </linearGradient>
                                <linearGradient id="orbit-slate" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#5A8AAA" stopOpacity="0"/>
                                    <stop offset="50%" stopColor="#5A8AAA" stopOpacity="0.22"/>
                                    <stop offset="80%" stopColor="#5A8AAA" stopOpacity="0.35"/>
                                    <stop offset="100%" stopColor="#5A8AAA" stopOpacity="0.04"/>
                                </linearGradient>
                            </defs>

                            {/* Orbit 1 green */}
                            <ellipse cx="250" cy="250" rx="210" ry="110" transform="rotate(-20 250 250)" fill="none" stroke="#2A2A26" strokeWidth="0.5"/>
                            <ellipse cx="250" cy="250" rx="210" ry="110" transform="rotate(-20 250 250)" fill="none" stroke="url(#orbit-green)" strokeWidth="1.2" strokeDasharray="680 280" strokeDashoffset="100"/>

                            {/* Orbit 2 amber */}
                            <ellipse cx="250" cy="250" rx="165" ry="87" transform="rotate(-20 250 250)" fill="none" stroke="#2C2820" strokeWidth="0.5"/>
                            <ellipse cx="250" cy="250" rx="165" ry="87" transform="rotate(-20 250 250)" fill="none" stroke="url(#orbit-amber)" strokeWidth="1.1" strokeDasharray="560 240" strokeDashoffset="200"/>

                            {/* Orbit 3 periwinkle */}
                            <ellipse cx="250" cy="250" rx="240" ry="126" transform="rotate(-20 250 250)" fill="none" stroke="#222228" strokeWidth="0.4"/>
                            <ellipse cx="250" cy="250" rx="240" ry="126" transform="rotate(-20 250 250)" fill="none" stroke="url(#orbit-blue)" strokeWidth="0.9" strokeDasharray="760 320" strokeDashoffset="340"/>

                            {/* Orbit 4 sand */}
                            <ellipse cx="250" cy="250" rx="115" ry="60" transform="rotate(-20 250 250)" fill="none" stroke="#2A2620" strokeWidth="0.4"/>
                            <ellipse cx="250" cy="250" rx="115" ry="60" transform="rotate(-20 250 250)" fill="none" stroke="url(#orbit-sand)" strokeWidth="0.9" strokeDasharray="420 180" strokeDashoffset="60"/>

                            {/* Orbit 5 slate, different tilt */}
                            <ellipse cx="250" cy="250" rx="128" ry="148" transform="rotate(10 250 250)" fill="none" stroke="#20242A" strokeWidth="0.35"/>
                            <ellipse cx="250" cy="250" rx="128" ry="148" transform="rotate(10 250 250)" fill="none" stroke="url(#orbit-slate)" strokeWidth="0.7" strokeDasharray="500 200" strokeDashoffset="150"/>

                            {/* Spark dots */}
                            <circle cx="388" cy="214" r="2" fill="#5A9A72" opacity="0.7"/>
                            <circle cx="356" cy="182" r="1.5" fill="#C08840" opacity="0.6"/>
                            <circle cx="406" cy="248" r="1.5" fill="#7A8ACA" opacity="0.5"/>
                            <circle cx="322" cy="208" r="1.2" fill="#9A7A5A" opacity="0.55"/>
                            <circle cx="310" cy="136" r="1.2" fill="#5A8AAA" opacity="0.5"/>
                        </svg>

                        {/* Decorative Product Card */}
                        <div style={{
                            position: 'absolute',
                            zIndex: 6,
                            background: 'rgba(26,26,28,0.94)',
                            border: '1px solid #2E2E2A',
                            borderRadius: '14px',
                            padding: '16px',
                            width: '196px',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            top: '50%',
                            right: '90px',
                            transform: 'translateY(-50%)'
                        }}>
                            <div style={{ background: '#2A3A32', border: '1px solid #28402E', color: '#5A9A72', fontSize: '9px', position: 'absolute', top: '-9px', left: '14px', borderRadius: '20px', padding: '2px 8px' }}>
                                NFT minted
                            </div>
                            <div style={{ height: '86px', background: '#141818', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', overflow: 'hidden', gap: '2px', padding: '2px', marginBottom: '12px' }}>
                                <div style={{ background: '#2A3A32', borderRadius: '4px' }}></div>
                                <div style={{ background: '#222520', borderRadius: '4px' }}></div>
                                <div style={{ background: '#1E2820', borderRadius: '4px' }}></div>
                                <div style={{ background: '#2E3A28', borderRadius: '4px' }}></div>
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#EDEADE', marginBottom: '2px' }}>PROD-MNW1UTEE</div>
                            <div style={{ fontSize: '10px', color: '#4A4A40', marginBottom: '12px' }}>Farmson Pharmaceutical · Batch 20</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#C08840', fontSize: '11px', fontWeight: 600 }}>Sold</span>
                                <span style={{ background: '#1A2820', color: '#5A9A70', border: '1px solid #28402E', fontSize: '9px', borderRadius: '4px', padding: '2px 6px' }}>Verified ✓</span>
                            </div>
                        </div>

                        {/* Floating Badges */}
                        <div style={{
                            position: 'absolute',
                            top: '38px',
                            right: '30px',
                            background: 'rgba(20,20,22,0.94)',
                            border: '1px solid #2A2A28',
                            borderRadius: '8px',
                            padding: '7px 10px',
                            backdropFilter: 'blur(8px)',
                            zIndex: 7
                        }}>
                            <div style={{ fontSize: '9px', color: '#4A4A40', marginBottom: '2px' }}>Network</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#EDEADE' }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#5A9A72', display: 'inline-block' }}></span>
                                Ethereum Sepolia · Live
                            </div>
                        </div>

                        <div style={{
                            position: 'absolute',
                            bottom: '52px',
                            left: '22px',
                            background: 'rgba(20,20,22,0.94)',
                            border: '1px solid #2A2A28',
                            borderRadius: '8px',
                            padding: '7px 10px',
                            backdropFilter: 'blur(8px)',
                            zIndex: 7
                        }}>
                            <div style={{ fontSize: '9px', color: '#4A4A40', marginBottom: '2px' }}>Manufacturer</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#EDEADE' }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C08840', display: 'inline-block' }}></span>
                                Verified manufacturer
                            </div>
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
                                    className="p-8 rounded-[10px] bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-warm)] hover:bg-[var(--bg-raised)] transition-all duration-300 group cursor-default"
                                >
                                    <div className="w-11 h-11 rounded-[8px] bg-[var(--icon-bg)] flex items-center justify-center mb-6 transition-colors duration-300">
                                        <Icon className="w-5 h-5 text-[var(--accent-teal-lt)]" />
                                    </div>
                                    <h3 className="text-lg font-[600] text-[var(--text-primary)] mb-3 tracking-tight">{feature.title}</h3>
                                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">
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
