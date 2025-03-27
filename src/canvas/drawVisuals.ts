// canvas/drawVisuals.ts
import * as Tone from 'tone';
import { mapRange } from '../utils/mapRange';

let animationFrameId: number;

// Convert linear value to logarithmic scale between min and max
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
  mode: 'interference beats' | 'waves',
  micData?: Float32Array // Add micData as an optional parameter
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  cancelAnimationFrame(animationFrameId);

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const baseFreq = 220;
    const f1 = baseFreq;
    const f2 = freqX;
    const f3 = freqY;

    const time = performance.now() / 1000;
    const phase = time * 2 * Math.PI; // Global phase reference

    // Calculate beat frequencies
    const b12 = Math.abs(f1 - f2);
    const b13 = Math.abs(f1 - f3);
    const b23 = Math.abs(f2 - f3);

    // Calculate beat pulse using the global phase
    const beatPulse =
      Math.sin(phase * b12) +
      Math.sin(phase * b13) +
      Math.sin(phase * b23);

    const normalizedPulse = (beatPulse + 3) / 6;
    const pulse = 1 + normalizedPulse * 4;
    const compositeBeat = (b12 + b13 + b23) / 3;
    const hue = mapRange(compositeBeat, 0, 20, 200, 360);
    const amplitude = canvas.height / 4;

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
        // Apply spatial phase transformation to mic signal
        const micPhase = spatialPhase * (f1 + f2 + f3) / 3; // Average frequency for mic phase
        micSignal = Math.sin(micPhase + phase) * micData[micIndex] * (amplitude * 0.33);
      }

      // Combine signals maintaining phase relationship
      const combinedSignal = micData ? (oscSignal + micSignal) : oscSignal;

      // Map combined signal to canvas height
      const y = canvas.height / 2 + combinedSignal * amplitude;

      // Adjust color hue based on combined signal
      const hueShift = mapRange(combinedSignal, -3 * amplitude, 3 * amplitude, -30, 30);

      if (mode === 'interference beats') {
        // Use the original pulse calculation
        const dynamicPulse = pulse + Math.abs(combinedSignal) * 0.2; // Reduced multiplier

        // Draw the pulse with glow layers
        const glowLayers = 3;
        for (let i = glowLayers; i >= 1; i--) {
          ctx.beginPath();
          ctx.arc(x, canvas.height / 2 + combinedSignal * amplitude, 
                 dynamicPulse + i * 2, 0, 2 * Math.PI);
          ctx.fillStyle = `hsla(${hue + hueShift}, 100%, 60%, ${0.03 * i})`;
          ctx.fill();
        }

        // Core pulse
        ctx.beginPath();
        ctx.arc(x, canvas.height / 2 + combinedSignal * amplitude, 
               dynamicPulse, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${hue + hueShift}, 100%, 60%)`;
        ctx.fill();
      } else if (mode === 'waves') {
        // Wave visualization logic
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

    // Grid lines (logarithmic mapping)
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

    if (micData && micData.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'cyan';
      ctx.shadowBlur = 8;

      const midY = canvas.height * 0.75;
      const scaleX = canvas.width / micData.length;
      const scaleY = canvas.height / 4;

      ctx.moveTo(0, midY - micData[0] * scaleY);
      for (let i = 1; i < micData.length; i++) {
        const x = i * scaleX;
        const y = midY - micData[i] * scaleY;
        ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    animationFrameId = requestAnimationFrame(animate);
  };

  animate();
};
