import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { isOnline, addNetworkListener } from '../lib/networkHandler'
import './NetworkStatus.css'

export default function NetworkStatus() {
  const [online, setOnline] = useState(isOnline())
  const [wasOffline, setWasOffline] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    // Listen for network status changes
    const cleanup = addNetworkListener((isOnlineNow) => {
      setOnline(isOnlineNow)
      
      if (!isOnlineNow) {
        setWasOffline(true)
        setShowReconnected(false)
      } else if (wasOffline) {
        // Show reconnected message briefly
        setShowReconnected(true)
        setTimeout(() => setShowReconnected(false), 3000)
      }
    })

    return cleanup
  }, [wasOffline])

  // Show offline banner
  if (!online) {
    return (
      <div className="network-status offline">
        <WifiOff size={18} />
        <span>You're offline. Some features may not work.</span>
      </div>
    )
  }

  // Show reconnected message briefly
  if (showReconnected) {
    return (
      <div className="network-status reconnected">
        <Wifi size={18} />
        <span>Connection restored!</span>
      </div>
    )
  }

  return null
}
