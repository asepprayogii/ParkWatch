import { supabase } from '../lib/supabase'
import { sendNotificationToSatpam } from './notifications'

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

// Update status laporan
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

// ============================================
// ✅ WHATSAPP NOTIFICATION FUNCTIONS (FONNTE)
// ============================================

// Format nomor telepon ke format internasional (628xxx)
export function formatPhoneNumber(phone) {
  if (!phone) return ''
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  }
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned
  }
  return cleaned
}

// Format tanggal Indonesia
function formatDateIndo(dateString) {
  const date = new Date(dateString)
  const options = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  return date.toLocaleDateString('id-ID', options)
}

// Kirim notifikasi WhatsApp via Edge Function
export async function sendWhatsAppNotification({ phone, message }) {
  try {
    const formattedPhone = formatPhoneNumber(phone)
    
    const { data, error } = await supabase.functions.invoke('send-wa-fonnte', {
      body: {
        phone: formattedPhone,
        message: message,
      },
    })

    if (error) {
      console.error('❌ Error sending WhatsApp:', error)
      return { success: false, error }
    }

    console.log('✅ WhatsApp sent to', formattedPhone)
    return { success: true, data }
  } catch (err) {
    console.error('❌ WhatsApp notification failed:', err)
    return { success: false, error: err }
  }
}

// Ambil nomor WA satpam aktif di zona & shift tertentu + info zona
export async function getActiveSatpamPhone(zoneId, shift) {
  try {
    console.log('🔍 [DEBUG] Query roster:', { zoneId, shift })

    // 1. Ambil roster aktif
    const { data: rosterData, error: rosterError } = await supabase
      .from('roster')
      .select('satpam_id')
      .eq('zone_id', zoneId)
      .eq('shift', shift.toLowerCase())
      .eq('is_active', true)
      .limit(1)

    if (rosterError) {
      console.error('❌ Roster query error:', rosterError)
      return null
    }

    console.log('📦 [DEBUG] Roster result:', rosterData)

    if (!rosterData || rosterData.length === 0) {
      console.warn('⚠️ Tidak ada roster aktif. Cek: zone_id, shift, is_active')
      return null
    }

    const satpamId = rosterData[0].satpam_id

    // 2. Ambil data satpam + nama zona
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('phone, full_name')
      .eq('id', satpamId)
      .single()

    const { data: zoneData } = await supabase
      .from('zones')
      .select('name')
      .eq('id', zoneId)
      .single()

    if (userError || !userData?.phone) {
      console.warn('⚠️ Satpam phone not found:', { satpamId, userError })
      return null
    }

    return { 
      phone: userData.phone, 
      name: userData.full_name,
      zoneName: zoneData?.name || 'Zona Tidak Diketahui'
    }
  } catch (err) {
    console.error('❌ Error getting satpam phone:', err)
    return null
  }
}

