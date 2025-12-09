import React from 'react'
import { useWalletStore } from '../stores/walletStore'

const Dashboard: React.FC = () => {
  const { isConnected, address } = useWalletStore()

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">
            Please connect your wallet to view your dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Overview of your insurance policies, claims, and account activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">2</div>
          <div className="text-gray-600">Active Policies</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">$75,000</div>
          <div className="text-gray-600">Total Coverage</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600 mb-2">1</div>
          <div className="text-gray-600">Pending Claims</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">$50,000</div>
          <div className="text-gray-600">Claims Paid</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Active Policies */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Active Policies</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">DeFi Protocol Insurance</div>
                <div className="text-sm text-gray-500">Expires: Jan 30, 2024</div>
              </div>
              <div className="text-right">
                <div className="font-medium">$25,000</div>
                <div className="text-sm text-green-600">Active</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Exchange Hack Coverage</div>
                <div className="text-sm text-gray-500">Expires: Feb 15, 2024</div>
              </div>
              <div className="text-right">
                <div className="font-medium">$50,000</div>
                <div className="text-sm text-green-600">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Claims */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Claims</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">DeFi Exploit Claim</div>
                <div className="text-sm text-gray-500">Submitted: Jan 15, 2024</div>
              </div>
              <div className="text-right">
                <div className="font-medium">$15,000</div>
                <div className="text-sm text-blue-600">Investigating</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Exchange Hack Claim</div>
                <div className="text-sm text-gray-500">Submitted: Jan 10, 2024</div>
              </div>
              <div className="text-right">
                <div className="font-medium">$50,000</div>
                <div className="text-sm text-green-600">Paid</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="card mt-8">
        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Wallet Address</div>
            <div className="font-mono text-sm">{address}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">KYC Status</div>
            <div className="text-green-600 font-medium">Verified</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Member Since</div>
            <div>January 2024</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Risk Score</div>
            <div className="text-green-600 font-medium">Low Risk</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard