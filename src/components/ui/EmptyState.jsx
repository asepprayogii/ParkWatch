export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
      {icon && (
        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          {icon}
        </div>
      )}
      <p className="text-slate-600 font-semibold text-sm">{title}</p>
      {description && (
        <p className="text-slate-400 text-sm mt-1.5 text-center max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
