import { useState, useRef, useEffect, type InputHTMLAttributes } from 'react'

type AutocompleteInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  label: string
  value: string
  suggestions: string[]
  onChange: (value: string) => void
}

export function AutocompleteInput({ label, value, suggestions, onChange, className = '', id, ...props }: AutocompleteInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const filtered = value
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase())
    : suggestions

  const showDropdown = open && focused && filtered.length > 0

  useEffect(() => {
    if (!showDropdown) return
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  return (
    <div className="w-full relative" ref={wrapperRef}>
      <label htmlFor={inputId} className="block text-base font-semibold text-text-primary mb-1.5">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border border-border bg-surface px-4 py-3 text-base text-text-primary
          placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          min-h-[48px] ${className}`}
        value={value}
        onChange={e => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setFocused(true)
          setOpen(true)
        }}
        onBlur={() => {
          setTimeout(() => setFocused(false), 150)
        }}
        autoComplete="off"
        {...props}
      />
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg z-50 max-h-[200px] overflow-y-auto">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              className="w-full text-left px-4 py-2.5 text-base text-text-primary hover:bg-gray-100 transition-colors"
              onMouseDown={e => {
                e.preventDefault()
                onChange(s)
                setOpen(false)
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