// Ambil info lengkap report + user + zona
export async function getReportInfo(reportId) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        users (full_name, phone),
        zones (name)
      `)
      .eq('id', reportId)
      .single()

    if (error || !data) {
      console.warn('⚠️ Report not found:', reportId)
      return null
    }

    return {
      id: data.id,
      plateNumber: data.plate_number,
      zoneName: data.zones?.name || 'Zona Tidak Diketahui',
      userName: data.users?.full_name || 'Pelapor',
      userPhone: data.users?.phone,
      description: data.description,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (err) {
    console.error('❌ Error getting report info:', err)
    return null
  }
}

// Tentukan shift berdasarkan jam sekarang
export function getCurrentShift() {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 14) return 'pagi'
  if (hour >= 14 && hour < 22) return 'sore'
  return 'malam'
}

// ✅ MODIFIKASI: Create report + kirim WA ke satpam
export async function createReportWithNotification({ user_id, plate_number, zone_id, photo_url, description }) {
  try {
    console.log('📝 [DEBUG] Mulai createReportWithNotification')

    const report = await createReport({
      user_id,
      plate_number,
      zone_id,
      photo_url,
      description,
    })

    console.log('✅ [DEBUG] Report created:', report.id)

    const currentShift = getCurrentShift()
    console.log('🕐 [DEBUG] Shift saat ini:', currentShift)

    const satpamInfo = await getActiveSatpamPhone(zone_id, currentShift)
    console.log('👮 [DEBUG] Data satpam ditemukan:', satpamInfo)

    // ✅ Kirim notifikasi in-app ke satpam yang bertugas di zona ini
    sendNotificationToSatpam({
      zoneId: zone_id,
      reportId: report.id,
      plateNumber: plate_number,
    }).catch(err => console.error('Failed to send in-app notif to satpam:', err))

    if (satpamInfo?.phone) {
      // Ambil info user yang lapor
      const { data: userData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user_id)
        .single()

      const userName = userData?.full_name || 'Pelapor'
      const reportDate = formatDateIndo(report.created_at)

      const message = `🚨 *Laporan Baru ParkWatch*\n\n` +
        `👤 Pelapor: ${userName}\n` +
        `🚗 Plat Nomor: ${plate_number || '-'}\n` +
        `📍 Zona: ${satpamInfo.zoneName}\n` +
        `📅 Tanggal: ${reportDate}\n` +
        `📝 Keterangan: ${description || '-'}\n\n` +
        `Silakan ditindaklanjuti.`

      console.log('📤 [DEBUG] Mencoba kirim WA ke:', satpamInfo.phone)
      
      // Fire-and-forget (jangan await agar UI tidak waiting)
      sendWhatsAppNotification({
        phone: satpamInfo.phone,
        message,
      }).catch(err => console.error('Failed to send WA to satpam:', err))
    } else {
      console.warn('⚠️ Tidak ada satpam aktif untuk zona ini')
    }

    return report
  } catch (err) {
    console.error('❌ Error creating report with notification:', err)
    throw err
  }
}

// ✅ MODIFIKASI: Update status + kirim WA ke user
export async function updateReportStatusWithNotification(reportId, status) {
  try {
    console.log('📝 [DEBUG] Mulai updateReportStatusWithNotification:', { reportId, status })

    const report = await updateReportStatus(reportId, status)
    console.log('✅ [DEBUG] Status updated:', report.id)

    // Ambil info lengkap report
    const reportInfo = await getReportInfo(reportId)
    console.log('👤 [DEBUG] Report info:', reportInfo)

    if (reportInfo?.userPhone) {
      let message = ''
      const processedDate = formatDateIndo(new Date().toISOString())

      if (status === 'in_progress') {
        message = `📢 *Update Laporan ParkWatch*\n\n` +
          `Halo ${reportInfo.userName}!\n` +
          `Laporan Anda sedang *ditangani* oleh satpam kami.\n\n` +
          `🚗 Plat Nomor: ${reportInfo.plateNumber}\n` +
          `📍 Zona: ${reportInfo.zoneName}\n` +
          `📅 Tanggal Lapor: ${formatDateIndo(reportInfo.createdAt)}\n` +
          `⏰ Tanggal Diproses: ${processedDate}\n\n` +
          `Terima kasih atas laporan Anda! 🙏`
      } else if (status === 'resolved') {
        message = `✅ *Laporan Selesai*\n\n` +
          `Halo ${reportInfo.userName}!\n` +
          `Laporan Anda telah *selesai ditangani*.\n\n` +
          `🚗 Plat Nomor: ${reportInfo.plateNumber}\n` +
          `📍 Zona: ${reportInfo.zoneName}\n` +
          `📅 Tanggal Lapor: ${formatDateIndo(reportInfo.createdAt)}\n` +
          `✅ Tanggal Selesai: ${processedDate}\n\n` +
          `Terima kasih telah melaporkan pelanggaran parkir.\n` +
          `Parkiran Anda kini sudah lebih tertib! 🚗✨`
      }

      if (message) {
        console.log('📤 [DEBUG] Mencoba kirim WA ke user:', reportInfo.userPhone)
        sendWhatsAppNotification({
          phone: reportInfo.userPhone,
          message,
        }).catch(err => console.error('Failed to send WA to user:', err))
      }
    }

    return report
  } catch (err) {
    console.error('❌ Error updating status with notification:', err)
    throw err
  }
}