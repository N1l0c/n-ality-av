import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

// 🔧 Frequency mapping function
const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

export default function App() {
  const [started, setStarted] = useState(false);
  // Canvas for visuals
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Persistent references to the two modulated oscillators
  const osc2Ref = useRef<Tone.Oscillator | null>(null);
  const osc3Ref = useRef<Tone.Oscillator | null>(null);

  const generateWaves = () => {
    console.log("Starting oscillators...");

    const baseFreq = 220;

    // Oscillator 1: Reference tone
    const osc1 = new Tone.Oscillator({
      frequency: baseFreq,
      type: 'sine',
    }).toDestination();
    osc1.start();

    // Oscillator 2 (modulated by mouse X)
    const osc2 = new Tone.Oscillator({
      frequency: baseFreq,
      type: 'sine',
    }).toDestination();
    osc2.start();
    osc2Ref.current = osc2;

    // Oscillator 3 (modulated by mouse Y)
    const osc3 = new Tone.Oscillator({
      frequency: baseFreq,
      type: 'sine',
    }).toDestination();
    osc3.start();
    osc3Ref.current = osc3;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!osc2Ref.current || !osc3Ref.current) return;

      const { innerWidth, innerHeight } = window;

      const freqX = mapRange(e.clientX, 0, innerWidth, 110, 880);
      const freqY = mapRange(e.clientY, 0, innerHeight, 880, 110);

      osc2Ref.current.frequency.value = freqX;
      osc3Ref.current.frequency.value = freqY;
        const canvas = canvasRef.current;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height); // fill canvas background

        // Draw beat interference pattern with pitch-based color
        for (let x = 0; x < canvas.width; x += 4) {
          const freqX = osc2Ref.current.frequency.value;
          const freqY = osc3Ref.current.frequency.value;

          const y =
            canvas.height / 2 +
            Math.sin(x * 0.01 * freqX) * 200 +
            Math.sin(x * 0.01 * freqY) * 200;

          // Calculate average pitch at this point
          const avgFreq = (freqX + freqY) / 2;

          // Map frequency (110–880 Hz) to hue (220° = blue → 360° = red)
          const hue = mapRange(avgFreq, 110, 880, 220, 360);

          // Set fill color using HSL
          ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;

          // Draw circle
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }

        
        // 🎼 MIDI note range: A2 (45) to A5 (81)
        for (let midi = 45; midi <= 81; midi++) {
          const freq = Tone.Frequency(midi, "midi").toFrequency();
          const noteName = Tone.Frequency(midi, "midi").toNote();

          // X-axis: vertical lines for osc2
          const xPos = mapRange(freq, 110, 880, 0, canvas.width);
          ctx.beginPath();
          ctx.moveTo(xPos, 0);
          ctx.lineTo(xPos, canvas.height);
          ctx.strokeStyle = "rgba(255,255,255,0.3)";
          ctx.stroke();

          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.font = "14px monospace";
          ctx.fillText(noteName, xPos + 2, 12);

          // Y-axis: horizontal lines for osc3
          const yPos = mapRange(freq, 880, 110, 0, canvas.height); // flipped Y
          ctx.beginPath();
          ctx.moveTo(0, yPos);
          ctx.lineTo(canvas.width, yPos);
          ctx.strokeStyle = "rgba(255,255,255,0.3)";
          ctx.stroke();

          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.fillText(noteName, 10, yPos - 4);
        }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const startAudio = async () => {
    await Tone.start();
    console.log("Tone.js audio context started");
    setStarted(true);
    generateWaves();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
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
            cursor: 'pointer'
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
              zIndex: -1, // behind your text
            }}
          ></canvas>
    </div>
  );
}
