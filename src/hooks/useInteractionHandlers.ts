// ✅ STEP 4: hooks/useInteractionHandlers.ts
import { useEffect } from 'react';
import { drawVisuals } from '../canvas/drawVisuals';
import { mapRange } from '../utils/mapRange';
import { snapTo12TET } from '../utils/snapTo12TET';
import * as Tone from 'tone';

type Mode = 'interference beats' | 'waves';

export const useInteractionHandlers = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  osc2Ref: React.MutableRefObject<Tone.Oscillator | null>,
  osc3Ref: React.MutableRefObject<Tone.Oscillator | null>,
  mode: Mode,
  snapToGrid: boolean
) => {
  useEffect(() => {
    const updateFromPosition = (x: number, y: number) => {
      if (!osc2Ref.current || !osc3Ref.current || !canvasRef.current) return;

      let freqX = mapRange(x, 0, window.innerWidth, 110, 880);
      let freqY = mapRange(y, 0, window.innerHeight, 880, 110);

      if (snapToGrid) {
        freqX = snapTo12TET(freqX);
        freqY = snapTo12TET(freqY);
      }

      osc2Ref.current.frequency.value = freqX;
      osc3Ref.current.frequency.value = freqY;

      drawVisuals(canvasRef.current, freqX, freqY, mode);
    };

    const handleMouseMove = (e: MouseEvent) => {
      updateFromPosition(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        const touch = e.touches[0];
        updateFromPosition(touch.clientX, touch.clientY);
      }
    };

    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      updateFromPosition(window.innerWidth / 2, window.innerHeight / 2);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('resize', handleResize);

    handleResize();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [mode, snapToGrid]); // ← Ensure hook re-runs when mode or snap changes
};

