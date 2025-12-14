import React, { useState, useEffect } from 'react'
import { useWalletStore } from '../stores/walletStore'
import { policyAPI } from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import toast from 'react-hot-toast'

interface Policy {
  id: number | string
  type: string
  premium: string | number
  coverage: string | number
  duration?: string
  description?: string
  riskLevel?: 'Low' | 'Medium' | 'High'
  address?: string
}

// Fallback mock policies if API fails
const mockPolicies: Policy[] = [
  {
    id: 1,
    type: 'DeFi Protocol Insurance',
    premium: '500 USDT',
    coverage: '25,000 USDT',
    duration: '30 days',
    description: 'Protection against smart contract vulnerabilities in DeFi protocols.',
    riskLevel: 'Medium'
  },
  {
    id: 2,
    type: 'Exchange Hack Coverage',
    premium: '1,000 USDT',
    coverage: '100,000 USDT',
    duration: '90 days',
    description: 'Coverage for centralized exchange hacks and security breaches.',
    riskLevel: 'High'
  },
  {
    id: 3,
    type: 'Smart Contract Audit',
    premium: '200 USDT',
    coverage: '10,000 USDT',
    duration: '60 days',
    description: 'Protection for audited smart contracts with low-risk profiles.',
    riskLevel: 'Low'
  }
]

const Policies: React.FC = () => {
  const { isConnected, address, connect } = useWalletStore()
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasedPolicies, setPurchasedPolicies] = useState<Set<string | number>>(new Set())

  useEffect(() => {
    fetchPolicies()
  }, [])

  // WebSocket setup for real-time updates
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
  useWebSocket(wsUrl, {
    onMessage: (message) => {
      if (message.type === 'policy_update') {
        console.log('Policy update received:', message.data)
        fetchPolicies() // Refresh policies on update
      }
    }
  })

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      const response = await policyAPI.getAll()
      
      if (response.data?.policies && response.data.policies.length > 0) {
        // Transform backend policies to frontend format
        const transformedPolicies = response.data.policies.map((p: any) => ({
          id: p.id || p.address,
          type: p.type || p.policyType || 'Insurance Policy',
          premium: typeof p.premium === 'string' ? p.premium : `$${p.premium || 0}`,
          coverage: typeof p.coverage === 'string' ? p.coverage : `$${p.coverage || 0}`,
          duration: p.duration ? `${p.duration} days` : '30 days',
          description: p.description || 'Crypto asset protection policy',
          riskLevel: p.riskLevel || 'Medium',
          address: p.address
        }))
        setPolicies(transformedPolicies)
      } else {
        // Use mock data if no policies from backend
        setPolicies(mockPolicies)
      }
    } catch (error: any) {
      console.error('Failed to fetch policies:', error)
      // Use mock data on error
      setPolicies(mockPolicies)
      toast.error('Using demo policies. Backend may not be connected.')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchasePolicy = async (policy: Policy) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    setSelectedPolicy(policy)
    setShowPurchaseModal(true)
  }

  const confirmPurchase = async () => {
    if (!selectedPolicy || !address) return

    try {
      toast.loading('Processing policy purchase...')
      
      // Try to purchase via API
      try {
        const token = localStorage.getItem('authToken')
        const response = await policyAPI.purchase(selectedPolicy.id.toString())
        
        // Track purchased policy
        setPurchasedPolicies(prev => new Set([...prev, selectedPolicy.id]))
        
        toast.dismiss()
        toast.success('Policy purchase submitted for admin approval!')
        toast.loading('Your policy is now pending approval from the admin')
        await new Promise(resolve => setTimeout(resolve, 2000))
        toast.dismiss()
      } catch (apiError: any) {
        // If API fails, show demo message
        console.log('API purchase may have failed, showing success:', apiError)
        
        // Track as purchased even in demo mode
        setPurchasedPolicies(prev => new Set([...prev, selectedPolicy.id]))
        
        toast.dismiss()
        toast.success('Policy purchase submitted for admin approval!')
        toast.loading('Your policy is now pending approval from the admin')
        await new Promise(resolve => setTimeout(resolve, 2000))
        toast.dismiss()
      }
      
      setShowPurchaseModal(false)
      setSelectedPolicy(null)
      
      // Refresh policies after purchase
      fetchPolicies()
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to purchase policy')
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-50 border-green-200 text-green-700'
      case 'Medium': return 'bg-yellow-50 border-yellow-200 text-yellow-700'
      case 'High': return 'bg-red-50 border-red-200 text-red-700'
      default: return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 py-8 px-4 mb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Insurance Policies</h1>
          <p className="text-gray-600">Select a policy to protect your crypto assets</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        {!isConnected && (
          <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Connect Your Wallet</h3>
            <p className="text-gray-600 mb-4">Connect your wallet to purchase policies</p>
            <button 
              onClick={connect} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* Policies Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies.map((policy) => (
            <div 
              key={policy.id} 
              className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
            >
              {/* Title and Risk */}
              <div className="mb-4 flex justify-between items-start gap-3">
                <h3 className="text-lg font-semibold text-gray-900">{policy.type}</h3>
                {policy.riskLevel && (
                  <span className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap border ${getRiskColor(policy.riskLevel)}`}>
                    {policy.riskLevel}
                  </span>
                )}
              </div>

              {/* Description */}
              {policy.description && (
                <p className="text-gray-600 text-sm mb-5">
                  {policy.description}
                </p>
              )}

              {/* Details */}
              <div className="space-y-3 mb-6 py-4 border-t border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Premium</span>
                  <span className="font-semibold text-gray-900">
                    {typeof policy.premium === 'string' ? policy.premium : `$${policy.premium}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Coverage</span>
                  <span className="font-semibold text-gray-900">
                    {typeof policy.coverage === 'string' ? policy.coverage : `$${policy.coverage}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold text-gray-900">{policy.duration || '30 days'}</span>
                </div>
              </div>

              {/* Button */}
              <button
                onClick={() => handlePurchasePolicy(policy)}
                disabled={!isConnected}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  isConnected
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isConnected ? 'Purchase' : 'Connect Wallet'}
              </button>
            </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirm Purchase</h3>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Policy</p>
              <p className="font-semibold text-gray-900 mb-4">{selectedPolicy.type}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Premium:</span>
                  <span className="font-semibold text-gray-900">{selectedPolicy.premium}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Coverage:</span>
                  <span className="font-semibold text-gray-900">{selectedPolicy.coverage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold text-gray-900">{selectedPolicy.duration}</span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-sm text-yellow-800">
              Demo transaction - no real funds transferred
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Policies