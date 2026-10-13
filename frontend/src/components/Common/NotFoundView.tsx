import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Sun, Moon } from 'lucide-react';
import { StorageService } from '../../services/storage';

// Props
interface NotFoundViewProps {
  theme?: 'light' | 'dark' | 'system';
  isLoggedIn?: boolean;
  onGoHome?: () => void;
  onToggleTheme?: () => void;
}

// Resolve system theme to actual light/dark
function resolveTheme(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

// ---------------------------------------------------------------------------
// Radar canvas — 60fps imperative animation: sweep beam, blips, rain drops
// ---------------------------------------------------------------------------
interface RadarCanvasProps { isDark: boolean; }

const RadarCanvas: React.FC<RadarCanvasProps> = ({ isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const particlesRef = useRef<
    Array<{ x: number; y: number; len: number; speed: number; alpha: number; angle: number }>
  >([]);

  const spawnParticle = useCallback((cx: number, cy: number, r: number) => {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * r * 0.6;
    particlesRef.current.push({
      x: cx + Math.cos(a) * d,
      y: cy + Math.sin(a) * d,
      len: 4 + Math.random() * 8,
      speed: 0.5 + Math.random() * 0.7,
      alpha: 0.45 + Math.random() * 0.5,
      angle: Math.PI / 2 + (Math.random() - 0.5) * 0.4,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SIZE = 280;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const R = SIZE * 0.44;

    const blips = [
      { angle: 0.8,  dist: R * 0.55, life: 0, maxLife: 60 },
      { angle: 2.1,  dist: R * 0.3,  life: 0, maxLife: 80 },
      { angle: 4.5,  dist: R * 0.7,  life: 0, maxLife: 50 },
    ];

    let frame = 0;

    const draw = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      frame++;

      ctx.fillStyle = isDark ? '#070b14' : '#f0f9ff';
      ctx.fillRect(0, 0, SIZE, SIZE);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R + 2, 0, Math.PI * 2);
      ctx.clip();

      // Rings
      const rc = isDark ? 'rgba(34,211,238,0.16)' : 'rgba(8,145,178,0.13)';
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (R / 4) * i, 0, Math.PI * 2);
        ctx.strokeStyle = rc; ctx.lineWidth = 1; ctx.stroke();
      }

      // Crosshairs
      ctx.strokeStyle = isDark ? 'rgba(34,211,238,0.07)' : 'rgba(8,145,178,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
      ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx - R * 0.7, cy - R * 0.7); ctx.lineTo(cx + R * 0.7, cy + R * 0.7);
      ctx.moveTo(cx + R * 0.7, cy - R * 0.7); ctx.lineTo(cx - R * 0.7, cy + R * 0.7);
      ctx.stroke();

      // Sweep
      const sw = (elapsed * Math.PI * 1.3) % (Math.PI * 2);
      const tl = Math.PI * 0.5;
      const ts2 = 28;
      for (let i = 0; i < ts2; i++) {
        const t = i / ts2;
        const a0 = sw - tl * (1 - t);
        const a1 = sw - tl * (1 - (i + 1) / ts2);
        const al = t * (isDark ? 0.17 : 0.11);
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, a0, a1); ctx.closePath();
        ctx.fillStyle = isDark ? `rgba(34,211,238,${al})` : `rgba(8,145,178,${al})`;
        ctx.fill();
      }

      const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      sg.addColorStop(0, isDark ? 'rgba(34,211,238,0.55)' : 'rgba(8,145,178,0.5)');
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, sw - 0.04, sw + 0.01); ctx.closePath();
      ctx.fillStyle = sg; ctx.fill();

      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sw) * R, cy + Math.sin(sw) * R);
      ctx.strokeStyle = isDark ? '#22d3ee' : '#0891b2';
      ctx.lineWidth = 1.5; ctx.globalAlpha = 0.9; ctx.stroke(); ctx.globalAlpha = 1;

      // Blips
      blips.forEach(b => {
        const diff = (sw - b.angle + Math.PI * 2) % (Math.PI * 2);
        if (diff < 0.13) b.life = b.maxLife;
        if (b.life > 0) {
          const al = (b.life / b.maxLife) * (isDark ? 0.85 : 0.7);
          const bx = cx + Math.cos(b.angle) * b.dist;
          const by = cy + Math.sin(b.angle) * b.dist;
          const rp = 4 + (1 - b.life / b.maxLife) * 10;
          ctx.beginPath(); ctx.arc(bx, by, rp, 0, Math.PI * 2);
          ctx.strokeStyle = isDark ? `rgba(34,211,238,${al * 0.4})` : `rgba(8,145,178,${al * 0.35})`;
          ctx.lineWidth = 1; ctx.stroke();
          ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? `rgba(34,211,238,${al})` : `rgba(8,145,178,${al})`;
          ctx.fill();
          b.life = Math.max(0, b.life - 1);
        }
      });

      // Rain
      if (frame % 10 === 0 && particlesRef.current.length < 22) spawnParticle(cx, cy, R);
      particlesRef.current = particlesRef.current.filter(p => {
        p.y += p.speed; p.alpha -= 0.011;
        if (p.alpha <= 0 || p.y > cy + R) return false;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(p.angle) * p.len, p.y + Math.sin(p.angle) * p.len);
        ctx.strokeStyle = isDark ? `rgba(96,165,250,${p.alpha})` : `rgba(37,99,235,${p.alpha})`;
        ctx.lineWidth = 1.2; ctx.stroke();
        return true;
      });

      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#22d3ee' : '#0891b2'; ctx.fill();

      ctx.restore();

      ctx.beginPath(); ctx.arc(cx, cy, R + 1, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? 'rgba(34,211,238,0.32)' : 'rgba(8,145,178,0.28)';
      ctx.lineWidth = 1.5; ctx.stroke();

      for (let deg = 0; deg < 360; deg += 30) {
        const a = (deg * Math.PI) / 180;
        const mj = deg % 90 === 0;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (R + 3), cy + Math.sin(a) * (R + 3));
        ctx.lineTo(cx + Math.cos(a) * (R + (mj ? 10 : 6)), cy + Math.sin(a) * (R + (mj ? 10 : 6)));
        ctx.strokeStyle = isDark
          ? `rgba(34,211,238,${mj ? 0.45 : 0.18})`
          : `rgba(8,145,178,${mj ? 0.38 : 0.14})`;
        ctx.lineWidth = mj ? 1.5 : 1; ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      startRef.current = null;
      particlesRef.current = [];
    };
  }, [isDark, spawnParticle]);

  return <canvas ref={canvasRef} style={{ width: 280, height: 280 }} aria-hidden="true" />;
};

