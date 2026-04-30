import { supabase } from '../lib/supabase'

/**
 * Sistem poin computed dari data laporan user.
 * - Setiap laporan: +5 poin
 * - Laporan yang resolved: +10 poin bonus
 */

const POINTS_PER_REPORT = 5
const BONUS_RESOLVED = 10

const levels = [
  { min: 0,   label: 'Pemula',        icon: 'seedling', color: 'from-slate-400 to-slate-500' },
  { min: 25,  label: 'Kontributor',    icon: 'star',     color: 'from-yellow-400 to-amber-500' },
  { min: 100, label: 'Pelapor Aktif',  icon: 'fire',     color: 'from-orange-400 to-red-500' },
  { min: 250, label: 'Guardian',       icon: 'shield',   color: 'from-blue-400 to-indigo-500' },
  { min: 500, label: 'Legend',         icon: 'crown',    color: 'from-purple-400 to-pink-500' },
]

export function getUserLevel(points) {
  let current = levels[0]
  let nextLevel = levels[1] ?? null

  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i].min) {
      current = levels[i]
      nextLevel = levels[i + 1] ?? null
      break
    }
  }

  const progress = nextLevel
    ? Math.min(100, Math.floor(((points - current.min) / (nextLevel.min - current.min)) * 100))
    : 100

  return { ...current, points, nextLevel, progress }
}

export async function getUserPoints(userId) {
  try {
    // Count total reports
    const { count: totalReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Count resolved reports
    const { count: resolvedReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'resolved')

    const total = (totalReports ?? 0) * POINTS_PER_REPORT + (resolvedReports ?? 0) * BONUS_RESOLVED

    return {
      totalPoints: total,
      totalReports: totalReports ?? 0,
      resolvedReports: resolvedReports ?? 0,
      breakdown: {
        fromReports: (totalReports ?? 0) * POINTS_PER_REPORT,
        fromResolved: (resolvedReports ?? 0) * BONUS_RESOLVED,
      },
      level: getUserLevel(total),
    }
  } catch (err) {
    console.error('getUserPoints error:', err)
    return {
      totalPoints: 0,
      totalReports: 0,
      resolvedReports: 0,
      breakdown: { fromReports: 0, fromResolved: 0 },
      level: getUserLevel(0),
    }
  }
}

export { levels }
