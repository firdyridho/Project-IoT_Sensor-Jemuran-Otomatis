import React from 'react';

interface WeatherIllustrationProps {
  condition: 'cerah' | 'gerimis' | 'hujan' | 'badai';
  className?: string;
}

export const WeatherIllustration: React.FC<WeatherIllustrationProps> = ({
  condition,
  className = 'w-48 h-32',
}) => {
  if (condition === 'cerah') {
    return (
      <div className={`relative flex items-center justify-center ${className}`} aria-label="Ilustrasi Cuaca Cerah">
        <svg viewBox="0 0 200 140" className="w-full h-full drop-shadow-lg">
          <defs>
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
              <stop offset="35%" stopColor="#fde047" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.8" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Sun Halo Glow */}
          <circle cx="95" cy="55" r="42" fill="url(#sunGlow)" filter="url(#softGlow)" className="animate-pulse" />

          {/* Rotating Sun Rays */}
          <g className="origin-[95px_55px] animate-[spin_24s_linear_infinite]" opacity="0.6">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <line
                key={angle}
                x1="95"
                y1="18"
                x2="95"
                y2="28"
                stroke="#f59e0b"
                strokeWidth="3.5"
                strokeLinecap="round"
                transform={`rotate(${angle} 95 55)`}
              />
            ))}
          </g>

          {/* Radiant Sun Disk */}
          <circle cx="95" cy="55" r="26" fill="#f59e0b" stroke="#fef08a" strokeWidth="2.5" />
          <circle cx="91" cy="51" r="10" fill="#fef9c3" opacity="0.6" />

          {/* Floating Soft Cloud 1 */}
          <g className="animate-[bounce_6s_ease-in-out_infinite]" transform="translate(10, 20)">
            <path
              d="M 50 85 C 50 72 62 62 76 64 C 82 52 98 48 110 56 C 118 46 136 48 144 60 C 158 60 168 70 166 84 C 166 94 156 100 144 100 L 58 100 C 48 100 44 92 50 85 Z"
              fill="url(#cloudGrad)"
              opacity="0.95"
            />
          </g>

          {/* Floating Foreground Cloud 2 */}
          <g className="animate-[bounce_7s_ease-in-out_infinite] [animation-delay:1.5s]" transform="translate(-15, 30)">
            <path
              d="M 30 75 C 30 65 40 58 52 60 C 58 50 72 46 82 54 C 88 46 104 48 110 58 C 122 58 130 66 128 78 C 128 86 120 92 110 92 L 38 92 C 30 92 26 84 30 75 Z"
              fill="#ffffff"
              opacity="0.85"
            />
          </g>
        </svg>
      </div>
    );
  }

  if (condition === 'gerimis') {
    return (
      <div className={`relative flex items-center justify-center ${className}`} aria-label="Ilustrasi Cuaca Gerimis">
        <svg viewBox="0 0 200 140" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="drizzleCloud" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="rainDropGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Ambient Mist Cloud */}
          <path
            d="M 35 60 C 35 44 50 32 68 35 C 76 20 98 16 114 26 C 124 14 148 16 158 32 C 176 32 188 46 186 64 C 186 78 172 86 156 86 L 46 86 C 32 86 28 74 35 60 Z"
            fill="url(#drizzleCloud)"
            opacity="0.9"
          />

          {/* Gentle Drizzle Droplets falling */}
          {[
            { cx: 55, cy: 96, delay: '0s' },
            { cx: 75, cy: 104, delay: '0.4s' },
            { cx: 95, cy: 98, delay: '0.8s' },
            { cx: 115, cy: 106, delay: '0.2s' },
            { cx: 135, cy: 100, delay: '0.6s' },
            { cx: 155, cy: 108, delay: '1s' },
          ].map((d, idx) => (
            <ellipse
              key={idx}
              cx={d.cx}
              cy={d.cy}
              rx="1.8"
              ry="4"
              fill="url(#rainDropGrad)"
              className="animate-[pulse_1.2s_ease-in-out_infinite]"
              style={{ animationDelay: d.delay }}
            />
          ))}
        </svg>
      </div>
    );
  }

  if (condition === 'hujan') {
    return (
      <div className={`relative flex items-center justify-center ${className}`} aria-label="Ilustrasi Cuaca Hujan">
        <svg viewBox="0 0 200 140" className="w-full h-full drop-shadow-xl">
          <defs>
            <linearGradient id="rainCloud" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="heavyDrop" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>

          {/* Deep Rain Cloud */}
          <path
            d="M 30 55 C 30 38 48 24 68 28 C 76 10 102 6 120 18 C 132 4 158 8 168 26 C 188 26 200 42 196 62 C 196 78 180 86 162 86 L 42 86 C 26 86 22 72 30 55 Z"
            fill="url(#rainCloud)"
          />

          {/* Slanted Rain Streaks */}
          {[
            { x1: 50, y1: 90, x2: 44, y2: 115 },
            { x1: 70, y1: 92, x2: 64, y2: 118 },
            { x1: 90, y1: 88, x2: 84, y2: 116 },
            { x1: 110, y1: 94, x2: 104, y2: 122 },
            { x1: 130, y1: 90, x2: 124, y2: 118 },
            { x1: 150, y1: 92, x2: 144, y2: 120 },
            { x1: 170, y1: 94, x2: 164, y2: 118 },
          ].map((r, i) => (
            <line
              key={i}
              x1={r.x1}
              y1={r.y1}
              x2={r.x2}
              y2={r.y2}
              stroke="url(#heavyDrop)"
              strokeWidth="2.8"
              strokeLinecap="round"
              className="animate-pulse"
              style={{ animationDuration: `${0.8 + (i % 3) * 0.2}s` }}
            />
          ))}
        </svg>
      </div>
    );
  }

  // Badai (Storm) with Lightning
  return (
    <div className={`relative flex items-center justify-center ${className}`} aria-label="Ilustrasi Cuaca Badai Petir">
      <svg viewBox="0 0 200 140" className="w-full h-full drop-shadow-2xl">
        <defs>
          <linearGradient id="stormCloud" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="60%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>
          <radialGradient id="lightningGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Storm Aura */}
        <ellipse cx="100" cy="50" rx="75" ry="40" fill="url(#lightningGlow)" className="animate-pulse" />

        {/* Dark Heavy Nimbus Cloud */}
        <path
          d="M 25 50 C 25 32 44 18 66 22 C 74 6 102 2 120 14 C 134 0 162 4 172 24 C 192 24 204 40 200 62 C 200 78 184 86 164 86 L 36 86 C 20 86 16 68 25 50 Z"
          fill="url(#stormCloud)"
          stroke="#4f46e5"
          strokeWidth="1"
        />

        {/* Stylized Electric Halilintar Bolt */}
        <g className="animate-[pulse_1s_ease-in-out_infinite]">
          <polygon
            points="105,65 92,90 102,90 88,124 116,84 103,84"
            fill="#facc15"
            stroke="#ffffff"
            strokeWidth="1.5"
            filter="drop-shadow(0 0 8px rgba(250, 204, 21, 0.9))"
          />
        </g>

        {/* Heavy Rain Streaks */}
        {[
          { x1: 45, y1: 90, x2: 38, y2: 120 },
          { x1: 65, y1: 92, x2: 58, y2: 122 },
          { x1: 130, y1: 90, x2: 123, y2: 120 },
          { x1: 155, y1: 94, x2: 148, y2: 124 },
          { x1: 175, y1: 92, x2: 168, y2: 120 },
        ].map((r, i) => (
          <line
            key={i}
            x1={r.x1}
            y1={r.y1}
            x2={r.x2}
            y2={r.y2}
            stroke="#818cf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="animate-pulse"
          />
        ))}
      </svg>
    </div>
  );
};
