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
    ? 'text-[12px] px-2.5 py-1.5'
    : 'text-[13px] px-3 py-2'

  return (
    <div ref={ref} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(p => !p)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border bg-[var(--color-bg-card)] font-mono transition-colors ${sizeClasses} ${
          open
            ? 'border-[var(--color-text-primary)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${selected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`}
      >
        <span className="truncate">{text}</span>
        <svg className={`w-3.5 h-3.5 shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-150 ${open ? 'rotate-180' : ''}`} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 5.25L7 8.75l3.5-3.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[160px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
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
                  className={`w-full text-left px-3 py-2 text-[13px] font-mono transition-colors flex items-center justify-between gap-2 ${
                    opt.disabled
                      ? 'opacity-30 cursor-not-allowed'
                      : isHighlighted
                        ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 shrink-0 text-[var(--color-text-primary)]" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7.5l2.5 2.5L11 4" />
                    </svg>
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