// ---------------------------------------------------------------------------
// Precision SVG Radar HUD & 404 Typography
// ---------------------------------------------------------------------------
const GLOBAL_STYLE = `
  @keyframes _crt_flicker {
    0%,4%,52%,98%,100% { opacity:1;    transform:skewX(0deg)    scaleY(1);     }
    2%                 { opacity:0.84; transform:skewX(-0.4deg) scaleY(1.002); }
    50%                { opacity:0.92; transform:skewX(0.3deg)  scaleY(0.999); }
    96%                { opacity:0.75; transform:skewX(-0.2deg) scaleY(1.001); }
  }
  @keyframes _signal_blink {
    0%,49%  { opacity:1;   }
    50%,100%{ opacity:0.2; }
  }
  @keyframes _float_up {
    0%,100% { transform:translateY(0px);  }
    50%     { transform:translateY(-6px); }
  }
  @keyframes _spin_slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes _spin_rev {
    from { transform: rotate(360deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes _sweep_in {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0);   }
  }
  @keyframes _radar_ping {
    0%   { r: 8px; opacity: 0.65; }
    50%  { opacity: 0.45; }
    100% { r: 125px; opacity: 0; }
  }
  ._ping1 { animation: _radar_ping 4s cubic-bezier(0,0,0.2,1) infinite; }
  ._ping2 { animation: _radar_ping 4s cubic-bezier(0,0,0.2,1) infinite 2s; }
  ._crt404 { animation:_crt_flicker 5.5s infinite; transform-origin: 140px 148px; }
  ._sigblink { animation:_signal_blink 1.1s step-end infinite; }
  ._float    { animation:_float_up 3.6s ease-in-out infinite; }
  ._spinslow { transform-origin: 140px 140px; animation: _spin_slow 28s linear infinite; }
  ._spinrev  { transform-origin: 140px 140px; animation: _spin_rev 40s linear infinite; }
  ._sin      { animation:_sweep_in 0.5s cubic-bezier(0.22,1,0.36,1) both; }
  ._d1 { animation-delay:0.06s; } ._d2 { animation-delay:0.16s; }
  ._d3 { animation-delay:0.26s; } ._d4 { animation-delay:0.38s; }
  ._d5 { animation-delay:0.50s; }
`;

