import React from 'react'
import { Link } from 'react-router-dom'
import { useWalletStore } from '../stores/walletStore'

const Home: React.FC = () => {
  const { isConnected, connect } = useWalletStore()

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-20">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Protect Your Crypto Assets
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Comprehensive insurance coverage for DeFi protocols, exchanges, and smart contract risks. 
          Get protected against hacks, exploits, and technical failures with our blockchain-based insurance system.
        </p>
        <div className="flex justify-center space-x-4">
          {isConnected ? (
            <Link to="/policies" className="btn-primary text-lg px-8 py-3">
              Browse Policies
            </Link>
          ) : (
            <button onClick={connect} className="btn-primary text-lg px-8 py-3">
              Connect Wallet to Start
            </button>
          )}
          <Link to="/policies" className="btn-secondary text-lg px-8 py-3">
            Learn More
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 py-16">
        <div className="card text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-3">Smart Contract Security</h3>
          <p className="text-gray-600">
            Protection against smart contract vulnerabilities, reentrancy attacks, and code exploits.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-3">DeFi Protocol Coverage</h3>
          <p className="text-gray-600">
            Comprehensive coverage for lending protocols, DEXs, yield farming, and liquidity provision risks.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-3">Instant Claims</h3>
          <p className="text-gray-600">
            Oracle-verified claims processing with automated payouts for eligible incidents.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      {/* <div className="bg-gray-900 text-white rounded-2xl p-12 my-16">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold mb-2">$50M+</div>
            <div className="text-gray-300">Total Value Protected</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">1,200+</div>
            <div className="text-gray-300">Active Policies</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">98.5%</div>
            <div className="text-gray-300">Claim Success Rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">24h</div>
            <div className="text-gray-300">Average Payout Time</div>
          </div>
        </div>
      </div> */}

      {/* How It Works */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold mb-2">Connect Wallet</h3>
            <p className="text-gray-600 text-sm">Connect your MetaMask wallet to get started</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold mb-2">Choose Policy</h3>
            <p className="text-gray-600 text-sm">Select coverage that matches your risk profile</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold mb-2">Pay Premium</h3>
            <p className="text-gray-600 text-sm">Pay premium in stablecoins to activate coverage</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              4
            </div>
            <h3 className="font-semibold mb-2">Get Protected</h3>
            <p className="text-gray-600 text-sm">Submit claims instantly when incidents occur</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center py-16 bg-blue-50 rounded-2xl">
        <h2 className="text-3xl font-bold mb-4">Ready to Protect Your Assets?</h2>
        <p className="text-gray-600 mb-8">Join thousands of users who trust our insurance platform</p>
        {isConnected ? (
          <Link to="/policies" className="btn-primary text-lg px-8 py-3">
            Browse Available Policies
          </Link>
        ) : (
          <button onClick={connect} className="btn-primary text-lg px-8 py-3">
            Connect Wallet Now
          </button>
        )}
      </div>
    </div>
  )
}

export default Home