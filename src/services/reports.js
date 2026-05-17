import { supabase } from '../lib/supabase'
import { sendNotificationToSatpam, sendNotificationToUser } from './notifications'

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
  if (!dateString) return "-"
  const parsedDate = typeof dateString === 'string' && !dateString.endsWith('Z') && !/[\+\-]\d{2}:?\d{2}$/.test(dateString)
    ? new Date(dateString.trim() + 'Z')
    : new Date(dateString);
  const options = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  return parsedDate.toLocaleDateString('id-ID', options)
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

// Ambil semua nomor WA satpam yang terdaftar di zona + info zona
// FIX: Ambil SEMUA satpam di zona (bukan limit 1), kembalikan array
export async function getActiveSatpamPhones(zoneId) {
  try {
    console.log('🔍 [DEBUG] Query roster untuk zoneId:', zoneId)

    // 1. Ambil semua satpam yang terdaftar di zona ini (tanpa limit)
    const { data: rosterData, error: rosterError } = await supabase
      .from('roster')
      .select('satpam_id')
      .eq('zone_id', zoneId)

    if (rosterError) {
      console.error('❌ Roster query error:', rosterError)
      return []
    }

    console.log('📦 [DEBUG] Roster result:', rosterData)

    if (!rosterData || rosterData.length === 0) {
      console.warn('⚠️ Tidak ada satpam di zona ini:', zoneId)
      return []
    }

    // 2. Deduplikasi satpam_id
    const uniqueSatpamIds = [...new Set(rosterData.map(r => r.satpam_id))]

    // 3. Ambil data semua satpam sekaligus
    const { data: usersData, error: userError } = await supabase
      .from('users')
      .select('id, phone, full_name')
      .in('id', uniqueSatpamIds)

    if (userError) {
      console.error('❌ Users query error:', userError)
      return []
    }

    // 4. Ambil nama zona
    const { data: zoneData } = await supabase
      .from('zones')
      .select('name')
      .eq('id', zoneId)
      .single()

    const zoneName = zoneData?.name || 'Zona Tidak Diketahui'

    // 5. Filter hanya yang punya nomor HP, return array
    const result = usersData
      .filter(u => u.phone)
      .map(u => ({
        phone: u.phone,
        name: u.full_name,
        zoneName,
      }))

    console.log(`✅ [DEBUG] Satpam dengan nomor WA: ${result.length} dari ${uniqueSatpamIds.length} satpam`)
    return result

  } catch (err) {
    console.error('❌ Error getting satpam phones:', err)
    return []
  }
}

// Keep backward compat (tidak dipakai lagi tapi jaga-jaga)
export async function getActiveSatpamPhone(zoneId) {
  const list = await getActiveSatpamPhones(zoneId)
  return list[0] ?? null
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
      userId: data.user_id,
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

// ✅ Create report + kirim WA ke SEMUA satpam di zona
export async function createReportWithNotification({ user_id, plate_number, zone_id, photo_url, description }) {
  try {
    console.log('📝 [DEBUG] Mulai createReportWithNotification')

    // 1. Buat laporan
    const report = await createReport({
      user_id,
      plate_number,
      zone_id,
      photo_url,
      description,
    })
    console.log('✅ [DEBUG] Report created:', report.id)

    // 2. Kirim notifikasi in-app ke semua satpam di zona (tidak perlu await, fire and forget)
    sendNotificationToSatpam({
      zoneId: zone_id,
      reportId: report.id,
      plateNumber: plate_number,
    }).catch(err => console.error('Failed to send in-app notif to satpam:', err))

    // 3. Ambil info user yang lapor
    const { data: userData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user_id)
      .single()

    const userName = userData?.full_name || 'Pelapor'
    const reportDate = formatDateIndo(report.created_at)

    // 4. Ambil SEMUA satpam yang bertugas di zona ini
    const satpamList = await getActiveSatpamPhones(zone_id)
    console.log(`👮 [DEBUG] Jumlah satpam di zona: ${satpamList.length}`)

    if (satpamList.length === 0) {
      console.warn('⚠️ Tidak ada satpam dengan nomor WA di zona ini')
    }

    // 5. Kirim WA ke semua satpam secara paralel
    const waPromises = satpamList.map(satpamInfo => {
      const message =
        `🚨 *Laporan Baru ParkWatch*\n\n` +
        `👤 Pelapor: ${userName}\n` +
        `🚗 Plat Nomor: ${plate_number || '-'}\n` +
        `📍 Zona: ${satpamInfo.zoneName}\n` +
        `📅 Tanggal: ${reportDate}\n` +
        `📝 Keterangan: ${description || '-'}\n\n` +
        `Silakan ditindaklanjuti.`

      console.log('📤 [DEBUG] Kirim WA ke satpam:', satpamInfo.phone, '(' + satpamInfo.name + ')')
      return sendWhatsAppNotification({ phone: satpamInfo.phone, message })
        .catch(err => console.error('Failed to send WA to', satpamInfo.phone, ':', err))
    })

    // Tunggu semua WA terkirim sebelum return (mencegah request dibatalkan browser)
    await Promise.allSettled(waPromises)

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

    // Kirim notifikasi in-app ke user
    if (reportInfo?.userId) {
      await sendNotificationToUser({
        userId: reportInfo.userId,
        reportId: reportInfo.id,
        plateNumber: reportInfo.plateNumber,
        status: status,
      }).catch(err => console.error('Failed to send in-app notif to user:', err))
    }

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
        await sendWhatsAppNotification({
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