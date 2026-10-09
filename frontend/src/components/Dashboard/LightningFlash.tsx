import React, { useEffect, useState, useCallback } from 'react';
import { weatherAudio } from '../../services/weatherAudio';

interface LightningFlashProps {
  active: boolean;
}

interface BoltPath {
  id: number;
  d: string;
}

export const LightningFlash: React.FC<LightningFlashProps> = ({ active }) => {
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [bolts, setBolts] = useState<BoltPath[]>([]);

  const generateBolt = useCallback((): string => {
    const startX = 20 + Math.random() * 60; // percentage
    let currentX = startX;
    let currentY = 0;
    let path = `M ${currentX} ${currentY}`;

    const segments = 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i < segments; i++) {
      const stepY = (100 / segments) * (0.8 + Math.random() * 0.4);
      currentY = Math.min(100, currentY + stepY);
      currentX += (Math.random() - 0.5) * 16;
      path += ` L ${currentX} ${currentY}`;

      // Optional mini fork
      if (Math.random() < 0.4 && i > 1) {
        const forkX = currentX + (Math.random() - 0.5) * 12;
        const forkY = currentY + stepY * 0.6;
        path += ` M ${currentX} ${currentY} L ${forkX} ${forkY} M ${currentX} ${currentY}`;
      }
    }
    return path;
  }, []);

  const triggerLightning = useCallback(() => {
    // Generate 1-2 lightning bolt paths
    const newBolts: BoltPath[] = [
      { id: Date.now(), d: generateBolt() },
    ];
    if (Math.random() < 0.35) {
      newBolts.push({ id: Date.now() + 1, d: generateBolt() });
    }
    setBolts(newBolts);

    // Initial sharp flash
    setFlashOpacity(0.9);

    // Synchronous thunder rumble sound
    weatherAudio.triggerThunder();

    // Strobe / double flash effect common in lightning
    setTimeout(() => {
      setFlashOpacity(0.2);
      setTimeout(() => {
        setFlashOpacity(0.7);
        setTimeout(() => {
          setFlashOpacity(0);
          setBolts([]);
        }, 120);
      }, 70);
    }, 90);
  }, [generateBolt]);

  useEffect(() => {
    if (!active) {
      setFlashOpacity(0);
      setBolts([]);
      return;
    }

    // Trigger first lightning quickly
    const initialTimer = setTimeout(() => {
      triggerLightning();
    }, 1500);

    // Then schedule recurring lightning
    let timeoutId: number;
    const scheduleNext = () => {
      const nextDelay = 5000 + Math.random() * 7000; // between 5 - 12 seconds
      timeoutId = window.setTimeout(() => {
        triggerLightning();
        scheduleNext();
      }, nextDelay);
    };

    scheduleNext();

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(timeoutId);
    };
  }, [active, triggerLightning]);

  if (!active && flashOpacity === 0 && bolts.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden="true">
      {/* Sky Ambient Screen Flash */}
      <div
        className="absolute inset-0 bg-white transition-opacity duration-75"
        style={{
          opacity: flashOpacity * 0.65,
          mixBlendMode: 'screen',
        }}
      />

      {/* Blue-violet electric tint */}
      <div
        className="absolute inset-0 bg-indigo-500 transition-opacity duration-100"
        style={{
          opacity: flashOpacity * 0.35,
          mixBlendMode: 'color-dodge',
        }}
      />

      {/* Branching Lightning Bolt SVGs */}
      {bolts.length > 0 && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          style={{
            filter: 'drop-shadow(0 0 12px rgba(186, 230, 253, 0.9)) drop-shadow(0 0 24px rgba(129, 140, 248, 0.7))',
          }}
        >
          {bolts.map((b) => (
            <React.Fragment key={b.id}>
              {/* Outer bright electric glow */}
              <path
                d={b.d}
                fill="none"
                stroke="rgba(147, 197, 253, 0.9)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="miter"
              />
              {/* White-hot lightning core */}
              <path
                d={b.d}
                fill="none"
                stroke="#ffffff"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="miter"
              />
            </React.Fragment>
          ))}
        </svg>
      )}
    </div>
  );
};
