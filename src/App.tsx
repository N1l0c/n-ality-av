import { useRef, useState } from 'react';
import * as Tone from 'tone';
import { createOscillators } from './audio/oscillators';
import { useInteractionHandlers } from './hooks/useInteractionHandlers';

export default function App() {
  const [started, setStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const osc2Ref = useRef<Tone.Oscillator | null>(null);
  const osc3Ref = useRef<Tone.Oscillator | null>(null);

  useInteractionHandlers(canvasRef, osc2Ref, osc3Ref);

  const handleStart = async () => {
    await Tone.start();
    setStarted(true);
    const { osc1, osc2, osc3 } = createOscillators();
    osc2Ref.current = osc2;
    osc3Ref.current = osc3;
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
      <p>Move your finger or mouse to explore the frequency space.</p>

      {!started && (
        <button
          onClick={handleStart}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            background: 'white',
            color: 'black',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          Tap to Start Audio
        </button>
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
          background: 'black',
        }}
      />
    </div>
  );
}
