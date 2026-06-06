import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider } from '@/providers/AuthProvider'
import { SocketProvider } from '@/providers/SocketProvider'

export const metadata: Metadata = {
  title: {
    default: 'Turffy — Book Sports Turfs Online in Tamil Nadu',
    template: '%s | Turffy',
  },
  description:
    'Book your favourite sports turf in seconds. Football, Cricket, Badminton & more — across Tamil Nadu. Real-time availability, instant confirmation.',
  keywords: ['turf booking', 'sports ground', 'Tamil Nadu', 'Chennai', 'football turf', 'cricket ground'],
  openGraph: {
    title: 'Turffy — Book Sports Turfs Online',
    description: 'Real-time turf booking platform for Tamil Nadu',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    borderRadius: '12px',
                    background: '#1e293b',
                    color: '#f8fafc',
                    fontSize: '14px',
                    padding: '12px 16px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                  },
                  success: {
                    iconTheme: { primary: '#22c55e', secondary: '#f8fafc' },
                  },
                  error: {
                    iconTheme: { primary: '#ef4444', secondary: '#f8fafc' },
                  },
                }}
              />
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
