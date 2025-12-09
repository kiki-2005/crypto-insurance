import React, { useState } from 'react'
import { useWalletStore } from '../stores/walletStore'
import toast from 'react-hot-toast'

interface Claim {
  id: string
  policyType: string
  amount: string
  status: 'Pending' | 'Investigating' | 'Approved' | 'Rejected' | 'Paid'
  submittedAt: string
  description: string
}

const mockClaims: Claim[] = [
  {
    id: '0x1234...5678',
    policyType: 'DeFi Protocol Insurance',
    amount: '15,000 USDT',
    status: 'Investigating',
    submittedAt: '2024-01-15',
    description: 'Smart contract exploit in lending protocol'
  },
  {
    id: '0x8765...4321',
    policyType: 'Exchange Hack Coverage',
    amount: '50,000 USDT',
    status: 'Paid',
    submittedAt: '2024-01-10',
    description: 'Exchange security breach affecting user funds'
  }
]

const Claims: React.FC = () => {
  const { isConnected } = useWalletStore()
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [claimForm, setClaimForm] = useState({
    policyId: '',
    amount: '',
    description: '',
    incidentDate: '',
    txHashes: '',
    evidence: null as File | null
  })

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      toast.loading('Submitting claim...')
      
      // Mock claim submission
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.dismiss()
      toast.success('Claim submitted successfully!')
      setShowSubmitModal(false)
      setClaimForm({
        policyId: '',
        amount: '',
        description: '',
        incidentDate: '',
        txHashes: '',
        evidence: null
      })
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to submit claim')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100'
      case 'Investigating': return 'text-blue-600 bg-blue-100'
      case 'Approved': return 'text-green-600 bg-green-100'
      case 'Rejected': return 'text-red-600 bg-red-100'
      case 'Paid': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view and submit insurance claims.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Insurance Claims</h1>
          <p className="text-gray-600">
            Submit and track your insurance claims for covered incidents.
          </p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="btn-primary"
        >
          Submit New Claim
        </button>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {mockClaims.map((claim) => (
          <div key={claim.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {claim.policyType}
                </h3>
                <p className="text-sm text-gray-500">Claim ID: {claim.id}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(claim.status)}`}>
                {claim.status}
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">{claim.description}</p>
            
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Amount:</span>
                <span className="font-medium ml-2">{claim.amount}</span>
              </div>
              <div>
                <span className="text-gray-500">Submitted:</span>
                <span className="font-medium ml-2">{claim.submittedAt}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="font-medium ml-2">{claim.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mockClaims.length === 0 && (
        <div className="card text-center">
          <h3 className="text-lg font-semibold mb-2">No Claims Yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't submitted any insurance claims yet.
          </p>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn-primary"
          >
            Submit Your First Claim
          </button>
        </div>
      )}

      {/* Submit Claim Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Submit Insurance Claim</h3>
            
            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div>
                <label className="label">Policy</label>
                <select
                  value={claimForm.policyId}
                  onChange={(e) => setClaimForm({...claimForm, policyId: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="">Select a policy</option>
                  <option value="1">DeFi Protocol Insurance</option>
                  <option value="2">Exchange Hack Coverage</option>
                  <option value="3">Smart Contract Audit</option>
                </select>
              </div>
              
              <div>
                <label className="label">Claim Amount (USDT)</label>
                <input
                  type="number"
                  value={claimForm.amount}
                  onChange={(e) => setClaimForm({...claimForm, amount: e.target.value})}
                  className="input-field"
                  placeholder="Enter claim amount"
                  required
                />
              </div>
              
              <div>
                <label className="label">Incident Date</label>
                <input
                  type="date"
                  value={claimForm.incidentDate}
                  onChange={(e) => setClaimForm({...claimForm, incidentDate: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="label">Description</label>
                <textarea
                  value={claimForm.description}
                  onChange={(e) => setClaimForm({...claimForm, description: e.target.value})}
                  className="input-field"
                  rows={4}
                  placeholder="Describe the incident in detail..."
                  required
                />
              </div>
              
              <div>
                <label className="label">Transaction Hashes (optional)</label>
                <textarea
                  value={claimForm.txHashes}
                  onChange={(e) => setClaimForm({...claimForm, txHashes: e.target.value})}
                  className="input-field"
                  rows={2}
                  placeholder="Enter relevant transaction hashes, one per line"
                />
              </div>
              
              <div>
                <label className="label">Evidence (optional)</label>
                <input
                  type="file"
                  onChange={(e) => setClaimForm({...claimForm, evidence: e.target.files?.[0] || null})}
                  className="input-field"
                  accept=".pdf,.jpg,.jpeg,.png,.txt"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload screenshots, documents, or other evidence (PDF, JPG, PNG, TXT)
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> This is a demo submission. Claims will be processed through our mock oracle system.
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Claims