import { createContext, useContext, useEffect, useState } from 'react'
import { getSession, clearSession, apiFetch } from './auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    if (session?.user) {
      setUser(session.user)
      setLoading(false)
      apiFetch('/profile')
        .then(data => {
          setUser(data.user)
          localStorage.setItem('session', JSON.stringify({ ...session, user: data.user }))
        })
        .catch(err => {
          if (err.message === 'Unauthorized') {
            clearSession()
            setUser(null)
          }
        })
    } else {
      setUser(null)
      setLoading(false)
    }
  }, [])

  const logout = () => {
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
