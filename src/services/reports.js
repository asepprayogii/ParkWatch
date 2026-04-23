import { supabase } from '../lib/supabase'

// Ambil semua laporan + info user + zona
export async function getReports({ zoneId = null } = {}) {
  let query = supabase
    .from('reports')
    .select(`
      *,
      users (id, full_name),
      zones (id, name)
    `)
    .order('created_at', { ascending: false })

  if (zoneId) query = query.eq('zone_id', zoneId)

  const { data, error } = await query
  if (error) throw error
  return data
}

// Buat laporan baru
export async function createReport({ user_id, plate_number, zone_id, photo_url, description }) {
  const { data, error } = await supabase
    .from('reports')
    .insert({ user_id, plate_number, zone_id, photo_url, description })
    .select()
    .single()
  if (error) throw error
  return data
}

// Update status laporan (satpam & admin)
export async function updateReportStatus(reportId, status) {
  const { data, error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', reportId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Upload foto ke storage
export async function uploadPhoto(file, userId) {
  const ext = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('reports')
    .upload(fileName, file, { upsert: true })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('reports')
    .getPublicUrl(fileName)

  return publicUrl
}

// Ambil semua zona
export async function getZones() {
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}