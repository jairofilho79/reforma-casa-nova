import { statusLabels, statusColors } from '../../lib/formatters'
import type { MouseEvent } from 'react'

type StatusBadgeProps = {
  status: string
  onClick?: () => void
}

export function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const baseClasses = `inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-600'}`

  if (onClick) {
    const handleClick = (e: MouseEvent) => {
      e.stopPropagation()
      onClick()
    }
    return (
      <button onClick={handleClick} className={`${baseClasses} cursor-pointer hover:opacity-80 transition-opacity`}>
        {statusLabels[status] || status}
      </button>
    )
  }

  return <span className={baseClasses}>{statusLabels[status] || status}</span>
}
