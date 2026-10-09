import React from 'react';

interface SoftDriftingCloudsProps {
  condition: 'cerah' | 'gerimis' | 'hujan' | 'badai';
}

export const SoftDriftingClouds: React.FC<SoftDriftingCloudsProps> = ({ condition }) => {
  // Atmospheric palette matching each weather condition exactly as requested by user
  // 1. Cerah: Kuning oranye hangat dengan awan keemasan seperti bagian kiri gambar
  // 2. Gerimis: Mulai abu-abu transisi
  // 3. Hujan: Lebih gelap lagi seperti gambar kanan dengan awan mendung pekat
  // 4. Badai: Gelap dengan hint ungu/violet
  const theme = {
    cerah: {
      cloudTop: 'rgba(255, 255, 255, 0.85)',
      cloudMid: 'rgba(254, 240, 199, 0.65)',
      cloudBase: 'rgba(245, 158, 11, 0.45)',
      filter: 'drop-shadow(0 12px 24px rgba(217, 119, 6, 0.25))',
      sunGlow: 'radial-gradient(circle at 50% 30%, rgba(254, 243, 199, 0.5) 0%, rgba(245, 158, 11, 0.2) 50%, transparent 80%)',
    },
    gerimis: {
      cloudTop: 'rgba(226, 232, 240, 0.75)',
      cloudMid: 'rgba(148, 163, 184, 0.55)',
      cloudBase: 'rgba(71, 85, 105, 0.45)',
      filter: 'drop-shadow(0 14px 28px rgba(15, 23, 42, 0.35))',
      sunGlow: 'radial-gradient(circle at 50% 30%, rgba(203, 213, 225, 0.25) 0%, transparent 70%)',
    },
    hujan: {
      cloudTop: 'rgba(100, 116, 139, 0.85)',
      cloudMid: 'rgba(51, 65, 85, 0.75)',
      cloudBase: 'rgba(15, 23, 42, 0.85)',
      filter: 'drop-shadow(0 16px 36px rgba(2, 6, 23, 0.65))',
      sunGlow: 'radial-gradient(circle at 50% 20%, rgba(56, 189, 248, 0.12) 0%, transparent 60%)',
    },
    badai: {
      cloudTop: 'rgba(129, 140, 248, 0.85)',
      cloudMid: 'rgba(67, 56, 202, 0.75)',
      cloudBase: 'rgba(30, 27, 75, 0.90)',
      filter: 'drop-shadow(0 18px 40px rgba(15, 7, 34, 0.8))',
      sunGlow: 'radial-gradient(circle at 50% 20%, rgba(192, 132, 252, 0.25) 0%, transparent 70%)',
    },
  }[condition];

  const isRainy = condition === 'hujan' || condition === 'badai';

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Dynamic Sun/Atmospheric Aura in the upper horizon */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[550px] rounded-full pointer-events-none transition-all duration-1000"
        style={{ background: theme.sunGlow }}
      />

      {/* Realistic Volumetric Cloud Layer 1: High-Altitude Atmospheric Drifting (Loop 80s) */}
      <div
        className="absolute top-2 -left-[600px] w-[2000px] h-64 opacity-85 animate-[cloudDrift_80s_linear_infinite]"
        style={{ filter: theme.filter }}
      >
        <svg viewBox="0 0 1400 300" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={`cloudLayer1Grad-${condition}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={theme.cloudTop} />
              <stop offset="55%" stopColor={theme.cloudMid} />
              <stop offset="100%" stopColor={theme.cloudBase} />
            </linearGradient>
          </defs>

          {/* Organic Cumulus Cloud Formations 1 */}
          <path
            d="M 100 220 C 60 220 30 190 40 155 C 30 120 60 90 95 95 C 115 55 165 45 195 75 C 230 40 295 45 320 80 C 355 70 395 105 385 145 C 425 155 435 210 390 220 Z"
            fill={`url(#cloudLayer1Grad-${condition})`}
          />
          {/* Organic Cumulus Cloud Formations 2 */}
          <path
            d="M 750 230 C 700 230 670 195 685 160 C 675 125 710 95 750 100 C 770 60 830 50 865 85 C 905 45 980 50 1010 90 C 1050 80 1095 115 1085 160 C 1130 170 1140 225 1090 230 Z"
            fill={`url(#cloudLayer1Grad-${condition})`}
          />
        </svg>
      </div>

      {/* Realistic Volumetric Cloud Layer 2: Mid-Level Billowing Fluff (Loop 55s) */}
      <div
        className="absolute top-16 -left-[500px] w-[1800px] h-72 animate-[cloudDrift_55s_linear_infinite]"
        style={{
          filter: theme.filter,
          animationDelay: '-22s',
        }}
      >
        <svg viewBox="0 0 1400 320" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={`cloudLayer2Grad-${condition}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={theme.cloudTop} />
              <stop offset="60%" stopColor={theme.cloudMid} />
              <stop offset="100%" stopColor={theme.cloudBase} />
            </linearGradient>
          </defs>

          <path
            d="M 320 240 C 260 240 220 200 235 155 C 220 110 265 70 310 80 C 335 35 405 25 445 65 C 495 20 575 25 610 75 C 660 65 715 110 700 165 C 750 180 760 235 705 240 Z"
            fill={`url(#cloudLayer2Grad-${condition})`}
          />
          <path
            d="M 980 230 C 930 230 895 195 910 155 C 895 115 935 80 975 90 C 1000 45 1065 40 1105 75 C 1150 35 1225 40 1255 85 C 1300 75 1350 115 1335 165 C 1380 180 1390 225 1345 230 Z"
            fill={`url(#cloudLayer2Grad-${condition})`}
          />
        </svg>
      </div>

      {/* Realistic Volumetric Cloud Layer 3: Foreground Billowy Clusters (Loop 38s) */}
      <div
        className="absolute top-32 -left-[400px] w-[1600px] h-80 animate-[cloudDrift_38s_linear_infinite]"
        style={{
          filter: theme.filter,
          animationDelay: '-12s',
        }}
      >
        <svg viewBox="0 0 1400 340" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id={`cloudLayer3Grad-${condition}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={theme.cloudTop} />
              <stop offset="70%" stopColor={theme.cloudMid} />
              <stop offset="100%" stopColor={theme.cloudBase} />
            </linearGradient>
          </defs>

          <path
            d="M 60 260 C 5 260 -25 210 -10 160 C -30 110 20 65 75 75 C 105 20 185 10 235 55 C 290 5 385 10 425 65 C 485 50 545 105 530 170 C 585 185 595 250 535 260 Z"
            fill={`url(#cloudLayer3Grad-${condition})`}
          />
          <path
            d="M 620 270 C 560 270 520 220 535 170 C 515 120 565 75 620 85 C 650 30 730 20 780 65 C 835 15 930 20 970 75 C 1030 60 1090 115 1075 180 C 1130 195 1140 260 1080 270 Z"
            fill={`url(#cloudLayer3Grad-${condition})`}
          />
        </svg>
      </div>

      {/* Realistic Diagonal Rain Streaks (Exactly as displayed in the user's right reference image) */}
      {isRainy && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-45">
          {/* Batch 1: Slanted Rain Streaks */}
          <div className="absolute -inset-10 animate-diagonal-rain">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="streakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="60%" stopColor="rgba(255, 255, 255, 0.7)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 255, 0.95)" />
                </linearGradient>
              </defs>
              {[
                { x: 40, y: 30, len: 45 },
                { x: 120, y: 15, len: 60 },
                { x: 210, y: 55, len: 50 },
                { x: 290, y: 20, len: 65 },
                { x: 380, y: 40, len: 45 },
                { x: 470, y: 10, len: 70 },
                { x: 560, y: 60, len: 55 },
                { x: 650, y: 25, len: 60 },
                { x: 740, y: 50, len: 50 },
                { x: 830, y: 15, len: 65 },
                { x: 920, y: 35, len: 55 },
                { x: 1010, y: 20, len: 70 },
                { x: 1100, y: 45, len: 50 },
                { x: 1200, y: 15, len: 65 },
              ].map((streak, i) => (
                <line
                  key={i}
                  x1={streak.x}
                  y1={streak.y}
                  x2={streak.x - 28}
                  y2={streak.y + streak.len}
                  stroke="url(#streakGrad)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              ))}
            </svg>
          </div>

          {/* Batch 2: Staggered Slanted Rain Streaks with Delay */}
          <div className="absolute -inset-10 animate-diagonal-rain [animation-delay:-0.7s]">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {[
                { x: 80, y: 80, len: 55 },
                { x: 160, y: 95, len: 65 },
                { x: 250, y: 70, len: 45 },
                { x: 330, y: 110, len: 60 },
                { x: 420, y: 85, len: 70 },
                { x: 510, y: 100, len: 50 },
                { x: 600, y: 75, len: 65 },
                { x: 690, y: 90, len: 55 },
                { x: 780, y: 115, len: 70 },
                { x: 870, y: 80, len: 45 },
                { x: 960, y: 105, len: 60 },
                { x: 1050, y: 70, len: 65 },
                { x: 1140, y: 95, len: 50 },
              ].map((streak, i) => (
                <line
                  key={i}
                  x1={streak.x}
                  y1={streak.y}
                  x2={streak.x - 28}
                  y2={streak.y + streak.len}
                  stroke="url(#streakGrad)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ))}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
