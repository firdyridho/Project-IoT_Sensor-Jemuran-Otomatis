import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'rounded';
}

/**
 * Reusable Base Skeleton Component with elegant dual-mode shimmer wave (REQ-FE-11)
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  ...props
}) => {
  const variantClass =
    variant === 'circular'
      ? 'rounded-full'
      : variant === 'rectangular'
      ? 'rounded-none'
      : 'rounded-xl';

  return (
    <div
      className={twMerge(
        clsx(
          'relative overflow-hidden',
          'bg-slate-200/80 dark:bg-slate-800/70',
          variantClass,
          className
        )
      )}
      {...props}
    >
      {/* Smooth Shimmer Light Sweep Effect */}
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-slate-700/50 to-transparent animate-[shimmer_1.8s_infinite]"
        aria-hidden="true"
      />
    </div>
  );
};

/**
 * Zero-CLS Skeleton for QuickWeatherCard on Dashboard
 */
export const SkeletonQuickWeatherCard: React.FC = () => {
  return (
    <div className="border border-garis rounded-2xl p-4 md:p-5 bg-kartu flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
      <div className="flex items-start sm:items-center gap-3.5">
        {/* Weather Icon Placeholder */}
        <Skeleton variant="circular" className="w-12 h-12 shrink-0" />

        <div className="space-y-2 min-w-0">
          {/* Location row */}
          <div className="flex items-center gap-2">
            <Skeleton className="w-28 h-3.5" />
            <Skeleton className="w-12 h-3.5" />
          </div>
          {/* Weather title & temperature */}
          <div className="flex items-baseline gap-2">
            <Skeleton className="w-36 h-6" />
            <Skeleton className="w-12 h-5" />
          </div>
          {/* Rain risk sub-text */}
          <Skeleton className="w-48 h-3" />
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-garis">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-24 h-4 rounded-lg" />
      </div>
    </div>
  );
};

/**
 * Zero-CLS Skeleton for WeatherView (Prakiraan Cuaca BMKG)
 */
export const SkeletonWeatherView: React.FC = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. Header Location Selector Card */}
      <div className="border border-garis rounded-2xl p-4 md:p-6 bg-kartu space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="w-44 h-5" />
              <Skeleton className="w-56 h-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-28 h-9 rounded-xl" />
            <Skeleton className="w-24 h-9 rounded-xl" />
          </div>
        </div>

        {/* Selected location pill */}
        <Skeleton className="w-full h-11 rounded-xl" />
      </div>

      {/* 2. Rain Risk Summary Banner */}
      <div className="p-4 md:p-5 rounded-2xl border-2 border-garis/60 bg-kartu flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="w-56 h-5" />
            <Skeleton className="w-80 max-w-full h-3.5" />
          </div>
        </div>
        <Skeleton className="w-28 h-6 rounded-full shrink-0" />
      </div>

      {/* 3. 3-Day Tabs */}
      <div className="flex items-center gap-2 border-b border-garis pb-2">
        <Skeleton className="w-28 h-10 rounded-xl shrink-0" />
        <Skeleton className="w-28 h-10 rounded-xl shrink-0" />
        <Skeleton className="w-28 h-10 rounded-xl shrink-0" />
      </div>

      {/* 4. Hourly Forecast Slot Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-2xl bg-kartu border border-garis flex flex-col items-center space-y-2.5"
          >
            <Skeleton className="w-12 h-3" />
            <Skeleton variant="circular" className="w-10 h-10" />
            <Skeleton className="w-14 h-4" />
            <Skeleton className="w-10 h-5" />
            <div className="w-full space-y-1 pt-1 border-t border-garis/50">
              <Skeleton className="w-full h-2.5" />
              <Skeleton className="w-full h-2.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Zero-CLS Skeleton for Table Rows (Riwayat Event & Log Telemetri)
 */
export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="border border-garis rounded-2xl overflow-hidden bg-kartu animate-in fade-in duration-300">
      {/* Table Header Placeholder */}
      <div className="px-4 py-3 bg-kartu-muted/60 border-b border-garis flex items-center justify-between">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-28 h-4 hidden sm:block" />
        <Skeleton className="w-20 h-4" />
      </div>

      {/* Table Data Rows */}
      <div className="divide-y divide-garis/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
              <div className="space-y-1 min-w-0">
                <Skeleton className="w-36 h-4" />
                <Skeleton className="w-24 h-3" />
              </div>
            </div>
            <Skeleton className="w-20 h-6 rounded-full shrink-0" />
            <Skeleton className="w-28 h-4 hidden sm:block shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Zero-CLS Skeleton for Realtime Chart (Tab Grafik)
 */
export const SkeletonChart: React.FC = () => {
  return (
    <div className="border border-garis rounded-2xl p-4 md:p-6 bg-kartu space-y-4 animate-in fade-in duration-300">
      {/* Chart Top Controls Placeholder */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-garis pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="w-40 h-5" />
            <Skeleton className="w-56 h-3" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-32 h-9 rounded-xl" />
          <Skeleton className="w-24 h-9 rounded-xl" />
        </div>
      </div>

      {/* Series Selector Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Skeleton className="w-24 h-9 rounded-xl shrink-0" />
        <Skeleton className="w-24 h-9 rounded-xl shrink-0" />
        <Skeleton className="w-24 h-9 rounded-xl shrink-0" />
        <Skeleton className="w-24 h-9 rounded-xl shrink-0" />
      </div>

      {/* Chart Canvas Area Placeholder (Proportional Height h-64 sm:h-80) */}
      <div className="w-full h-64 sm:h-80 rounded-2xl border border-garis/60 bg-kartu-muted/40 p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="flex justify-between">
          <Skeleton className="w-12 h-3" />
          <Skeleton className="w-16 h-3" />
        </div>
        {/* Subtle curve wave simulation */}
        <div className="w-full h-32 border-b border-dashed border-garis/80 flex items-end gap-1">
          {Array.from({ length: 24 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-sm"
              style={{ height: `${20 + (i % 6) * 12}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between">
          <Skeleton className="w-16 h-3" />
          <Skeleton className="w-16 h-3" />
          <Skeleton className="w-16 h-3" />
        </div>
      </div>
    </div>
  );
};

/**
 * Zero-CLS Skeleton for Device Manager Cards (Tab Kelola Perangkat)
 */
export const SkeletonDeviceCard: React.FC = () => {
  return (
    <div className="border border-garis rounded-2xl p-4 sm:p-5 bg-kartu space-y-4 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
          <div className="space-y-1.5">
            <Skeleton className="w-36 h-5" />
            <Skeleton className="w-28 h-3.5 font-mono" />
          </div>
        </div>
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-garis">
        <Skeleton className="h-8 rounded-xl" />
        <Skeleton className="h-8 rounded-xl" />
      </div>
    </div>
  );
};
