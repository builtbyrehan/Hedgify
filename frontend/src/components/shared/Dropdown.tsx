import { useState, useRef, useEffect, useCallback } from 'react'

export type DropdownOption = { value: string; label: string; disabled?: boolean }

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md'
}

export default function Dropdown({ value, onChange, options, placeholder = 'Select...', disabled = false, className = '', size = 'md' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)
  const text = selected?.label ?? placeholder

  const close = useCallback(() => { setOpen(false); setHighlightedIndex(-1) }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [close])

  useEffect(() => {
    if (open && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]')
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [open, highlightedIndex])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    const enabled = options.filter(o => !o.disabled)
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open && highlightedIndex >= 0) {
          const opt = enabled[highlightedIndex]
          if (opt) onChange(opt.value)
          close()
        } else {
          setOpen(true)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!open) { setOpen(true); break }
        setHighlightedIndex(i => {
          const next = i + 1
          return next >= enabled.length ? 0 : next
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) { setOpen(true); break }
        setHighlightedIndex(i => {
          const prev = i - 1
          return prev < 0 ? enabled.length - 1 : prev
        })
        break
      case 'Escape':
        close()
        break
    }
  }

  const sizeClasses = size === 'sm'
    ? 'text-[11px] px-2.5 py-1.5'
    : 'text-[12px] px-3 py-2'

  return (
    <div ref={ref} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(p => !p)}
        disabled={disabled}
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: open ? '#C9A468' : 'var(--border)',
        }}
        className={`w-full flex items-center justify-between gap-2 rounded-[2px] border font-mono transition-colors ${sizeClasses} ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
        } ${selected ? 'text-[var(--text)]' : 'text-[var(--text-faint)]'}`}
      >
        <span className="truncate">{text}</span>
        <svg
          className={`w-3.5 h-3.5 shrink-0 text-[var(--text-faint)] transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3.5 5.25L7 8.75l3.5-3.5" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            backgroundColor: 'var(--surface-raised)',
            borderColor: 'var(--border)',
          }}
          className="absolute z-50 mt-1 w-full min-w-[160px] rounded-[2px] border overflow-hidden shadow-none"
        >
          <div ref={listRef} className="max-h-[200px] overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = opt.value === value
              const isHighlighted = options.indexOf(opt) === highlightedIndex
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-option
                  disabled={opt.disabled}
                  onClick={() => { if (!opt.disabled) { onChange(opt.value); close() } }}
                  onMouseEnter={() => setHighlightedIndex(options.indexOf(opt))}
                  className={`w-full text-left px-3 py-1.5 text-[12px] font-mono transition-colors flex items-center justify-between gap-2 ${
                    opt.disabled
                      ? 'opacity-30 cursor-not-allowed'
                      : isHighlighted
                        ? 'bg-[#1F2126] text-[var(--text)]'
                        : 'text-[var(--text-dim)] hover:bg-[#1F2126] hover:text-[var(--text)]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A468]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
