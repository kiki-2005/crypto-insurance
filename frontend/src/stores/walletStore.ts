import { create } from 'zustand'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

interface WalletState {
  isConnected: boolean
  isAuthenticated: boolean
  address: string | null
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  chainId: number | null
  balance: string
  connect: () => Promise<void>
  disconnect: () => void
  switchNetwork: (chainId: number) => Promise<void>
  updateBalance: () => Promise<void>
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isConnected: false,
  isAuthenticated: false,
  address: null,
  provider: null,
  signer: null,
  chainId: null,
  balance: '0',

  connect: async () => {
    try {
      if (!window.ethereum) {
        toast.error('MetaMask not found. Please install MetaMask.')
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      
      // --- Authentication Flow ---
      toast.loading('Please sign the message in your wallet to log in.', { id: 'auth' });
      
      // 1. Get nonce from backend
      const nonceRes = await authAPI.getNonce(address);
      const { nonce, message } = nonceRes.data;

      // 2. Sign the nonce
      const signature = await signer.signMessage(message);

      // 3. Verify signature and get JWT
      const verifyRes = await authAPI.verifySignature(address, signature, nonce);
      const { token } = verifyRes.data;

      // 4. Store JWT
      localStorage.setItem('authToken', token);
      
      toast.dismiss('auth');
      toast.success('Logged in successfully!')
      
      const network = await provider.getNetwork()
      const balance = await provider.getBalance(address)

      set({
        isConnected: true,
        isAuthenticated: true,
        address,
        provider,
        signer,
        chainId: Number(network.chainId),
        balance: ethers.formatEther(balance)
      })

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          get().disconnect()
        } else {
          // Re-run connect to log in with the new account
          get().disconnect();
          get().connect();
        }
      })

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload()
      })

    } catch (error: any) {
      toast.dismiss('auth');
      console.error('Failed to connect or authenticate wallet:', error)
      
      // Extract error message
      let errorMessage = 'Failed to log in.'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Clean up state without showing disconnect toast
      localStorage.removeItem('authToken');
      set({
        isConnected: false,
        isAuthenticated: false,
        address: null,
        provider: null,
        signer: null,
        chainId: null,
        balance: '0'
      })
      
      toast.error(errorMessage)
    }
  },

  disconnect: (showToast: boolean = true) => {
    localStorage.removeItem('authToken');
    set({
      isConnected: false,
      isAuthenticated: false,
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      balance: '0'
    })
    if (showToast) {
      toast.success('Wallet disconnected')
    }
  },

  switchNetwork: async (targetChainId: number) => {
    // ... (implementation remains the same)
  },

  updateBalance: async () => {
    // ... (implementation remains the same)
  }
}))

// Auto-connect and auth check if previously connected
if (typeof window !== 'undefined' && window.ethereum) {
  const token = localStorage.getItem('authToken');
  if (token) {
    // If a token exists, try to connect wallet silently
    window.ethereum.request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts.length > 0) {
          // We don't run the full connect flow here to avoid asking for signature on page load.
          // We just set the connection state. The JWT is already in localStorage.
          const provider = new ethers.BrowserProvider(window.ethereum);
          provider.getSigner().then(signer => {
            provider.getNetwork().then(network => {
              signer.getAddress().then(address => {
                provider.getBalance(address).then(balance => {
                  useWalletStore.setState({
                    isConnected: true,
                    isAuthenticated: true,
                    address,
                    provider,
                    signer,
                    chainId: Number(network.chainId),
                    balance: ethers.formatEther(balance)
                  });
                });
              });
            });
          });
        } else {
          // Token exists but no account connected, so clean up
          localStorage.removeItem('authToken');
        }
      })
      .catch(console.error)
  }
}