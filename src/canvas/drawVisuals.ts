// canvas/drawVisuals.ts
import * as Tone from 'tone';
import { mapRange } from '../utils/mapRange';

type VisualizationMode = 'interference beats' | 'waves';
type Analysis = { rms: number; isOnset: boolean; spectralCentroid: number };

let animationFrameId: number | undefined;

// Keep logMap as a pure utility function
const logMap = (value: number, min: number, max: number, outMin: number, outMax: number): number => {
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const scale = (Math.log(value) - logMin) / (logMax - logMin);
  return outMin + scale * (outMax - outMin);
};

export const drawVisuals = (
  canvas: HTMLCanvasElement,
  freqX: number,
  freqY: number,
  mode: VisualizationMode,
  micData?: Float32Array,
  analysis?: Analysis
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear any existing animation
  if (animationFrameId !== undefined) {
    cancelAnimationFrame(animationFrameId);
  }

  const animate = () => {
    // Clear and fill background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Base frequencies and phase
    const baseFreq = 220;
    const [f1, f2, f3] = [baseFreq, freqX, freqY];
    const phase = (performance.now() / 1000) * 2 * Math.PI;
    const amplitude = canvas.height / 6;

    // Calculate beat frequencies
    const b12 = Math.abs(f1 - f2);
    const b13 = Math.abs(f1 - f3);
    const b23 = Math.abs(f2 - f3);

    const beatPulse = Math.sin(phase * b12) + Math.sin(phase * b13) + Math.sin(phase * b23);
    const normalizedPulse = (beatPulse + 3) / 6;
    const pulse = 1 + normalizedPulse * 4;
    const compositeBeat = (b12 + b13 + b23) / 3;
    const hue = mapRange(compositeBeat, 0, 20, 200, 360);

    // Main rendering loop
    for (let x = 0; x < canvas.width; x += 4) {
      const spatialPhase = x * 0.01;

      // Calculate oscillator signals with unified phase
      const oscSignal =
        Math.sin(spatialPhase * f1 + phase) +
        Math.sin(spatialPhase * f2 + phase) +
        Math.sin(spatialPhase * f3 + phase);

      // Apply spatial phase to mic signal
      let micSignal = 0;
      if (micData) {
        const micIndex = Math.floor((x / canvas.width) * micData.length);
        const micPhase = spatialPhase * (f1 + f2 + f3) / 3;
        micSignal = Math.sin(micPhase + phase) * micData[micIndex] * (amplitude * 0.03);
      }

      const combinedSignal = micData ? (oscSignal + micSignal) : oscSignal;

      const hueShift = mapRange(combinedSignal, -3 * amplitude, 3 * amplitude, -30, 30);

      if (mode === 'interference beats') {
        const dynamicPulse = pulse + Math.abs(combinedSignal) * 0.2;

        const glowLayers = 3;
        for (let i = glowLayers; i >= 1; i--) {
          ctx.beginPath();
          ctx.arc(x, canvas.height / 2 + combinedSignal * amplitude, 
                 dynamicPulse + i * 2, 0, 2 * Math.PI);
          ctx.fillStyle = `hsla(${hue + hueShift}, 100%, 60%, ${0.03 * i})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, canvas.height / 2 + combinedSignal * amplitude, 
               dynamicPulse, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${hue + hueShift}, 100%, 60%)`;
        ctx.fill();
      } else if (mode === 'waves') {
        const scale = 0.02;
        const amp = canvas.height / 3;
        const radius = 2.5;

        const y1 = canvas.height / 2 + Math.sin(x * scale * f1) * amp;
        const y2 = canvas.height / 2 + Math.sin(x * scale * f2) * amp;
        const y3 = canvas.height / 2 + Math.sin(x * scale * f3) * amp;

        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.arc(x, y1, radius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = 'green';
        ctx.arc(x, y2, radius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = 'blue';
        ctx.arc(x, y3, radius, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw grid lines
    for (let midi = 45; midi <= 81; midi++) {
      const freq = Tone.Frequency(midi, 'midi').toFrequency();
      const noteName = Tone.Frequency(midi, 'midi').toNote();

      const xPos = logMap(freq, 110, 880, 0, canvas.width);
      ctx.beginPath();
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos, canvas.height);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '12px monospace';
      ctx.fillText(noteName, xPos + 2, 12);

      const yPos = logMap(freq, 880, 110, 0, canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(canvas.width, yPos);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.stroke();
      ctx.fillText(noteName, 10, yPos - 4);
    }

    // Draw mic waveform if available
    if (micData?.length) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'cyan';
      ctx.shadowBlur = 8;

      const micY = canvas.height * 0.85;
      const scaleX = canvas.width / micData.length;
      const scaleY = canvas.height * 0.3;

      ctx.moveTo(0, micY);
      for (let i = 0; i < micData.length; i++) {
        const x = i * scaleX;
        const y = micY + micData[i] * scaleY;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    animationFrameId = requestAnimationFrame(animate);
  };

  animate();
};
