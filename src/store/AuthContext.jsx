import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (authUser) => {
    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('fetchProfile error:', error)
        setUser(null)
      } else {
        setUser(data)
      }
    } catch (err) {
      console.error('fetchProfile catch:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Cek session awal
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session?.user ?? null)
    })

    // Listen perubahan auth (termasuk token expired)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          fetchProfile(session?.user ?? null)
        } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          fetchProfile(session?.user ?? null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Periodic token check
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session && user) {
        // Token expired and couldn't be refreshed
        setUser(null)
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}