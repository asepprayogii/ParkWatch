import { supabase } from '../lib/supabase'

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
   .select(`*, reports (id, plate_number, zones (name))`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
  if (error) throw error
}

export async function markAllAsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) throw error
}

export async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) throw error
  return count ?? 0
}

export async function sendNotificationToUser({ userId, reportId, plateNumber, status }) {
  const messages = {
    in_progress: `Laporan parkir liar plat ${plateNumber} sedang ditangani oleh petugas`,
    resolved: `Laporan parkir liar plat ${plateNumber} telah berhasil diselesaikan`,
  }
  const message = messages[status]
  if (!message) return

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'action_update',
      related_report_id: reportId,
      message,
      is_read: false,
    })
  if (error) throw error
}

/**
 * Kirim notifikasi ke satpam yang bertugas di zona ini
 * LOGIKA BARU: Cukup cek apakah satpam is_active di zone_id tersebut
 */
export async function sendNotificationToSatpam({ zoneId, reportId, plateNumber }) {
  try {
    // Ambil semua satpam yang AKTIF di zona ini (tanpa filter hari/shift)
    const { data: roster, error } = await supabase
      .from('roster')
      .select('satpam_id')
      .eq('zone_id', zoneId)

    if (error) throw error
    if (!roster || roster.length === 0) {
      console.log('⚠️ Tidak ada satpam aktif di zona ini:', zoneId)
      return
    }

    // Deduplikasi satpam_id
    const uniqueSatpamIds = [...new Set(roster.map(r => r.satpam_id))]
    
    const notifications = uniqueSatpamIds.map(satpamId => ({
      user_id: satpamId,
      type: 'new_report',
      related_report_id: reportId,
      message: `Laporan baru parkir liar plat ${plateNumber} di zona kamu`,
      is_read: false,
    }))

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
    if (insertError) throw insertError
    
  } catch (err) {
    console.error('sendNotificationToSatpam error:', err)
  }
}