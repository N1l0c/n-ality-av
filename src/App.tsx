import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

// 🔧 Frequency mapping function
const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

export default function App() {
  const [started, setStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const osc2Ref = useRef<Tone.Oscillator | null>(null);
  const osc3Ref = useRef<Tone.Oscillator | null>(null);

  const generateWaves = () => {
    const baseFreq = 220;

    const osc1 = new Tone.Oscillator({
      frequency: baseFreq,
      type: 'sine',
    }).toDestination();
    osc1.start();

    const osc2 = new Tone.Oscillator({
      frequency: baseFreq,
      type: 'sine',
    }).toDestination();
    osc2.start();
    osc2Ref.current = osc2;

    const osc3 = new Tone.Oscillator({
      frequency: baseFreq,
      type: 'sine',
    }).toDestination();
    osc3.start();
    osc3Ref.current = osc3;
  };

    useEffect(() => {
      const updateFromPosition = (x: number, y: number) => {
        if (!osc2Ref.current || !osc3Ref.current) return;

        const { innerWidth, innerHeight } = window;

        const freqX = mapRange(x, 0, innerWidth, 110, 880);
        const freqY = mapRange(y, 0, innerHeight, 880, 110);

        osc2Ref.current.frequency.value = freqX;
        osc3Ref.current.frequency.value = freqY;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw beat interference pattern
        for (let x = 0; x < canvas.width; x += 4) {
          const localFreqX = osc2Ref.current.frequency.value;
          const localFreqY = osc3Ref.current.frequency.value;

          const y =
            canvas.height / 2 +
            Math.sin(x * 0.01 * localFreqX) * 200 +
            Math.sin(x * 0.01 * localFreqY) * 200;

          const avgFreq = (localFreqX + localFreqY) / 2;
          const hue = mapRange(avgFreq, 110, 880, 220, 360);

          ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Draw MIDI gridlines A2–A5 (MIDI 45–81)
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
      };

      const handleMouseMove = (e: MouseEvent) => {
        updateFromPosition(e.clientX, e.clientY);
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          updateFromPosition(touch.clientX, touch.clientY);
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
      };
    }, []);

  const startAudio = async () => {
    await Tone.start();
    console.log('Tone.js audio context started');
    setStarted(true);
    generateWaves();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        N-ality Audio Visual Scaffold
      </h1>
      {!started ? (
        <button
          onClick={startAudio}
          style={{
            padding: '0.5rem 1rem',
            background: 'white',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Start Experience
        </button>
      ) : (
        <p>Move your mouse to explore the frequency space.</p>
      )}
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: -1,
        }}
      />
    </div>
  );
}
