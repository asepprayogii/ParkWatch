export default function LoadingSpinner({ size = 'md', text = 'Memuat...', fullScreen = false }) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-14 h-14 border-4',
  }

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size]} border-blue-600 border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-sm text-slate-500 animate-pulse">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        {spinner}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-20">
      {spinner}
    </div>
  )
}