interface RadarHudSvgProps {
  isDark: boolean;
}

const RadarHudSvg: React.FC<RadarHudSvgProps> = ({ isDark }) => {
  const accent = isDark ? '#22d3ee' : '#0891b2';
  const textGrad = isDark ? 'url(#rintikGradDark)' : 'url(#rintikGradLight)';

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <svg
        viewBox="0 0 280 280"
        width="280"
        height="280"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="rintikGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          <linearGradient id="rintikGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="60%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* Pulsing radar sonar waves */}
        <circle
          cx="140"
          cy="140"
          r="8"
          fill="none"
          stroke={accent}
          strokeWidth="1"
          className="_ping1"
        />
        <circle
          cx="140"
          cy="140"
          r="8"
          fill="none"
          stroke={accent}
          strokeWidth="1"
          className="_ping2"
        />

        {/* Outer rotating dashed circles */}
        <g className="_spinslow">
          <circle
            cx="140"
            cy="140"
            r="126"
            fill="none"
            stroke={accent}
            strokeWidth="1.2"
            strokeDasharray="6 14"
            opacity={isDark ? 0.45 : 0.35}
          />
          <circle
            cx="140"
            cy="140"
            r="92"
            fill="none"
            stroke={accent}
            strokeWidth="0.8"
            strokeDasharray="3 18"
            opacity={isDark ? 0.3 : 0.2}
          />
        </g>

        <g className="_spinrev">
          <circle
            cx="140"
            cy="140"
            r="114"
            fill="none"
            stroke={accent}
            strokeWidth="0.75"
            strokeDasharray="2 10"
            opacity={isDark ? 0.35 : 0.25}
          />
        </g>

        {/* Degree coordinate ticks */}
        {[
          { x: 140, y: 16, t: 'N 000°' },
          { x: 262, y: 143, t: 'E 090°' },
          { x: 140, y: 270, t: 'S 180°' },
          { x: 18, y: 143, t: 'W 270°' },
        ].map((pt, i) => (
          <text
            key={i}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            fontSize="6.5"
            fontFamily="monospace"
            fontWeight="bold"
            fill={accent}
            opacity={isDark ? 0.6 : 0.5}
            letterSpacing="0.5"
          >
            {pt.t}
          </text>
        ))}

        {/* Corner target HUD reticles */}
        <g opacity={isDark ? 0.45 : 0.35} stroke={accent} strokeWidth="1.5" fill="none">
          <path d="M 8 24 L 8 8 L 24 8" />
          <path d="M 272 24 L 272 8 L 256 8" />
          <path d="M 8 256 L 8 272 L 24 272" />
          <path d="M 272 256 L 272 272 L 256 272" />
        </g>

        {/* Center 404 block with CRT flicker and crisp vector typography */}
        <g className="_crt404">
          <text
            x="140"
            y="108"
            textAnchor="middle"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="700"
            letterSpacing="2.5"
            fill={accent}
            opacity={isDark ? 0.8 : 0.75}
          >
            TARGET_LOST // 0x404
          </text>

          <text
            x="140"
            y="166"
            textAnchor="middle"
            fontFamily="'Outfit', -apple-system, sans-serif"
            fontWeight="900"
            fontSize="72"
            letterSpacing="-3px"
            fill={textGrad}
            stroke={isDark ? 'rgba(34,211,238,0.75)' : 'rgba(8,145,178,0.45)'}
            strokeWidth={isDark ? '1.2' : '0.8'}
            style={{
              filter: isDark
                ? 'drop-shadow(0 0 12px rgba(34,211,238,0.55)) drop-shadow(0 4px 16px rgba(0,0,0,0.7))'
                : 'drop-shadow(0 2px 8px rgba(8,145,178,0.25))',
            }}
          >
            404
          </text>

          <text
            x="140"
            y="184"
            textAnchor="middle"
            fontSize="7.5"
            fontFamily="monospace"
            fontWeight="600"
            letterSpacing="2"
            fill={isDark ? '#94a3b8' : '#475569'}
            opacity="0.8"
          >
            OFFLINE / NO_TELEMETRY
          </text>
        </g>
      </svg>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export const NotFoundView: React.FC<NotFoundViewProps> = ({
  theme = 'dark',
  isLoggedIn = false,
  onGoHome,
  onToggleTheme,
}) => {
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>(theme);

  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  const isDark = resolveTheme(currentTheme) === 'dark';

  const handleToggleMode = () => {
    const nextTheme: 'light' | 'dark' = isDark ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    try {
      const cur = StorageService.getSettings();
      StorageService.saveSettings({ ...cur, tema: nextTheme });
    } catch {}
    if (onToggleTheme) {
      onToggleTheme();
    }
  };

  const handleHomeClick = () => {
    if (onGoHome) onGoHome();
    else navigate(isLoggedIn ? '/dashboard' : '/');
  };

  const handleBackClick = () => {
    if (window.history.length > 1) navigate(-1);
    else handleHomeClick();
  };

  // Theme-aware design tokens
  const bg          = isDark ? '#070b14'                 : '#f0f9ff';
  const txt         = isDark ? '#f1f5f9'                 : '#0f172a';
  const txtSec      = isDark ? '#94a3b8'                 : '#475569';
  const txtMuted    = isDark ? '#475569'                 : '#94a3b8';
  const accent      = isDark ? '#22d3ee'                 : '#0891b2';
  const border      = isDark ? 'rgba(34,211,238,0.14)'   : 'rgba(8,145,178,0.18)';
  const secBg       = isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(15,23,42,0.06)';
  const secBorder   = isDark ? 'rgba(255,255,255,0.10)'  : 'rgba(15,23,42,0.12)';
  const secTxt      = isDark ? '#cbd5e1'                 : '#334155';

  const hoverSecBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)';

  return (
    <div style={{
      minHeight: '100dvh', background: bg, color: txt,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden', padding: '24px 16px',
      fontFamily: "'Inter',system-ui,sans-serif",
      WebkitFontSmoothing: 'antialiased', userSelect: 'none',
    }}>

      {/* Background ambient */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 380, borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(ellipse,rgba(34,211,238,0.06) 0%,transparent 70%)'
            : 'radial-gradient(ellipse,rgba(8,145,178,0.07) 0%,transparent 70%)',
          filter: 'blur(48px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '8%', right: '4%', width: 380, height: 280, borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(ellipse,rgba(99,102,241,0.07) 0%,transparent 70%)'
            : 'radial-gradient(ellipse,rgba(99,102,241,0.05) 0%,transparent 70%)',
          filter: 'blur(52px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: isDark
            ? 'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)'
            : 'radial-gradient(circle,rgba(15,23,42,0.06) 1px,transparent 1px)',
          backgroundSize: '28px 28px', opacity: 0.75,
        }} />
      </div>

      {/* Top bar */}
      <header className="_sin" style={{
        position: 'relative', zIndex: 10, width: '100%', maxWidth: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div
          onClick={handleHomeClick}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'transform 0.18s' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <img
            src="/favicon.svg?v=2" alt="Rintik Logo"
            style={{
              width: 36, height: 36, borderRadius: 10,
              boxShadow: isDark ? '0 4px 16px rgba(79,70,229,0.4)' : '0 4px 12px rgba(79,70,229,0.2)',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: '0.06em', color: txt, lineHeight: 1.1 }}>
              RINTIK
            </span>
            <span style={{ fontSize: 10, color: txtMuted, fontWeight: 500 }}>IoT Jemuran Otomatis</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleToggleMode}
            title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            aria-label="Toggle theme"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10,
              background: secBg, border: `1px solid ${secBorder}`,
              color: secTxt, cursor: 'pointer',
              backdropFilter: 'blur(8px)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = hoverSecBg)}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = secBg)}
            onMouseDown={e  => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.93)')}
            onMouseUp={e    => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            onClick={handleHomeClick}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              background: secBg, border: `1px solid ${secBorder}`,
              color: secTxt, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              backdropFilter: 'blur(8px)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = hoverSecBg)}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = secBg)}
            onMouseDown={e  => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)')}
            onMouseUp={e    => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
          >
            <Home size={14} />
            <span>{isLoggedIn ? 'Dashboard' : 'Beranda'}</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        width: '100%', maxWidth: 520, margin: 'auto', padding: '16px 0',
      }}>

        {/* Radar + 404 */}
        <div className="_sin _d1 _float" style={{ position: 'relative', marginBottom: 24 }}>
          <div style={{
            width: 280, height: 280, borderRadius: '50%', overflow: 'hidden', position: 'relative',
            boxShadow: isDark
              ? '0 0 0 1px rgba(34,211,238,0.18),0 0 70px rgba(34,211,238,0.07),0 20px 60px rgba(0,0,0,0.55)'
              : '0 0 0 1px rgba(8,145,178,0.18),0 0 40px rgba(8,145,178,0.05),0 12px 40px rgba(15,23,42,0.12)',
          }}>
            <RadarCanvas isDark={isDark} />
            <RadarHudSvg isDark={isDark} />
          </div>
          <div aria-hidden="true" style={{
            position: 'absolute', inset: -14, borderRadius: '50%',
            border: `1px dashed ${isDark ? 'rgba(34,211,238,0.1)' : 'rgba(8,145,178,0.12)'}`,
          }} />
        </div>

        {/* Headline */}
        <h1 className="_sin _d2" style={{
          fontFamily: "'Outfit',sans-serif", fontWeight: 900,
          fontSize: 'clamp(22px,5vw,27px)', color: txt,
          letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 10,
        }}>
          Halaman di Luar Jangkauan
        </h1>

        {/* Body */}
        <p className="_sin _d3" style={{ fontSize: 13, color: txtSec, lineHeight: 1.65, maxWidth: 360, marginBottom: 28 }}>
          Halaman yang Anda tuju tidak tercatat pada sistem IoT Rintik. Tautan mungkin telah dipindahkan, dihapus, atau URL yang dimasukkan tidak tepat.
        </p>

        {/* CTA */}
        <div className="_sin _d4" style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
          <button
            onClick={handleHomeClick}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 24px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg,#2563eb 0%,#4f46e5 100%)',
              color: '#ffffff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(79,70,229,0.33)', transition: 'all 0.18s', letterSpacing: '0.01em',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 7px 28px rgba(79,70,229,0.44)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(79,70,229,0.33)';
            }}
            onMouseDown={e  => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)')}
            onMouseUp={e    => ((e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)')}
          >
            <Home size={15} />
            {isLoggedIn ? 'Kembali ke Dashboard' : 'Kembali ke Beranda'}
          </button>

          <button
            onClick={handleBackClick}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 14,
              background: secBg, border: `1px solid ${secBorder}`,
              color: secTxt, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              backdropFilter: 'blur(8px)', transition: 'all 0.18s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = hoverSecBg)}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = secBg)}
            onMouseDown={e  => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)')}
            onMouseUp={e    => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
          >
            <ArrowLeft size={15} />
            Halaman Sebelumnya
          </button>
        </div>

        {/* Technical strip */}
        <div className="_sin _d5" style={{
          marginTop: 24, padding: '9px 16px', borderRadius: 10,
          background: isDark ? 'rgba(34,211,238,0.04)' : 'rgba(8,145,178,0.04)',
          border: `1px solid ${border}`,
          width: '100%', maxWidth: 320,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        }}>
          {[['HTTP','404'],['STATUS','NOT_FOUND'],['SIGNAL','LOST']].map(([label, value], i) => (
            <div key={label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '4px 8px',
              borderRight: i < 2 ? `1px solid ${border}` : 'none',
            }}>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: txtMuted, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 2 }}>
                {label}
              </span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: accent, letterSpacing: '0.05em' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="_sin _d5" style={{ position: 'relative', zIndex: 10, textAlign: 'center', fontSize: 11, color: txtMuted }}>
        <p>{'\u00a9 2026 Rintik \u2022 Presisi Deteksi Hujan & Proteksi Jemuran'}</p>
      </footer>
    </div>
  );
};
