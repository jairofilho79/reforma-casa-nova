import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & {
  label: string
  error?: string
  multiline?: boolean
}

export function Input({ label, error, multiline, className = '', id, ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-')
  const baseClasses = `w-full rounded-lg border border-border bg-surface px-4 py-3 text-base text-text-primary
    placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
    min-h-[48px] ${error ? 'border-danger' : ''} ${className}`

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="block text-base font-semibold text-text-primary mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={inputId}
          className={`${baseClasses} min-h-[100px] resize-y`}
          {...(props as InputHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={inputId}
          className={baseClasses}
          {...(props as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
}
