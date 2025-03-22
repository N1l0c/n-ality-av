// ✅ STEP 3: canvas/drawVisuals.ts (now animated with requestAnimationFrame)
import * as Tone from 'tone';
import { mapRange } from '../utils/mapRange';

let animationFrameId: number;

export const drawVisuals = (
  canvas: HTMLCanvasElement,
  freqX: number,
  freqY: number
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  cancelAnimationFrame(animationFrameId);

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const amplitude = canvas.height / 4;
    const beatFreq = Math.abs(freqX - freqY);
    const hue = mapRange(beatFreq, 0, 20, 200, 360);
    const time = performance.now() / 1000;
    const pulse = 2 + Math.abs(Math.sin(time * beatFreq)) * 6;

    for (let x = 0; x < canvas.width; x += 4) {
      const y =
        canvas.height / 2 +
        Math.sin(x * 0.01 * freqX) * amplitude +
        Math.sin(x * 0.01 * freqY) * amplitude;

      ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
      ctx.beginPath();
      ctx.arc(x, y, pulse, 0, 2 * Math.PI);
      ctx.fill();
    }

    for (let midi = 45; midi <= 81; midi++) {
      const freq = Tone.Frequency(midi, 'midi').toFrequency();
      const noteName = Tone.Frequency(midi, 'midi').toNote();

      const xPos = mapRange(freq, 110, 880, 0, canvas.width);
      ctx.beginPath();
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos, canvas.height);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '14px monospace';
      ctx.fillText(noteName, xPos + 2, 12);

      const yPos = mapRange(freq, 880, 110, 0, canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(canvas.width, yPos);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.stroke();
      ctx.fillText(noteName, 10, yPos - 4);
    }

    animationFrameId = requestAnimationFrame(animate);
  };

  animate();
};
