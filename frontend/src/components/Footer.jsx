import { Blocks } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="relative border-t border-white/5 bg-trustcure-darker/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Brand — centered */}
        <div className="flex flex-col items-center text-center gap-4">
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Blocks className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">TrustCure</span>
          </a>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
            Blockchain-powered supply chain tracking. Ensuring transparency,
            authenticity, and trust from manufacturer to consumer.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} TrustCure. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Powered by</span>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Blocks className="w-3 h-3 text-white" />
              </div>
              <span className="text-white text-sm font-medium">Ethereum</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer
