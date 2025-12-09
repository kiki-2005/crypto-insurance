import React, { useState } from 'react'
import { useWalletStore } from '../stores/walletStore'
import toast from 'react-hot-toast'

interface Policy {
  id: number
  type: string
  premium: string
  coverage: string
  duration: string
  description: string
  riskLevel: 'Low' | 'Medium' | 'High'
}

const mockPolicies: Policy[] = [
  {
    id: 1,
    type: 'DeFi Protocol Insurance',
    premium: '500 USDT',
    coverage: '25,000 USDT',
    duration: '30 days',
    description: 'Protection against smart contract vulnerabilities in DeFi protocols including lending, borrowing, and yield farming.',
    riskLevel: 'Medium'
  },
  {
    id: 2,
    type: 'Exchange Hack Coverage',
    premium: '1,000 USDT',
    coverage: '100,000 USDT',
    duration: '90 days',
    description: 'Comprehensive coverage for centralized exchange hacks and security breaches.',
    riskLevel: 'High'
  },
  {
    id: 3,
    type: 'Smart Contract Audit',
    premium: '200 USDT',
    coverage: '10,000 USDT',
    duration: '60 days',
    description: 'Basic protection for audited smart contracts with low-risk profiles.',
    riskLevel: 'Low'
  }
]

const Policies: React.FC = () => {
  const { isConnected, connect } = useWalletStore()
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const handlePurchasePolicy = async (policy: Policy) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    setSelectedPolicy(policy)
    setShowPurchaseModal(true)
  }

  const confirmPurchase = async () => {
    if (!selectedPolicy) return

    try {
      // Mock purchase process
      toast.loading('Processing policy purchase...')
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.dismiss()
      toast.success('Policy purchased successfully!')
      setShowPurchaseModal(false)
      setSelectedPolicy(null)
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to purchase policy')
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'High': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Insurance Policies</h1>
        <p className="text-gray-600">
          Choose from our comprehensive range of crypto insurance policies designed to protect your digital assets.
        </p>
      </div>

      {!isConnected && (
        <div className="card mb-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 mb-4">
            Connect your wallet to view personalized policy recommendations and purchase coverage.
          </p>
          <button onClick={connect} className="btn-primary">
            Connect Wallet
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockPolicies.map((policy) => (
          <div key={policy.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {policy.type}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(policy.riskLevel)}`}>
                {policy.riskLevel} Risk
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              {policy.description}
            </p>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Premium:</span>
                <span className="font-medium">{policy.premium}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Coverage:</span>
                <span className="font-medium">{policy.coverage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration:</span>
                <span className="font-medium">{policy.duration}</span>
              </div>
            </div>
            
            <button
              onClick={() => handlePurchasePolicy(policy)}
              className="btn-primary w-full"
              disabled={!isConnected}
            >
              {isConnected ? 'Purchase Policy' : 'Connect Wallet'}
            </button>
          </div>
        ))}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Policy Purchase</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Policy:</span>
                <span className="font-medium">{selectedPolicy.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Premium:</span>
                <span className="font-medium">{selectedPolicy.premium}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Coverage:</span>
                <span className="font-medium">{selectedPolicy.coverage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration:</span>
                <span className="font-medium">{selectedPolicy.duration}</span>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> This is a demo transaction. No real funds will be transferred.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                className="btn-primary flex-1"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Policies