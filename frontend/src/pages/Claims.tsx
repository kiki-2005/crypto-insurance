import React, { useState, useEffect } from 'react'
import { claimsAPI, policyAPI } from '../services/api'
import ClaimForm from '../components/Claims/ClaimForm'
import { useWalletStore } from '../stores/walletStore'
import { useWebSocket } from '../hooks/useWebSocket'
import toast from 'react-hot-toast'

interface Claim {
  id: string
  policyId: string
  amount: number
  description: string
  status: string
  createdAt: string
  updatedAt: string
}

interface Policy {
  id: string
  type: string
  coverage: number
  premium: number
  isActive: boolean
  address?: string
}

const Claims: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const { address } = useWalletStore()


  const fetchData = async () => {
    if (!address) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('Fetching data for address:', address)
      const [claimsResponse, policiesResponse] = await Promise.all([
        claimsAPI.getUserClaims(address).catch(() => ({ data: { claims: [] } })),
        policyAPI.getUserPolicies(address).catch((err) => {
          console.error('Error fetching user policies:', err)
          return { data: { policies: [] } }
        })
      ])
      
      const claimsData = Array.isArray(claimsResponse.data) ? claimsResponse.data : 
                         claimsResponse.data?.claims || claimsResponse.data || []
      setClaims(claimsData)
      
      // Extract policies - handle both array and object responses
      let policiesData = Array.isArray(policiesResponse.data) ? policiesResponse.data : 
                         policiesResponse.data?.policies || policiesResponse.data || []
      
      console.log('Raw policies response:', policiesResponse.data)
      console.log('Extracted policies data:', policiesData)
      
      // Filter for approved policies only - users can only claim on approved policies
      const activePolicies = policiesData
        .filter((p: any) => {
          console.log('Policy status check:', { id: p.id, status: p.status, isActive: p.isActive })
          // Include policies that are approved OR active
          return (p.status === 'approved' || p.isActive === true) && p.status !== 'rejected'
        })
        .map((p: any) => ({
          ...p,
          id: p.id || p.address || Math.random().toString(),
          type: p.type || p.policyType || 'Insurance Policy',
          coverage: p.coverage || 0,
          premium: p.premium || 0
        }))
      
      setPolicies(activePolicies)
      console.log('Fetched active/approved policies:', activePolicies)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setClaims([])
      setPolicies([])
    } finally {
      setLoading(false)
    }
  }

  // WebSocket setup for real-time updates
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
  useWebSocket(wsUrl, {
    onMessage: (message) => {
      if (message.type === 'claim_update') {
        console.log('Claim update received:', message.data)
        fetchData() // Refresh data on claim update
      } else if (message.type === 'policy_update') {
        console.log('Policy update received:', message.data)
        fetchData() // Refresh data on policy update
      }
    }
  })

  useEffect(() => {
    if (address) {
      fetchData()
    }
  }, [address])

  const handleSubmitClaim = async (claimData: any) => {
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      setSubmitting(true)
      await claimsAPI.submit({
        ...claimData,
        policyId: claimData.policyId
      })
      setShowForm(false)
      toast.success('Claim submitted successfully!')
      fetchData()
    } catch (error: any) {
      console.error('Failed to submit claim:', error)
      toast.error(error.response?.data?.error || 'Failed to submit claim')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'investigating': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'paid': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 py-6 px-4 mb-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Claims Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            {showForm ? 'Cancel' : 'Submit Claim'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {showForm && (
          <div className="mb-8">
            <ClaimForm
              onSubmit={handleSubmitClaim}
              policies={policies}
              loading={submitting}
            />
          </div>
        )}

        <div className="border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Your Claims</h2>
          </div>
        
          {claims.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {claims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {claim.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${claim.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {claim.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No claims</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't submitted any claims yet.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Submit your first claim
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Claims