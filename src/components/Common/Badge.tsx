import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'kering' | 'hujan' | 'offline' | 'peringatan' | 'bahaya' | 'sukses' | 'netral';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'netral',
  dot = false,
  ...props
}) => {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide',
          {
            'bg-kering-subtle text-kering border border-kering/30': variant === 'kering',
            'bg-hujan-subtle text-hujan border border-hujan/30': variant === 'hujan',
            'bg-offline-subtle text-offline border border-offline/30': variant === 'offline',
            'bg-peringatan-subtle text-peringatan border border-peringatan/30': variant === 'peringatan',
            'bg-bahaya-subtle text-bahaya border border-bahaya/30': variant === 'bahaya',
            'bg-sukses-subtle text-sukses border border-sukses/30': variant === 'sukses',
            'bg-kartu-muted text-teks-sekunder border border-garis': variant === 'netral',
          },
          className
        )
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx('h-1.5 w-1.5 rounded-full shrink-0', {
            'bg-blue-500': variant === 'kering',
            'bg-cyan-500 animate-pulse': variant === 'hujan',
            'bg-slate-400': variant === 'offline' || variant === 'netral',
            'bg-amber-500': variant === 'peringatan',
            'bg-red-500': variant === 'bahaya',
            'bg-green-500': variant === 'sukses',
          })}
        />
      )}
      {children}
    </span>
  );
};
