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

    // Listen perubahan auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        fetchProfile(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}