import React from 'react';

export type IllustrationCondition = 'cerah' | 'mendung' | 'gerimis' | 'badai' | 'hujan';

interface WeatherIllustrationProps {
  condition: IllustrationCondition;
  className?: string;
}

export const WeatherIllustration: React.FC<WeatherIllustrationProps> = ({
  condition,
  className = 'w-48 h-32',
}) => {
  // 1. CUACA CERAH: 3D Glossy Sun Sphere + 3D Fluffy Cloud with Specular Highlights
  if (condition === 'cerah') {
    return (
      <div className={`relative flex items-center justify-center ${className}`} aria-label="Ilustrasi Cuaca Cerah 3D">
        <svg viewBox="0 0 220 160" className="w-full h-full drop-shadow-2xl overflow-visible">
          <defs>
            {/* 3D Sun Sphere Radial Lighting */}
            <radialGradient id="sun3dSphere" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#9a3412" />
            </radialGradient>

            {/* Sun Ambient Corona */}
            <radialGradient id="sunCorona" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>

            {/* 3D Puffy Cloud Shading */}
            <radialGradient id="cloudPuff3D" cx="38%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#f8fafc" />
              <stop offset="75%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </radialGradient>

            {/* Cloud Front Specular */}
            <linearGradient id="cloudSpecular" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Soft Ambient Shadow Filter */}
            <filter id="soft3DShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#78350f" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Sun Corona Halo Glow */}
          <circle cx="140" cy="65" r="46" fill="url(#sunCorona)" className="animate-pulse" />

          {/* 3D Sun Sphere */}
          <g className="origin-[140px_65px] animate-[pulse_4s_ease-in-out_infinite]">
            <circle cx="140" cy="65" r="32" fill="url(#sun3dSphere)" filter="url(#soft3DShadow)" />
            {/* Top-Left Sun Glass Highlight */}
            <ellipse
              cx="130"
              cy="52"
              rx="15"
              ry="9"
              fill="#ffffff"
              opacity="0.75"
              transform="rotate(-25 130 52)"
            />
            {/* Bottom-Right Warm Ambient Rim */}
            <ellipse
              cx="148"
              cy="78"
              rx="16"
              ry="7"
              fill="#fbbf24"
              opacity="0.4"
              transform="rotate(-25 148 78)"
            />
          </g>

          {/* 3D Volumetric Cloud Foreground */}
          <g className="animate-[bounce_6s_ease-in-out_infinite]" transform="translate(10, 15)">
            <circle cx="58" cy="98" r="26" fill="url(#cloudPuff3D)" />
            <circle cx="82" cy="78" r="32" fill="url(#cloudPuff3D)" />
            <circle cx="118" cy="84" r="28" fill="url(#cloudPuff3D)" />
            <circle cx="142" cy="100" r="24" fill="url(#cloudPuff3D)" />
            <rect x="58" y="94" width="84" height="28" rx="14" fill="url(#cloudPuff3D)" />

            <path
              d="M 62 76 C 72 62 94 58 108 68 C 118 64 130 68 136 78"
              stroke="url(#cloudSpecular)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
            <ellipse cx="80" cy="68" rx="14" ry="6" fill="#ffffff" opacity="0.65" transform="rotate(-15 80 68)" />
          </g>
        </svg>
      </div>
    );
  }

  // 2. CUACA MENDUNG: 3D Awan Mendung Puffy Abu-Abu Tanpa Air Hujan di Bawahnya!
  if (condition === 'mendung') {
    return (
      <div className={`relative flex items-center justify-center ${className}`} aria-label="Ilustrasi Cuaca Mendung 3D">
        <svg viewBox="0 0 220 160" className="w-full h-full drop-shadow-2xl overflow-visible">
          <defs>
            {/* 3D Cool Gray Overcast Cloud Gradient */}
            <radialGradient id="overcastCloud3D" cx="38%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="30%" stopColor="#e2e8f0" />
              <stop offset="65%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </radialGradient>

            <linearGradient id="overcastSpecular" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 3D Overcast Cloud Base (TIDAK ADA TETESAN AIR DI BAWAHNYA) */}
          <g className="animate-[bounce_7s_ease-in-out_infinite]" transform="translate(18, 20)">
            <circle cx="56" cy="88" r="28" fill="url(#overcastCloud3D)" />
            <circle cx="88" cy="62" r="36" fill="url(#overcastCloud3D)" />
            <circle cx="128" cy="70" r="30" fill="url(#overcastCloud3D)" />
            <circle cx="152" cy="88" r="24" fill="url(#overcastCloud3D)" />
            <rect x="56" y="82" width="96" height="30" rx="15" fill="url(#overcastCloud3D)" />

            {/* Specular curved highlights on top */}
            <ellipse cx="86" cy="50" rx="18" ry="7" fill="#ffffff" opacity="0.75" transform="rotate(-8 86 50)" />
            <ellipse cx="126" cy="58" rx="14" ry="6" fill="#ffffff" opacity="0.6" transform="rotate(-12 126 58)" />
          </g>
        </svg>
      </div>
    );
  }

  // 3. CUACA GERIMIS: 3D Cool Gray Cloud + 3D Glossy Sky-Blue Droplets
  if (condition === 'gerimis') {
    return (
      <div className={`relative flex items-center justify-center ${className}`} aria-label="Ilustrasi Cuaca Gerimis 3D">
        <svg viewBox="0 0 220 160" className="w-full h-full drop-shadow-2xl overflow-visible">
          <defs>
            <radialGradient id="drizzleCloud3D" cx="38%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="35%" stopColor="#cbd5e1" />
              <stop offset="70%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </radialGradient>

            <radialGradient id="drizzleDrop3D" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#7dd3fc" />
              <stop offset="65%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </radialGradient>
          </defs>

          {/* 3D Cloud Base */}
          <g className="animate-[bounce_7s_ease-in-out_infinite]" transform="translate(15, 10)">
            <circle cx="62" cy="78" r="26" fill="url(#drizzleCloud3D)" />
            <circle cx="92" cy="56" r="34" fill="url(#drizzleCloud3D)" />
            <circle cx="130" cy="64" r="28" fill="url(#drizzleCloud3D)" />
            <circle cx="152" cy="80" r="22" fill="url(#drizzleCloud3D)" />
            <rect x="62" y="74" width="90" height="28" rx="14" fill="url(#drizzleCloud3D)" />

            <ellipse cx="90" cy="46" rx="16" ry="6" fill="#ffffff" opacity="0.6" transform="rotate(-10 90 46)" />
          </g>

          {/* 3D Glossy Droplets Falling Below */}
          {[
            { cx: 75, cy: 118, delay: '0s', dur: '1.4s' },
            { cx: 105, cy: 126, delay: '0.4s', dur: '1.2s' },
            { cx: 135, cy: 120, delay: '0.8s', dur: '1.5s' },
            { cx: 160, cy: 128, delay: '0.2s', dur: '1.3s' },
          ].map((d, i) => (
            <g
              key={i}
              className="animate-[pulse_1.5s_ease-in-out_infinite]"
              style={{ animationDelay: d.delay, animationDuration: d.dur }}
            >
              <ellipse cx={d.cx} cy={d.cy} rx="4" ry="7" fill="url(#drizzleDrop3D)" />
              <ellipse cx={d.cx - 1.2} cy={d.cy - 2.5} rx="1.5" ry="2.5" fill="#ffffff" opacity="0.9" />
            </g>
          ))}
        </svg>
      </div>
    );
  }

  // 4. CUACA HUJAN LEBAT (JIKA DIAKSES): 3D Slate Storm Cloud + Glossy Cyan Raindrops
  if (condition === 'hujan') {
    return (
      <div className={`relative flex items-center justify-center ${className}`} aria-label="Ilustrasi Cuaca Hujan 3D">
        <svg viewBox="0 0 220 160" className="w-full h-full drop-shadow-2xl overflow-visible">
          <defs>
            <radialGradient id="rainCloud3D" cx="38%" cy="26%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#e2e8f0" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </radialGradient>

            <radialGradient id="rainDropGloss3D" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#38bdf8" />
              <stop offset="65%" stopColor="#0284c7" />
              <stop offset="90%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#075985" />
            </radialGradient>

            <filter id="dropGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0284c7" floodOpacity="0.5" />
            </filter>
          </defs>

          <g className="animate-[bounce_6s_ease-in-out_infinite]" transform="translate(12, 8)">
            <circle cx="64" cy="74" r="28" fill="url(#rainCloud3D)" />
            <circle cx="98" cy="52" r="36" fill="url(#rainCloud3D)" />
            <circle cx="138" cy="62" r="30" fill="url(#rainCloud3D)" />
            <circle cx="162" cy="78" r="24" fill="url(#rainCloud3D)" />
            <rect x="64" y="70" width="98" height="30" rx="15" fill="url(#rainCloud3D)" />

            <ellipse cx="94" cy="42" rx="18" ry="7" fill="#ffffff" opacity="0.8" transform="rotate(-8 94 42)" />
            <ellipse cx="134" cy="52" rx="14" ry="5" fill="#ffffff" opacity="0.65" transform="rotate(-12 134 52)" />
          </g>

          {[
            { x: 80, y: 116, delay: '0s' },
            { x: 104, y: 124, delay: '0.3s' },
            { x: 128, y: 114, delay: '0.6s' },
            { x: 152, y: 126, delay: '0.15s' },
            { x: 174, y: 118, delay: '0.45s' },
          ].map((drop, idx) => (
            <g
              key={idx}
              className="animate-[pulse_1.2s_ease-in-out_infinite]"
              style={{ animationDelay: drop.delay }}
            >
              <g transform={`translate(${drop.x}, ${drop.y}) rotate(-25)`} filter="url(#dropGlow)">
                <rect x="-3" y="-9" width="6" height="18" rx="3" fill="url(#rainDropGloss3D)" />
                <ellipse cx="-1" cy="-6" rx="1.5" ry="3" fill="#ffffff" opacity="0.95" />
              </g>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  // 5. CUACA BADAI / HALILINTAR: 3D Heavy Storm Cloud + 3D Faceted Lightning Bolt + Hint of Purple
  return (
    <div className={`relative flex items-center justify-center ${className}`} aria-label="Ilustrasi Cuaca Badai 3D">
      <svg viewBox="0 0 220 160" className="w-full h-full drop-shadow-2xl overflow-visible">
        <defs>
          <radialGradient id="stormCloud3D" cx="38%" cy="26%" r="65%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="35%" stopColor="#475569" />
            <stop offset="70%" stopColor="#312e81" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </radialGradient>

          <linearGradient id="lightningBolt3D" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#facc15" />
            <stop offset="80%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          <filter id="lightningAura" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="110" cy="70" r="50" fill="rgba(192, 132, 252, 0.35)" filter="url(#lightningAura)" className="animate-pulse" />

        <g className="animate-[bounce_6s_ease-in-out_infinite]" transform="translate(12, 6)">
          <circle cx="62" cy="72" r="28" fill="url(#stormCloud3D)" />
          <circle cx="98" cy="50" r="36" fill="url(#stormCloud3D)" />
          <circle cx="138" cy="60" r="30" fill="url(#stormCloud3D)" />
          <circle cx="162" cy="76" r="24" fill="url(#stormCloud3D)" />
          <rect x="62" y="68" width="100" height="30" rx="15" fill="url(#stormCloud3D)" />

          <ellipse cx="94" cy="40" rx="16" ry="6" fill="#c084fc" opacity="0.6" transform="rotate(-8 94 40)" />
        </g>

        <g className="animate-[pulse_0.9s_ease-in-out_infinite]" filter="url(#lightningAura)">
          <polygon
            points="114,68 100,96 112,96 96,134 126,88 112,88"
            fill="url(#lightningBolt3D)"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
        </g>

        {[
          { x: 68, y: 118 },
          { x: 148, y: 114 },
          { x: 172, y: 122 },
        ].map((drop, idx) => (
          <g key={idx} transform={`translate(${drop.x}, ${drop.y}) rotate(-25)`} className="animate-pulse">
            <rect x="-2.5" y="-8" width="5" height="16" rx="2.5" fill="#818cf8" />
            <ellipse cx="-0.8" cy="-5" rx="1" ry="2" fill="#ffffff" opacity="0.9" />
          </g>
        ))}
      </svg>
    </div>
  );
};
