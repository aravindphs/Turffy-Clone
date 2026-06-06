export const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    // Already loaded
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  order_id: string
  handler: (response: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) => void
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: {
    color?: string
  }
  modal?: {
    ondismiss?: () => void
  }
  notes?: Record<string, string>
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void
      close: () => void
    }
  }
}
