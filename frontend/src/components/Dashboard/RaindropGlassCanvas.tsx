import React, { useEffect, useRef } from 'react';

interface RaindropGlassCanvasProps {
  condition: 'cerah' | 'gerimis' | 'hujan' | 'badai';
}

interface Drop {
  x: number;
  y: number;
  r: number; // radius
  vy: number; // vertical speed
  vx: number;
  isDripping: boolean;
  trail: { x: number; y: number; r: number; alpha: number }[];
  life: number;
}

export const RaindropGlassCanvas: React.FC<RaindropGlassCanvasProps> = ({ condition }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    if (condition === 'cerah') {
      ctx.clearRect(0, 0, width, height);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    const drops: Drop[] = [];
    const maxDrops = condition === 'gerimis' ? 45 : condition === 'hujan' ? 100 : 160;
    const dripProbability = condition === 'gerimis' ? 0.005 : condition === 'hujan' ? 0.02 : 0.05;

    // Seed initial droplets on the glass
    const initialCount = Math.floor(maxDrops * 0.7);
    for (let i = 0; i < initialCount; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1.5 + Math.random() * 3.5,
        vy: 0,
        vx: 0,
        isDripping: Math.random() < 0.15,
        trail: [],
        life: 0.8 + Math.random() * 0.2,
      });
    }

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Spawn new droplets periodically
      if (drops.length < maxDrops && Math.random() < (condition === 'gerimis' ? 0.15 : 0.4)) {
        drops.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.6),
          r: 1.2 + Math.random() * 3.2,
          vy: 0,
          vx: 0,
          isDripping: false,
          trail: [],
          life: 1,
        });
      }

      // Update & Draw Droplets
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];

        // Random chance for static drop to start sliding down the window pane
        if (!d.isDripping && Math.random() < dripProbability) {
          d.isDripping = true;
          d.vy = 20 + Math.random() * 40; // initial slide speed
        }

        if (d.isDripping) {
          // Increase speed and slightly grow as water gathers
          d.vy += (condition === 'badai' ? 120 : 75) * dt;
          d.y += d.vy * dt;
          d.x += Math.sin(d.y * 0.04) * 0.3; // natural subtle meandering

          // Add water trail droplet
          if (Math.random() < 0.35) {
            d.trail.push({
              x: d.x,
              y: d.y - d.r,
              r: Math.max(0.6, d.r * 0.35),
              alpha: 0.45,
            });
          }

          // Remove if fell below viewport
          if (d.y > height + 20) {
            drops.splice(i, 1);
            continue;
          }
        }

        // Render Water Trail
        for (let t = d.trail.length - 1; t >= 0; t--) {
          const tr = d.trail[t];
          tr.alpha -= 0.15 * dt; // slowly dry out

          if (tr.alpha <= 0.01) {
            d.trail.splice(t, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 230, 255, ${tr.alpha * 0.4})`;
          ctx.fill();
        }

        // Render Realistic Glass Droplet (Convex lens effect with specular glare)
        ctx.save();
        ctx.translate(d.x, d.y);

        // 1. Soft droplet shadow (bottom-right)
        ctx.beginPath();
        ctx.arc(0.7, 0.7, d.r + 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
        ctx.fill();

        // 2. Water body with delicate refraction
        ctx.beginPath();
        ctx.arc(0, 0, d.r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(-d.r * 0.3, -d.r * 0.3, 0.2, 0, 0, d.r);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
        grad.addColorStop(0.4, 'rgba(186, 230, 253, 0.3)');
        grad.addColorStop(0.85, 'rgba(56, 189, 248, 0.2)');
        grad.addColorStop(1, 'rgba(14, 116, 144, 0.45)');
        ctx.fillStyle = grad;
        ctx.fill();

        // 3. Crisp specular white highlight (top-left glare on curved glass bead)
        ctx.beginPath();
        ctx.arc(-d.r * 0.35, -d.r * 0.35, Math.max(0.5, d.r * 0.28), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fill();

        // 4. Secondary micro specular gleam (bottom-right inner rim)
        ctx.beginPath();
        ctx.arc(d.r * 0.25, d.r * 0.25, Math.max(0.3, d.r * 0.16), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [condition]);

  if (condition === 'cerah') return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      style={{
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
      }}
      aria-hidden="true"
    />
  );
};
