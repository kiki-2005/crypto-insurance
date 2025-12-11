import React from 'react'
import { Link } from 'react-router-dom'
import { useWalletStore } from '../stores/walletStore'

const Home: React.FC = () => {
  const { isConnected, connect } = useWalletStore()

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="border-b border-gray-200 py-16 px-4 mb-12">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Protect Your Crypto Assets
          </h1>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Blockchain-based insurance coverage for DeFi protocols, exchanges, and smart contracts.
          </p>
          <div className="flex justify-center gap-3">
            {isConnected ? (
              <Link to="/policies" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                Browse Policies
              </Link>
            ) : (
              <button onClick={connect} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Contract Security</h3>
            <p className="text-gray-600 text-sm">
              Protection against vulnerabilities, reentrancy attacks, and code exploits.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">DeFi Protocol Coverage</h3>
            <p className="text-gray-600 text-sm">
              Coverage for lending protocols, DEXs, yield farming, and liquidity risks.
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Claims</h3>
            <p className="text-gray-600 text-sm">
              Oracle-verified claims processing with automated payouts.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-sm">1</div>
              <h3 className="font-semibold text-gray-900 mb-1">Connect Wallet</h3>
              <p className="text-gray-600 text-sm">Connect your MetaMask wallet</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-sm">2</div>
              <h3 className="font-semibold text-gray-900 mb-1">Choose Policy</h3>
              <p className="text-gray-600 text-sm">Select your coverage</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-sm">3</div>
              <h3 className="font-semibold text-gray-900 mb-1">Pay Premium</h3>
              <p className="text-gray-600 text-sm">Activate coverage</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-sm">4</div>
              <h3 className="font-semibold text-gray-900 mb-1">Get Protected</h3>
              <p className="text-gray-600 text-sm">Submit claims</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center border border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Protect Your Assets?</h2>
          <p className="text-gray-600 mb-6">Get covered against crypto risks today</p>
          {isConnected ? (
            <Link to="/policies" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors inline-block">
              Browse Policies
            </Link>
          ) : (
            <button onClick={connect} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home