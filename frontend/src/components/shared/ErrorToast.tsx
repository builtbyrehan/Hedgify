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
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
      <div
        style={{
          backgroundColor: 'var(--surface-raised)',
          borderColor: '#F0554B',
          color: 'var(--text)',
        }}
        className="px-4 py-2.5 rounded-[2px] border flex items-center gap-3 shadow-none font-mono text-[12px]"
      >
        <span className="text-[#F0554B]">✕</span>
        <span>{message}</span>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }}
          className="text-[var(--text-faint)] hover:text-[var(--text)] text-[11px] ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
