import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useWalletStore } from './stores/walletStore'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Policies from './pages/Policies'
import Claims from './pages/Claims'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

function App() {
  const { isConnected } = useWalletStore()

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