import { supabase } from '../lib/supabase'

// Ambil profil satpam + roster (shift & zona)
export async function getSatpamProfile(satpamId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', satpamId)
    .single()
  if (error) throw error
  return data
}

// Ambil roster satpam hari ini
export async function getTodayRoster(satpamId) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('roster')
    .select(`*, zones (id, name)`)
    .eq('satpam_id', satpamId)
    .eq('date', today)
    .eq('is_active', true)
    .single()
  if (error) return null // Tidak ada shift hari ini
  return data
}

// Ambil laporan di zona satpam
export async function getReportsByZone(zoneId, status = null) {
  let query = supabase
    .from('reports')
    .select(`
      *,
      users (id, full_name),
      zones (id, name)
    `)
    .eq('zone_id', zoneId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return data
}

// Ambil action (penanganan) laporan tertentu
export async function getReportAction(reportId) {
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .eq('report_id', reportId)
    .single()
  if (error) return null
  return data
}

// Mulai handle laporan (create action)
export async function startHandleReport(reportId, satpamId, notes = '') {
  const { data, error } = await supabase
    .from('actions')
    .insert({
      report_id: reportId,
      satpam_id: satpamId,
      status: 'in_progress',
      notes,
    })
    .select()
    .single()
  if (error) throw error

  // Update report status
  await supabase
    .from('reports')
    .update({ status: 'in_progress' })
    .eq('id', reportId)

  return data
}

// Update action + upload bukti foto
export async function updateAction(actionId, { status, notes, photoUrl }) {
  const { data, error } = await supabase
    .from('actions')
    .update({
      status,
      notes,
      photo_evidence_url: photoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', actionId)
    .select()
    .single()
  if (error) throw error

  // Kalau resolved, update report status
  if (status === 'resolved') {
    await supabase
      .from('reports')
      .update({ status: 'resolved' })
      .eq('id', data.report_id)
  }

  return data
}

// Upload foto bukti penanganan
export async function uploadEvidencePhoto(file, satpamId, reportId) {
  const ext = file.name.split('.').pop()
  const fileName = `${satpamId}/${reportId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('reports')
    .upload(fileName, file, { upsert: true })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('reports')
    .getPublicUrl(fileName)

  return publicUrl
}

// Ambil riwayat laporan satpam (yang sudah ditangani)
export async function getSatpamHistory(satpamId) {
  const { data, error } = await supabase
    .from('actions')
    .select(`
      *,
      reports (id, plate_number, zone_id, zones (name), photo_url)
    `)
    .eq('satpam_id', satpamId)
    .eq('status', 'resolved')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}