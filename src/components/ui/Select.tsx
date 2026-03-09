import type { SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: { value: string; label: string }[]
  error?: string
}

export function Select({ label, options, error, className = '', id, ...props }: SelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      <label htmlFor={selectId} className="block text-base font-semibold text-text-primary mb-1.5">
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full rounded-lg border border-border bg-surface px-4 py-3 text-base text-text-primary
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[48px]
          ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}
