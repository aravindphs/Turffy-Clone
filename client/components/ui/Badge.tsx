type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'grey' | 'orange' | 'purple'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  grey: 'bg-slate-100 text-slate-600 ring-slate-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
}

const dotColors: Record<BadgeVariant, string> = {
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
  grey: 'bg-slate-400',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
}

export function Badge({
  children,
  variant = 'grey',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-medium ring-1 ring-inset rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  )
}
