import React from 'react';

interface SoftDriftingCloudsProps {
  condition: 'cerah' | 'gerimis' | 'hujan' | 'badai';
}

export const SoftDriftingClouds: React.FC<SoftDriftingCloudsProps> = ({ condition }) => {
  // Cloud palette matching weather condition without harsh electric tones
  const theme = {
    cerah: {
      cloud1: 'rgba(255, 255, 255, 0.42)',
      cloud2: 'rgba(254, 243, 199, 0.35)', // subtle warm sun-kissed tint
      cloud3: 'rgba(241, 245, 249, 0.25)',
      filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))',
    },
    gerimis: {
      cloud1: 'rgba(148, 163, 184, 0.38)',
      cloud2: 'rgba(100, 116, 139, 0.32)',
      cloud3: 'rgba(71, 85, 105, 0.28)',
      filter: 'drop-shadow(0 10px 20px rgba(15, 23, 42, 0.3))',
    },
    hujan: {
      cloud1: 'rgba(71, 85, 105, 0.45)',
      cloud2: 'rgba(51, 65, 85, 0.40)',
      cloud3: 'rgba(30, 41, 59, 0.35)',
      filter: 'drop-shadow(0 12px 24px rgba(2, 6, 23, 0.45))',
    },
    badai: {
      cloud1: 'rgba(49, 46, 129, 0.40)',
      cloud2: 'rgba(30, 27, 75, 0.50)',
      cloud3: 'rgba(15, 23, 42, 0.60)',
      filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.6))',
    },
  }[condition];

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Layer 1: High Altitude Puffy Clouds (Drifts slowest, 75s loop) */}
      <div
        className="absolute top-4 -left-[600px] w-[1800px] h-48 opacity-75 animate-[cloudDrift_75s_linear_infinite]"
        style={{ filter: theme.filter }}
      >
        <svg viewBox="0 0 1200 240" fill="none" className="w-full h-full">
          {/* Cloud Formation 1 */}
          <path
            d="M 120 180 C 90 180 70 160 80 135 C 75 110 95 90 120 95 C 135 65 175 60 195 80 C 220 55 265 60 280 85 C 310 80 340 105 330 135 C 355 145 360 175 335 180 Z"
            fill={theme.cloud3}
          />
          {/* Cloud Formation 2 */}
          <path
            d="M 680 190 C 650 190 635 170 645 145 C 640 120 660 100 685 105 C 700 75 740 70 760 90 C 785 65 830 70 845 95 C 875 90 905 115 895 145 C 920 155 925 185 900 190 Z"
            fill={theme.cloud3}
          />
        </svg>
      </div>

      {/* Layer 2: Mid-Level Volumetric Clouds (Medium speed, 50s loop) */}
      <div
        className="absolute top-16 -left-[500px] w-[1600px] h-56 animate-[cloudDrift_50s_linear_infinite]"
        style={{
          filter: theme.filter,
          animationDelay: '-18s',
        }}
      >
        <svg viewBox="0 0 1200 260" fill="none" className="w-full h-full">
          <path
            d="M 280 190 C 240 190 220 160 230 130 C 220 95 250 70 285 75 C 305 40 355 35 385 60 C 420 30 480 35 500 70 C 540 65 580 95 570 135 C 600 145 610 185 575 190 Z"
            fill={theme.cloud2}
          />
          <path
            d="M 880 180 C 840 180 820 155 830 125 C 825 95 850 75 885 80 C 905 45 955 40 985 65 C 1020 35 1075 40 1095 75 C 1135 70 1175 100 1165 140 C 1195 150 1200 185 1170 180 Z"
            fill={theme.cloud2}
          />
        </svg>
      </div>

      {/* Layer 3: Foreground Soft Mist Clouds (Drifts closer, 35s loop) */}
      <div
        className="absolute top-28 -left-[400px] w-[1500px] h-64 animate-[cloudDrift_35s_linear_infinite]"
        style={{
          filter: theme.filter,
          animationDelay: '-8s',
        }}
      >
        <svg viewBox="0 0 1200 280" fill="none" className="w-full h-full">
          <path
            d="M 80 210 C 35 210 10 175 25 140 C 15 100 50 75 90 80 C 115 40 170 35 205 60 C 245 25 310 30 335 70 C 380 65 420 100 410 145 C 445 155 455 200 415 210 Z"
            fill={theme.cloud1}
          />
          <path
            d="M 520 220 C 475 220 450 185 465 150 C 455 110 490 85 530 90 C 555 50 610 45 645 70 C 685 35 750 40 775 80 C 820 75 860 110 850 155 C 885 165 895 210 855 220 Z"
            fill={theme.cloud1}
          />
        </svg>
      </div>
    </div>
  );
};
