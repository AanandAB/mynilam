import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card: React.FC<CardProps> = ({
  className = '',
  hoverEffect = false,
  padding = 'md',
  children,
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const hoverStyles = hoverEffect
    ? 'hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-300 transition-all duration-300'
    : ''

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${paddings[padding]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
