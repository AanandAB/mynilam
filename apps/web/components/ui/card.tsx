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
    ? 'hover:-translate-y-1.5 hover:shadow-card-hover hover:border-brand dark:hover:border-brand transition-all duration-300 ease-out'
    : ''

  return (
    <div
      className={`bg-white/95 dark:bg-[#111b2e]/95 backdrop-blur-md rounded-2xl border border-border dark:border-white/10 shadow-md ${paddings[padding]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
