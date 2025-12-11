import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWalletStore } from '../stores/walletStore'

const ADMIN_ADDRESS = '0xaa91592fd2e0ad8575e292aa71a284c6c59adcff'

const Navbar: React.FC = () => {
  const location = useLocation()
  const { isConnected, address, connect, disconnect } = useWalletStore()

  const isActive = (path: string) => location.pathname === path

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }
  
  const isAdmin = isConnected && address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-gray-900">
              Crypto Insurance
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`text-sm transition-colors ${isActive('/') ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
              Home
            </Link>
            <Link to="/policies" className={`text-sm transition-colors ${isActive('/policies') ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
              Policies
            </Link>
            {isConnected && (
              <>
                <Link to="/claims" className={`text-sm transition-colors ${isActive('/claims') ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
                  Claims
                </Link>
                <Link to="/dashboard" className={`text-sm transition-colors ${isActive('/dashboard') ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link to="/admin" className={`text-sm transition-colors ${isActive('/admin') ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <span className="text-sm text-gray-600">{formatAddress(address!)}</span>
                <button onClick={disconnect} className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-1 px-4 rounded text-sm transition-colors">
                  Disconnect
                </button>
              </>
            ) : (
              <button onClick={connect} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-4 rounded text-sm transition-colors">
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar