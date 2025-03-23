import { useRef, useState } from 'react';
import * as Tone from 'tone';
import { createOscillators } from './audio/oscillators';
import { useInteractionHandlers } from './hooks/useInteractionHandlers';

export default function App() {
  const [started, setStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const osc2Ref = useRef<Tone.Oscillator | null>(null);
  const osc3Ref = useRef<Tone.Oscillator | null>(null);
  const [mode, setMode] = useState<'interference beats' | 'waves'>('interference beats');
  
  useInteractionHandlers(canvasRef, osc2Ref, osc3Ref, mode);

  const handleStart = async () => {
    await Tone.start();
    setStarted(true);
    const { osc1: _osc1, osc2, osc3 } = createOscillators();
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
      {!started && (<h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>N-ality Sine-Soundscape</h1>)}

      {!started && (
        <>
          <p style={{ maxWidth: '600px', textAlign: 'center', marginBottom: '1rem' }}>
            <strong>Warning:</strong> This app produces continuous tones and visual patterns that may be sensitive for users with auditory or photosensitive conditions. Please lower your volume and proceed with care.
          </p>
          <p>Move your finger or mouse to explore the frequency space.</p>
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
              marginTop: '1rem',
            }}
          >
            Tap to Start Audio
          </button>
        </>
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
      {started && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '0.5rem',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '0.5rem 1rem',
            borderRadius: '10px',
          }}
        >
          {['interference beats', 'waves'].map((option) => (
            <button
              key={option}
              onClick={() => setMode(option as 'interference beats' | 'waves')}
              style={{
                padding: '0.4rem 0.8rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: mode === option ? 'white' : 'black',
                color: mode === option ? 'black' : 'white',
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
