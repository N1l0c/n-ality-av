// hooks/useInteractionHandlers.ts
import { useEffect } from 'react';
import { drawVisuals } from '../canvas/drawVisuals';
// import { mapRange } from '../utils/mapRange';
import { snapTo12TET } from '../utils/snapTo12TET';
import * as Tone from 'tone';

type Mode = 'interference beats' | 'waves';

export const useInteractionHandlers = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  osc2Ref: React.RefObject<Tone.Oscillator | null>,
  osc3Ref: React.RefObject<Tone.Oscillator | null>,
  mode: Mode,
  snapToGrid: boolean,
  micAnalyser?: Tone.Analyser | null
) => {
  useEffect(() => {
    let lastFreqX = 220;
    let lastFreqY = 220;
    let animationFrameId: number;

    const updateFromPosition = (x: number, y: number) => {
      if (!osc2Ref.current || !osc3Ref.current) return;

      // Log scale frequency mapping (range: 55Hz to 1760Hz)
      const minFreq = 55;   // A1
      const maxFreq = 1760; // A6
      
      // Convert to log scale
      const logMin = Math.log(minFreq);
      const logMax = Math.log(maxFreq);
      
      // Map x position to frequency logarithmically
      const xScale = x / window.innerWidth;
      let freqX = Math.exp(logMin + (logMax - logMin) * xScale);
      
      // Map y position to frequency logarithmically (inverted)
      const yScale = 1 - (y / window.innerHeight);
      let freqY = Math.exp(logMin + (logMax - logMin) * yScale);

      if (snapToGrid) {
        freqX = snapTo12TET(freqX);
        freqY = snapTo12TET(freqY);
      }

      lastFreqX = freqX;
      lastFreqY = freqY;

      osc2Ref.current.frequency.value = freqX;
      osc3Ref.current.frequency.value = freqY;
    };

    const updateFrame = () => {
      if (!canvasRef.current) return;

      let micData: Float32Array | undefined;
      if (micAnalyser) {
        const buffer = micAnalyser.getValue();
        if (buffer instanceof Float32Array) {
          micData = buffer;
        }
      }

      drawVisuals(canvasRef.current, lastFreqX, lastFreqY, mode, micData);
      animationFrameId = requestAnimationFrame(updateFrame);
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

    // Initial setup
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('resize', handleResize);
    handleResize();
    animationFrameId = requestAnimationFrame(updateFrame);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, snapToGrid, micAnalyser, canvasRef, osc2Ref, osc3Ref]);
};
