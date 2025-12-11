import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useWalletStore } from './stores/walletStore'
import { useWebSocket } from './hooks/useWebSocket'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Policies from './pages/Policies'
import Claims from './pages/Claims'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

function App() {
  const { isConnected, address } = useWalletStore()
  
  const { isConnected: wsConnected, authenticate, subscribe } = useWebSocket(
    'ws://localhost:3001/ws',
    {
      onMessage: (message) => {
        console.log('WebSocket message:', message)
      },
      onConnect: () => {
        console.log('WebSocket connected')
      }
    }
  )

  useEffect(() => {
    if (wsConnected && isConnected && address) {
      authenticate(address, 'dummy-signature')
      subscribe(['claims', 'policies', 'notifications'])
    }
  }, [wsConnected, isConnected, address])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/policies" element={<Policies />} />
          {isConnected && (
            <>
              <Route path="/claims" element={<Claims />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<Admin />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  )
}

export default App