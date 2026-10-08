import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'interactive';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl border p-3.5 md:p-5 transition-all duration-200 border-garis',
          {
            'bg-kartu': variant === 'default' || variant === 'interactive',
            'bg-kartu-muted': variant === 'muted',
            'hover:border-cyan-500/50 hover:shadow-sm cursor-pointer': variant === 'interactive',
          },
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
