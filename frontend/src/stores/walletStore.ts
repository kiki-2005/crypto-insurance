import { create } from 'zustand'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

interface WalletState {
  isConnected: boolean
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
      const network = await provider.getNetwork()
      const balance = await provider.getBalance(address)

      set({
        isConnected: true,
        address,
        provider,
        signer,
        chainId: Number(network.chainId),
        balance: ethers.formatEther(balance)
      })

      toast.success('Wallet connected successfully!')

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          get().disconnect()
        } else {
          get().connect()
        }
      })

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload()
      })

    } catch (error) {
      console.error('Failed to connect wallet:', error)
      toast.error('Failed to connect wallet')
    }
  },

  disconnect: () => {
    set({
      isConnected: false,
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      balance: '0'
    })
    toast.success('Wallet disconnected')
  },

  switchNetwork: async (targetChainId: number) => {
    try {
      if (!window.ethereum) return

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added to MetaMask
        toast.error('Please add this network to MetaMask')
      } else {
        console.error('Failed to switch network:', error)
        toast.error('Failed to switch network')
      }
    }
  },

  updateBalance: async () => {
    const { provider, address } = get()
    if (!provider || !address) return

    try {
      const balance = await provider.getBalance(address)
      set({ balance: ethers.formatEther(balance) })
    } catch (error) {
      console.error('Failed to update balance:', error)
    }
  }
}))

// Auto-connect if previously connected
if (typeof window !== 'undefined' && window.ethereum) {
  window.ethereum.request({ method: 'eth_accounts' })
    .then((accounts: string[]) => {
      if (accounts.length > 0) {
        useWalletStore.getState().connect()
      }
    })
    .catch(console.error)
}