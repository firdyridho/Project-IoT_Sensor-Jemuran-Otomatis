import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'hujan' | 'kering';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  ...props
}) => {
  return (
    <button
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          // Minimum touch target 44x44px as per UI rules
          'min-h-11 min-w-11 px-4 py-2 text-sm',
          {
            'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm': variant === 'primary' || variant === 'hujan',
            'bg-blue-600 hover:bg-blue-500 text-white shadow-sm': variant === 'kering',
            'bg-kartu-muted hover:bg-garis text-teks-utama border border-garis': variant === 'secondary',
            'bg-transparent hover:bg-kartu-muted text-teks-utama': variant === 'ghost',
            'bg-red-600/90 hover:bg-red-600 text-white': variant === 'danger',
          },
          {
            'text-xs px-3': size === 'sm',
            'text-sm px-4': size === 'md',
            'text-base px-5 py-2.5': size === 'lg',
          },
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  );
};
