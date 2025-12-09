import React, { useState } from 'react'
import { useWalletStore } from '../stores/walletStore'

const Admin: React.FC = () => {
  const { isConnected } = useWalletStore()
  const [activeTab, setActiveTab] = useState('overview')

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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'claims', label: 'Claims' },
    { id: 'policies', label: 'Policies' },
    { id: 'pool', label: 'Premium Pool' },
    { id: 'oracle', label: 'Oracle' }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Monitor and manage the insurance system operations.
        </p>
      </div>

      {/* Tab Navigation */}
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">1,247</div>
              <div className="text-gray-600">Total Policies</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">$2.5M</div>
              <div className="text-gray-600">Pool Balance</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-2">23</div>
              <div className="text-gray-600">Pending Claims</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">98.2%</div>
              <div className="text-gray-600">System Uptime</div>
            </div>
          </div>

          {/* System Health */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">System Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Policy Factory Contract</span>
                <span className="text-green-600 font-medium">✓ Healthy</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Premium Pool Contract</span>
                <span className="text-green-600 font-medium">✓ Healthy</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Claim Manager Contract</span>
                <span className="text-green-600 font-medium">✓ Healthy</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Oracle Service</span>
                <span className="text-green-600 font-medium">✓ Healthy</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claims Tab */}
      {activeTab === 'claims' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Pending Claims Review</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Claim #0x1234...5678</div>
                  <div className="text-sm text-gray-500">DeFi Protocol Exploit - $15,000</div>
                </div>
                <div className="flex space-x-2">
                  <button className="btn-primary text-sm">Approve</button>
                  <button className="btn-danger text-sm">Reject</button>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Claim #0x8765...4321</div>
                  <div className="text-sm text-gray-500">Smart Contract Bug - $8,500</div>
                </div>
                <div className="flex space-x-2">
                  <button className="btn-primary text-sm">Approve</button>
                  <button className="btn-danger text-sm">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Policy Management</h3>
            <button className="btn-primary">Create New Policy</button>
          </div>
          
          <div className="card">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">DeFi Protocol Insurance</div>
                  <div className="text-sm text-gray-500">Active policies: 456 | Total coverage: $11.4M</div>
                </div>
                <div className="flex space-x-2">
                  <button className="btn-secondary text-sm">Edit</button>
                  <button className="btn-danger text-sm">Pause</button>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Exchange Hack Coverage</div>
                  <div className="text-sm text-gray-500">Active policies: 234 | Total coverage: $23.4M</div>
                </div>
                <div className="flex space-x-2">
                  <button className="btn-secondary text-sm">Edit</button>
                  <button className="btn-danger text-sm">Pause</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Pool Tab */}
      {activeTab === 'pool' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="text-xl font-bold text-blue-600 mb-2">$2,500,000</div>
              <div className="text-gray-600">Total Pool Balance</div>
            </div>
            <div className="card text-center">
              <div className="text-xl font-bold text-green-600 mb-2">$3,200,000</div>
              <div className="text-gray-600">Total Premiums</div>
            </div>
            <div className="card text-center">
              <div className="text-xl font-bold text-red-600 mb-2">$700,000</div>
              <div className="text-gray-600">Total Claims Paid</div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Pool Operations</h3>
            <div className="flex space-x-4">
              <button className="btn-primary">Rebalance Pool</button>
              <button className="btn-secondary">Generate Report</button>
              <button className="btn-danger">Emergency Withdraw</button>
            </div>
          </div>
        </div>
      )}

      {/* Oracle Tab */}
      {activeTab === 'oracle' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Oracle Status</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Status</div>
                <div className="text-green-600 font-medium">Active</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Total Requests</div>
                <div className="font-medium">1,847</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Success Rate</div>
                <div className="font-medium">99.2%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Average Response Time</div>
                <div className="font-medium">2.3 seconds</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Oracle Requests</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Claim Verification #0x1234</div>
                  <div className="text-sm text-gray-500">2 minutes ago</div>
                </div>
                <div className="text-green-600 font-medium">Verified</div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Claim Verification #0x5678</div>
                  <div className="text-sm text-gray-500">5 minutes ago</div>
                </div>
                <div className="text-red-600 font-medium">Rejected</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin