import React, { useState, useEffect } from 'react'
import { useWalletStore } from '../stores/walletStore'
import { analyticsAPI } from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import toast from 'react-hot-toast'

// Define the admin address
const ADMIN_ADDRESS = '0xaa91592fd2e0ad8575e292aa71a284c6c59adcff'

const Admin: React.FC = () => {
  const { isConnected, address } = useWalletStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState<any>(null)
  const [claimsData, setClaimsData] = useState<any>(null)
  const [policiesData, setPoliciesData] = useState<any>(null)
  const [oracleData, setOracleData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingClaims, setPendingClaims] = useState<any[]>([])
  const [pendingPolicies, setPendingPolicies] = useState<any[]>([])
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // WebSocket setup for real-time updates
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
  useWebSocket(wsUrl, {
    onMessage: (message) => {
      if (message.type === 'claim_update' || message.type === 'policy_update') {
        console.log('Admin update received:', message.type)
        // Refresh pending items when there's a new claim or policy update
        fetchPendingItems()
      }
    }
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Use Promise.allSettled to handle individual failures
        const results = await Promise.allSettled([
          analyticsAPI.getDashboard(),
          analyticsAPI.getClaims(),
          analyticsAPI.getPolicies(),
          analyticsAPI.getOracleData(),
        ])
        
        // Extract data from settled promises
        const dashboardRes = results[0].status === 'fulfilled' ? results[0].value : { data: null }
        const claimsRes = results[1].status === 'fulfilled' ? results[1].value : { data: null }
        const policiesRes = results[2].status === 'fulfilled' ? results[2].value : { data: null }
        const oracleRes = results[3].status === 'fulfilled' ? results[3].value : { data: null }
        
        // Log any failures but don't block
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.warn(`Failed to fetch data ${index}:`, result.reason)
          }
        })
        
        setData(dashboardRes.data)
        setClaimsData(claimsRes.data)
        setPoliciesData(policiesRes.data)
        setOracleData(oracleRes.data)
        setError(null)
        
        // Fetch pending items for approval
        fetchPendingItems()
      } catch (err: any) {
        console.error('Error fetching admin data:', err)
        setError(err.response?.data?.error || 'Failed to fetch admin data')
      } finally {
        setLoading(false)
      }
    }

    if (isConnected && address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()) {
      fetchData()
      
      // Set up periodic refresh of pending items (every 10 seconds)
      if (refreshInterval) clearInterval(refreshInterval)
      const interval = setInterval(() => {
        fetchPendingItems()
      }, 10000)
      setRefreshInterval(interval)
      
      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [isConnected, address])

  const fetchPendingItems = async () => {
    try {
      // Fetch pending claims from API
      try {
        // Use admin API endpoint to get pending claims
        const response = await fetch('/api/admin/claims/pending')
        if (response.ok) {
          const data = await response.json()
          setPendingClaims(data.claims || [])
        }
      } catch (error) {
        console.warn('Could not fetch pending claims:', error)
        // Fallback to analytics endpoint
        try {
          const claimsResponse = await analyticsAPI.getClaims()
          if (claimsResponse.data?.claims) {
            const pending = claimsResponse.data.claims.filter((c: any) => c.status === 'pending')
            setPendingClaims(pending)
          }
        } catch (err) {
          console.warn('Analytics fallback also failed')
        }
      }

      // Fetch pending policies from API
      try {
        // Use admin API endpoint to get pending policies
        const response = await fetch('/api/admin/policies/pending')
        if (response.ok) {
          const data = await response.json()
          setPendingPolicies(data.policies || [])
        }
      } catch (error) {
        console.warn('Could not fetch pending policies:', error)
      }
    } catch (error) {
      console.error('Error fetching pending items:', error)
    }
  }

  const handleApproveClaim = async (claimId: string) => {
    try {
      setApprovingId(claimId)
      toast.loading('Approving claim...')
      
      // Call API to approve claim
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/admin/claims/${claimId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to approve claim')
      }
      
      await response.json()
      toast.dismiss()
      toast.success('Claim approved successfully!')
      
      // Refresh pending items from API
      await fetchPendingItems()
    } catch (error: any) {
      console.error('Error approving claim:', error)
      toast.dismiss()
      toast.error(error.message || 'Failed to approve claim')
    } finally {
      setApprovingId(null)
    }
  }

  const handleRejectClaim = async (claimId: string) => {
    try {
      setRejectingId(claimId)
      toast.loading('Rejecting claim...')
      
      // Call API to reject claim
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/admin/claims/${claimId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ reason: 'Admin rejection' })
      })
      
      if (!response.ok) {
        throw new Error('Failed to reject claim')
      }
      
      await response.json()
      toast.dismiss()
      toast.success('Claim rejected')
      
      // Refresh pending items from API
      await fetchPendingItems()
    } catch (error: any) {
      console.error('Error rejecting claim:', error)
      toast.dismiss()
      toast.error(error.message || 'Failed to reject claim')
    } finally {
      setRejectingId(null)
    }
  }

  const handleApprovePolicy = async (policyId: string) => {
    try {
      setApprovingId(policyId)
      toast.loading('Approving policy...')
      
      // Call API to approve policy
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/admin/policies/${policyId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to approve policy')
      }
      
      await response.json()
      toast.dismiss()
      toast.success('Policy approved successfully!')
      
      // Refresh pending items from API
      await fetchPendingItems()
    } catch (error: any) {
      console.error('Error approving policy:', error)
      toast.dismiss()
      toast.error(error.message || 'Failed to approve policy')
    } finally {
      setApprovingId(null)
    }
  }

  const handleRejectPolicy = async (policyId: string) => {
    try {
      setRejectingId(policyId)
      toast.loading('Rejecting policy...')
      
      // Call API to reject policy
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/admin/policies/${policyId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ reason: 'Admin rejection' })
      })
      
      if (!response.ok) {
        throw new Error('Failed to reject policy')
      }
      
      await response.json()
      toast.dismiss()
      toast.success('Policy rejected')
      
      // Refresh pending items from API
      await fetchPendingItems()
    } catch (error: any) {
      console.error('Error rejecting policy:', error)
      toast.dismiss()
      toast.error(error.message || 'Failed to reject policy')
    } finally {
      setRejectingId(null)
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">
            Please connect your wallet to access the admin panel.
          </p>
        </div>
      </div>
    )
  }

  if (address?.toLowerCase() !== ADMIN_ADDRESS.toLowerCase()) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center bg-red-50 border-red-200">
          <h2 className="text-2xl font-bold mb-4 text-red-800">Access Denied</h2>
          <p className="text-red-700">
            You are not authorized to view this page.
          </p>
        </div>
      </div>
    )
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
        <h3 className="text-sm font-medium text-red-800">Error</h3>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'claims', label: 'Claims' },
    { id: 'policies', label: 'Policies' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'pool', label: 'Premium Pool' },
    { id: 'oracle', label: 'Oracle' }
  ]

  const getOracleStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Pending'
      case 1: return 'Fulfilled'
      case 2: return 'Failed'
      default: return 'Unknown'
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Monitor and manage the insurance system operations.
        </p>
      </div>

      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'approvals' && (
        <div className="space-y-8">
          {/* Pending Claims Section */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Pending Claims for Approval</h2>
              {pendingClaims.length > 0 && (
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  {pendingClaims.length} pending
                </span>
              )}
            </div>

            {pendingClaims.length > 0 ? (
              <div className="space-y-4">
                {pendingClaims.map((claim) => (
                  <div key={claim.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Claim #{claim.id}</h3>
                        <p className="text-sm text-gray-500">
                          User: {claim.userAddress?.slice(0, 6)}...{claim.userAddress?.slice(-4)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">${claim.amount}</div>
                        <div className="text-xs text-gray-500">Amount Claimed</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded mb-4">
                      <p className="text-sm text-gray-700">{claim.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Submitted: {new Date(claim.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveClaim(claim.id)}
                        disabled={approvingId === claim.id || rejectingId === claim.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        {approvingId === claim.id ? 'Approving...' : 'Approve Claim'}
                      </button>
                      <button
                        onClick={() => handleRejectClaim(claim.id)}
                        disabled={approvingId === claim.id || rejectingId === claim.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        {rejectingId === claim.id ? 'Rejecting...' : 'Reject Claim'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">No pending claims for approval</p>
              </div>
            )}
          </div>

          {/* Pending Policies Section */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Pending Policies for Approval</h2>
              {pendingPolicies.length > 0 && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  {pendingPolicies.length} pending
                </span>
              )}
            </div>

            {pendingPolicies.length > 0 ? (
              <div className="space-y-4">
                {pendingPolicies.map((policy) => (
                  <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{policy.type}</h3>
                        <p className="text-sm text-gray-500">
                          Policy ID: {policy.id}
                        </p>
                        <p className="text-sm text-gray-500">
                          User: {policy.userAddress?.slice(0, 6)}...{policy.userAddress?.slice(-4)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div>
                          <div className="text-sm text-gray-600">Premium: <span className="font-semibold">${policy.premium}</span></div>
                          <div className="text-sm text-gray-600">Coverage: <span className="font-semibold">${policy.coverage}</span></div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-4">
                      Submitted: {new Date(policy.createdAt).toLocaleString()}
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprovePolicy(policy.id)}
                        disabled={approvingId === policy.id || rejectingId === policy.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        {approvingId === policy.id ? 'Approving...' : 'Approve Policy'}
                      </button>
                      <button
                        onClick={() => handleRejectPolicy(policy.id)}
                        disabled={approvingId === policy.id || rejectingId === policy.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        {rejectingId === policy.id ? 'Rejecting...' : 'Reject Policy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">No pending policies for approval</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'overview' && data && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Policies</div>
              <div className="text-3xl font-bold text-gray-900">{data.overview?.totalPolicies || 0}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Claims</div>
              <div className="text-3xl font-bold text-gray-900">{data.overview?.totalClaims || 0}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Premiums</div>
              <div className="text-3xl font-bold text-green-600">${data.overview?.totalPremiums?.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Payouts</div>
              <div className="text-3xl font-bold text-red-600">${data.overview?.totalPayouts?.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <div className="text-sm font-medium text-gray-500 mb-1">Cancelled Policies</div>
              <div className="text-3xl font-bold text-gray-600">{data.overview?.cancelledPolicies || 0}</div>
            </div>
          </div>

          {/* Blockchain Status */}
          {data.blockchain && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Blockchain Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className={`text-lg font-semibold ${data.blockchain.connected ? 'text-green-600' : 'text-red-600'}`}>
                    {data.blockchain.connected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Block Number</div>
                  <div className="text-lg font-semibold text-gray-900">{data.blockchain.blockNumber || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Gas Price</div>
                  <div className="text-lg font-semibold text-gray-900">{data.blockchain.gasPrice || '0 gwei'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {data.recentActivity && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Recent Claims</h3>
                <div className="space-y-3">
                  {data.recentActivity.claims?.length > 0 ? (
                    data.recentActivity.claims.slice(0, 5).map((claim: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Claim #{claim.id || index}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(claim.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">${claim.amount || 0}</div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                            claim.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {claim.status || 'pending'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">No recent claims</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Recent Policies</h3>
                <div className="space-y-3">
                  {data.recentActivity.policies?.length > 0 ? (
                    data.recentActivity.policies.slice(0, 5).map((policy: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{policy.type || 'Policy'}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(policy.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">${policy.premium || 0}</div>
                          <div className="text-xs text-gray-500">${policy.coverage || 0} coverage</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">No recent policies</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'claims' && claimsData && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Claim Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {claimsData.statusDistribution && Object.entries(claimsData.statusDistribution).map(([status, count]: [string, any]) => (
                <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Claim Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500">Average Processing Time</div>
                <div className="text-2xl font-bold text-gray-900">
                  {claimsData.averageProcessingTime || 0} days
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Claim Amount</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${claimsData.totalAmount?.toLocaleString() || '0'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'policies' && policiesData && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Policy Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {policiesData.typeDistribution && Object.entries(policiesData.typeDistribution).map(([type, count]: [string, any]) => (
                <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{type}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Policy Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500">Total Premiums Collected</div>
                <div className="text-2xl font-bold text-green-600">
                  ${policiesData.totalPremiums?.toLocaleString() || '0'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Coverage Distribution</div>
                <div className="mt-2 space-y-2">
                  {policiesData.coverageDistribution && Object.entries(policiesData.coverageDistribution).map(([range, count]: [string, any]) => (
                    <div key={range} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{range}</span>
                      <span className="font-semibold text-gray-900">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pool' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 text-center">
              <div className="text-sm font-medium text-gray-500 mb-2">Pool Balance</div>
              <div className="text-3xl font-bold text-blue-600">
                ${data.overview?.totalPremiums?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 text-center">
              <div className="text-sm font-medium text-gray-500 mb-2">Total Premiums</div>
              <div className="text-3xl font-bold text-green-600">
                ${data.overview?.totalPremiums?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 text-center">
              <div className="text-sm font-medium text-gray-500 mb-2">Total Payouts</div>
              <div className="text-3xl font-bold text-red-600">
                ${data.overview?.totalPayouts?.toLocaleString() || '0'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Pool Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Claim Ratio</span>
                <span className="font-semibold text-gray-900">
                  {data.overview?.claimRatio?.toFixed(2) || '0.00'}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Profit/Loss</span>
                <span className={`font-semibold ${(data.overview?.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${data.overview?.profitLoss?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Users</span>
                <span className="font-semibold text-gray-900">
                  {data.overview?.activeUsers || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'oracle' && oracleData && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card text-center">
              <div className="text-xl font-bold text-blue-600 mb-2">{oracleData.totalRequests}</div>
              <div className="text-gray-600">Total Requests</div>
            </div>
            <div className="card text-center">
              <div className="text-xl font-bold text-green-600 mb-2">{oracleData.successRate}%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Oracle Requests</h3>
            <div className="space-y-3">
              {oracleData.recentRequests && oracleData.recentRequests.length > 0 ? (
                oracleData.recentRequests.map((req: any, index: number) => (
                  <div key={req.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium truncate">
                        Request #{typeof req.id === 'string' ? req.id.slice(0, 10) : req.id}...
                      </div>
                      <div className="text-sm text-gray-500">
                        {req.timestamp ? new Date(req.timestamp).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                    <div className={`font-medium ${
                      req.status === 1 ? 'text-green-600' : 
                      req.status === 2 ? 'text-red-600' : 
                      'text-yellow-600'
                    }`}>
                      {getOracleStatusText(req.status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">No recent oracle requests</div>
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}

export default Admin