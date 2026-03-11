import type { ChangeEvent } from 'react'
import { Input } from './Input'
import { formatCurrency } from '../../lib/formatters'

interface MoneyInputProps {
    label: string
    value: string | number
    onChange: (value: string) => void
    placeholder?: string
    required?: boolean
    error?: string
    className?: string
}

export function MoneyInput({
    label,
    value,
    onChange,
    placeholder = 'R$ 0,00',
    required,
    error,
    className = ''
}: MoneyInputProps) {

    // Format numeric value to currency string for display
    const displayValue = typeof value === 'number'
        ? formatCurrency(value)
        : value === '' ? '' : formatCurrency(parseFloat(value) || 0)

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value
        // Remove non-digits
        const digits = rawValue.replace(/\D/g, '')

        if (digits === '') {
            onChange('')
            return
        }

        // Convert string of digits to a decimal number (cents to units)
        const numericValue = (parseInt(digits, 10) / 100).toFixed(2)
        onChange(numericValue)
    }

    return (
        <Input
            label={label}
            type="text"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            error={error}
            className={className}
            inputMode="numeric"
        />
    )
}
