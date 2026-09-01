import { useEffect, useState } from 'react'

type Props = {
  message: string
  onDismiss: () => void
  duration?: number
}

export default function ErrorToast({ message, onDismiss, duration = 5000 }: Props) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300) }, duration)
    return () => clearTimeout(t)
  }, [duration, onDismiss])
  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <div className="card px-5 py-3 flex items-center gap-3" style={{ borderColor: 'var(--color-danger)' }}>
        <span className="text-[var(--color-danger)] text-sm">✕</span>
        <span className="text-[var(--color-text-primary)] text-sm">{message}</span>
        <button onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] text-xs ml-2">✕</button>
      </div>
    </div>
  )
}
