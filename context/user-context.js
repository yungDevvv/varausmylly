"use client"

import { getLoggedInUser } from '@/lib/appwrite/server'
import { createContext, useContext, useState, useEffect } from 'react'


const UserContext = createContext()

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await getLoggedInUser();
        setUser(currentUser)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  const value = {
    user,
    loading,
    error,
    setUser,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
