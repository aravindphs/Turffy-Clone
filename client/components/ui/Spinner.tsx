interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  color?: 'brand' | 'white' | 'slate'
  className?: string
}

const sizeClasses = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-3',
}

const colorClasses = {
  brand: 'border-brand-200 border-t-brand-600',
  white: 'border-white/30 border-t-white',
  slate: 'border-slate-200 border-t-slate-600',
}

export function Spinner({ size = 'md', color = 'brand', className = '' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={[
        'rounded-full animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className,
      ].join(' ')}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  )
}
