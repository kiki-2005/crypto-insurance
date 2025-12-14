import React, { useState, useEffect } from 'react'
import { analyticsAPI, policyAPI } from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { useWalletStore } from '../stores/walletStore'
import DashboardStats from '../components/Dashboard/DashboardStats'
import toast from 'react-hot-toast'

interface DashboardData {
  overview: {
    totalPolicies: number
    totalClaims: number
    totalPremiums: number
    totalPayouts: number
    claimRatio: number
    cancelledPolicies: number
  }
  blockchain: {
    connected: boolean
    blockNumber: number
    gasPrice: string
    networkId: string
  }
  recentActivity: {
    claims: any[]
    policies: any[]
  }
  trends: {
    claimsGrowth: number
    policiesGrowth: number
    premiumGrowth: number
  }
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingPolicyId, setCancellingPolicyId] = useState<string | null>(null)
  const { address } = useWalletStore()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // WebSocket setup for real-time updates
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
  useWebSocket(wsUrl, {
    onMessage: (message) => {
      if (message.type === 'policy_update' || message.type === 'claim_update') {
        console.log('Update received:', message.type)
        // Refresh dashboard data when policy or claim is updated
        fetchDashboardData()
      }
    }
  })

  const handleCancelPolicy = async (policyId: string) => {
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      setCancellingPolicyId(policyId)
      toast.loading('Cancelling policy...')
      await policyAPI.cancel(policyId)
      toast.dismiss()
      toast.success('Policy cancelled successfully')
      fetchDashboardData()
    } catch (error: any) {
      console.error('Error cancelling policy:', error)
      toast.dismiss()
      toast.error(error.response?.data?.error || 'Failed to cancel policy')
    } finally {
      setCancellingPolicyId(null)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await analyticsAPI.getDashboard()
      
      // Handle both success and error responses
      if (response.data) {
        setDashboardData(response.data)
        setError(null)
      } else {
        // If response has error but still returns 200, use default data
        setDashboardData({
          overview: {
            totalPolicies: 0,
            totalClaims: 0,
            totalPremiums: 0,
            totalPayouts: 0,
            claimRatio: 0,
            cancelledPolicies: 0
          },
          blockchain: {
            connected: false,
            blockNumber: 0,
            gasPrice: '0 gwei',
            networkId: 'unknown'
          },
          recentActivity: {
            claims: [],
            policies: []
          },
          trends: {
            claimsGrowth: 0,
            policiesGrowth: 0,
            premiumGrowth: 0
          }
        })
        setError(null)
      }
    } catch (err: any) {
      console.error('Error fetching dashboard:', err)
      // Set default data on error instead of showing error message
      setDashboardData({
        overview: {
          totalPolicies: 0,
          totalClaims: 0,
          totalPremiums: 0,
          totalPayouts: 0,
          claimRatio: 0,
          cancelledPolicies: 0
        },
        blockchain: {
          connected: false,
          blockNumber: 0,
          gasPrice: '0 gwei',
          networkId: 'unknown'
        },
        recentActivity: {
          claims: [],
          policies: []
        },
        trends: {
          claimsGrowth: 0,
          policiesGrowth: 0,
          premiumGrowth: 0
        }
      })
      setError(null) // Don't show error, just use empty data
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchDashboardData}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return <div>No data available</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your insurance overview.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Refresh
        </button>
      </div>

      <DashboardStats stats={dashboardData.overview} trends={dashboardData.trends} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blockchain Status */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Blockchain Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
              <span className="text-gray-600 font-medium">Status:</span>
              <span className={`font-semibold px-3 py-1 rounded-full text-sm ${dashboardData.blockchain.connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {dashboardData.blockchain.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Block Number:</span>
              <span className="font-semibold text-gray-900">{dashboardData.blockchain.blockNumber?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Gas Price:</span>
              <span className="font-semibold text-gray-900">{dashboardData.blockchain.gasPrice} Gwei</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600 font-medium">Network:</span>
              <span className="font-semibold text-gray-900">{dashboardData.blockchain.networkId}</span>
            </div>
          </div>
        </div>

        {/* Recent Claims */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Claims</h2>
          <div className="space-y-3">
            {dashboardData.recentActivity.claims.length > 0 ? (
              dashboardData.recentActivity.claims.map((claim, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 px-2 rounded transition">
                  <div>
                    <p className="font-semibold text-gray-900">${claim.amount}</p>
                    <p className="text-sm text-gray-600 capitalize">{claim.status}</p>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap ml-2">
                    {new Date(claim.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent claims</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Policies */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Policies</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Premium
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Coverage
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.recentActivity.policies.length > 0 ? (
                dashboardData.recentActivity.policies.map((policy, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {policy.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      ${policy.premium}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      ${policy.coverage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        policy.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                        policy.status === 'approved' ? 'bg-green-100 text-green-800' :
                        policy.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        policy.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        policy.isActive ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {policy.status === 'pending_approval' ? 'Pending Approval' :
                         policy.status === 'approved' ? 'Approved' :
                         policy.status === 'rejected' ? 'Rejected' :
                         policy.status === 'cancelled' ? 'Cancelled' :
                         policy.isActive ? 'Active' :
                         'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(policy.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(policy.status === 'approved' || (policy.isActive && policy.status !== 'cancelled')) && (
                        <button
                          onClick={() => handleCancelPolicy(policy.id)}
                          disabled={cancellingPolicyId === policy.id}
                          className="bg-red-100 hover:bg-red-200 disabled:bg-gray-100 text-red-700 disabled:text-gray-400 px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          {cancellingPolicyId === policy.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No recent policies
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard