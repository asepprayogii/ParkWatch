import { supabase } from '../lib/supabase'

export async function register({ full_name, email, phone, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, phone }
    }
  })
  if (error) throw error

  // Tunggu sebentar supaya auth user benar-benar terbuat
  await new Promise(resolve => setTimeout(resolve, 500))

  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: data.user.id,
      email,
      full_name,
      phone,
      role: 'user',
    })

  if (insertError) throw insertError
  return data
}

export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return null
  return data
}