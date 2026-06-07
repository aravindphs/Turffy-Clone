'use client'

import { useState } from 'react'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import DownloadIcon from '@mui/icons-material/Download'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'

interface CourtQRCodeProps {
  turfId: string
  courtId: string
  courtName: string
  turfName: string
  sport: string
  /** 'badge' = small icon-only button that opens modal; 'card' = full card with QR shown */
  variant?: 'badge' | 'card'
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

export function CourtQRCode({
  turfId,
  courtId,
  courtName,
  turfName,
  sport,
  variant = 'badge',
}: CourtQRCodeProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const qrSrc = `${API}/turfs/${turfId}/courts/${courtId}/qr`

  const handleDownload = async () => {
    try {
      const res = await fetch(qrSrc, { credentials: 'include' })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Turffy-${turfName}-${courtName}-QR.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      window.open(qrSrc, '_blank')
    }
  }

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>QR Code — ${courtName}</title>
      <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { border: 2px solid #e2e8f0; border-radius: 16px; padding: 32px; text-align: center; max-width: 320px; }
        h2 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 16px 0 4px; }
        p { color: #64748b; font-size: 14px; margin: 0 0 16px; }
        img { width: 240px; height: 240px; }
        .badge { background: #16a34a; color: white; border-radius: 9999px; padding: 4px 12px; font-size: 12px; font-weight: 600; display: inline-block; margin-top: 16px; }
        .hint { color: #94a3b8; font-size: 11px; margin-top: 8px; }
      </style></head>
      <body>
        <div class="card">
          <img src="${qrSrc}" alt="QR Code" />
          <h2>${courtName}</h2>
          <p>${turfName}</p>
          <div class="badge">📲 Scan to Book</div>
          <p class="hint">turffy.in</p>
        </div>
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 500)
  }

  return (
    <>
      {variant === 'badge' ? (
        <button
          onClick={(e) => { e.stopPropagation(); setModalOpen(true) }}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600 border border-slate-200 hover:border-brand-300 px-2 py-1 rounded-lg transition-colors"
          title="Show QR code"
        >
          <QrCode2Icon style={{ fontSize: 14 }} />
          QR
        </button>
      ) : (
        // Card variant: shows QR directly (for owner dashboard)
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <div className="flex items-center justify-between mb-3">
            <div className="text-left">
              <p className="font-semibold text-slate-900 text-sm">{courtName}</p>
              <p className="text-xs text-slate-500 capitalize">{sport}</p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              Fixed QR
            </span>
          </div>
          <img
            src={qrSrc}
            alt={`QR for ${courtName}`}
            className="w-32 h-32 mx-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setModalOpen(true)}
          />
          <p className="text-xs text-slate-400 mt-2 mb-3">Tap to enlarge • Never changes</p>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1 border border-slate-200 text-slate-600 text-xs py-2 rounded-xl hover:border-brand-300 hover:text-brand-600 transition-colors"
            >
              <DownloadIcon style={{ fontSize: 14 }} />
              Download
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1 bg-brand-600 text-white text-xs py-2 rounded-xl hover:bg-brand-700 transition-colors"
            >
              <PrintIcon style={{ fontSize: 14 }} />
              Print
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{courtName}</h3>
                <p className="text-sm text-slate-500">{turfName}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <CloseIcon />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-center mb-4">
              <img src={qrSrc} alt={`QR for ${courtName}`} className="w-56 h-56" />
            </div>

            <p className="text-xs text-center text-slate-500 mb-5">
              Walk-in customers scan this to book · QR never changes
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:border-brand-300 transition-colors"
              >
                <DownloadIcon fontSize="small" />
                Download
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                <PrintIcon fontSize="small" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
