const categoryColors = {
  pencurian: 'bg-red-100 text-red-600',
  vandalisme: 'bg-orange-100 text-orange-600',
  kecelakaan: 'bg-yellow-100 text-yellow-600',
  kebakaran: 'bg-red-100 text-red-700',
  mencurigakan: 'bg-purple-100 text-purple-600',
  lainnya: 'bg-slate-100 text-slate-600',
}

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  verified: 'bg-blue-50 text-blue-600 border-blue-200',
  in_progress: 'bg-orange-50 text-orange-600 border-orange-200',
  resolved: 'bg-green-50 text-green-600 border-green-200',
}

const statusLabels = {
  pending: 'Menunggu',
  verified: 'Terverifikasi',
  in_progress: 'Diproses',
  resolved: 'Selesai',
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff} detik lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

export default function ReportCard({ report, userVote, onVote }) {
  const isUpvoted = userVote === 'up'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Foto */}
      {report.photo_url && (
        <img
          src={report.photo_url}
          alt={report.title}
          className="w-full h-44 object-cover"
        />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${categoryColors[report.category] ?? categoryColors.lainnya}`}>
              {report.category}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusColors[report.status]}`}>
              {statusLabels[report.status]}
            </span>
          </div>
          <span className="text-xs text-slate-400 shrink-0">{timeAgo(report.created_at)}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-800 text-sm mb-1">{report.title}</h3>

        {/* Location */}
        <div className="flex items-center gap-1 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs text-slate-400">{report.location}</span>
        </div>

        {/* Description */}
        {report.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{report.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">
                {report.users?.full_name?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
            <span className="text-xs text-slate-500">{report.users?.full_name ?? 'Anonim'}</span>
          </div>

          {/* Vote */}
          <button
            onClick={() => onVote(report.id, 'up')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95
              ${isUpvoted ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            {report.votes_count ?? 0}
          </button>
        </div>
      </div>
    </div>
  )
}