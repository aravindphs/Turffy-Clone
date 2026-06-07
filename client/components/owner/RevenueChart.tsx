'use client'

interface DailyRevenue {
  date: string    // YYYY-MM-DD
  revenue: number
  bookings: number
}

interface RevenueChartProps {
  data: DailyRevenue[]
  title?: string
}

export function RevenueChart({ data, title = 'Revenue (Last 30 Days)' }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalBookings = data.reduce((s, d) => s + d.bookings, 0)
  const avgPerBooking = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0

  const displayData = data.slice(-30)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-6">{title}</h3>

      {/* SVG Bar Chart */}
      <div className="overflow-x-auto">
        <svg viewBox="0 0 800 200" className="w-full min-w-[600px]">
          {/* Y-axis gridlines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <line
              key={pct}
              x1="40"
              x2="800"
              y1={180 - pct * 1.6}
              y2={180 - pct * 1.6}
              stroke="#f1f5f9"
              strokeWidth="1"
            />
          ))}

          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <text
              key={`label-${pct}`}
              x="35"
              y={184 - pct * 1.6}
              textAnchor="end"
              fontSize="9"
              fill="#94a3b8"
            >
              ₹{Math.round((pct / 100) * maxRevenue / 1000)}k
            </text>
          ))}

          {/* Bars */}
          {displayData.map((d, i) => {
            const barWidth = Math.max(16, (760 / displayData.length) - 4)
            const gap = 760 / displayData.length
            const x = 40 + i * gap + (gap - barWidth) / 2
            const barHeight = maxRevenue > 0 ? (d.revenue / maxRevenue) * 160 : 0
            const y = 180 - barHeight

            return (
              <g key={d.date}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="3"
                  fill="#16a34a"
                  opacity={barHeight > 0 ? '0.8' : '0.3'}
                >
                  <title>
                    {d.date}: ₹{d.revenue.toLocaleString()} ({d.bookings} booking{d.bookings !== 1 ? 's' : ''})
                  </title>
                </rect>
              </g>
            )
          })}

          {/* X-axis labels (every 7 days) */}
          {displayData
            .filter((_, i) => i % 7 === 0)
            .map((d, i) => {
              const gap = 760 / displayData.length
              const x = 40 + i * 7 * gap + gap / 2
              return (
                <text
                  key={`x-${d.date}`}
                  x={x}
                  y="198"
                  textAnchor="middle"
                  fontSize="10"
                  fill="#94a3b8"
                >
                  {d.date.slice(5)}
                </text>
              )
            })}
        </svg>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">
            ₹{totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Total Revenue</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{totalBookings}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total Bookings</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">
            ₹{avgPerBooking.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Avg per Booking</p>
        </div>
      </div>
    </div>
  )
}
