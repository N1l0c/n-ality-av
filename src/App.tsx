import { useRef, useState, useEffect } from 'react';
import * as Tone from 'tone';
import { createOscillators } from './audio/oscillators';
import { useInteractionHandlers } from './hooks/useInteractionHandlers';
import { useMicrophone } from './hooks/useMicrophone';
import { drawVisuals } from './canvas/drawVisuals';

export default function App() {
  const [started, setStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const osc1Ref = useRef<Tone.Oscillator | null>(null);
  const osc2Ref = useRef<Tone.Oscillator | null>(null);
  const osc3Ref = useRef<Tone.Oscillator | null>(null);
  const [mode, setMode] = useState<'interference beats' | 'waves'>('interference beats');
  const [waveform, setWaveform] = useState<'sine' | 'triangle' | 'square' | 'sawtooth'>('sine');
  const [snapToGrid, setSnapToGrid] = useState(false);
  const { micEnabled, analyser, toggleMic, micData } = useMicrophone(started);
  const [freqX, setFreqX] = useState<number>(440);
  const [freqY, setFreqY] = useState<number>(440);

  useEffect(() => {
    if (!started) return;

    // Stop and dispose previous oscillators if they exist
    osc1Ref.current?.stop();
    osc1Ref.current?.dispose();
    osc2Ref.current?.stop();
    osc2Ref.current?.dispose();
    osc3Ref.current?.stop();
    osc3Ref.current?.dispose();

    // Create new ones
    const { osc1, osc2, osc3 } = createOscillators(waveform);
    osc1Ref.current = osc1;
    osc2Ref.current = osc2;
    osc3Ref.current = osc3;
  }, [started, waveform]);

  useEffect(() => {
    return () => {
      osc1Ref.current?.stop();
      osc1Ref.current?.dispose();
      osc2Ref.current?.stop();
      osc2Ref.current?.dispose();
      osc3Ref.current?.stop();
      osc3Ref.current?.dispose();
    };
  }, []);

  const startYear = 2025;
  const currentYear = new Date().getFullYear();
  const yearDisplay = currentYear === startYear ? `${startYear}` : `${startYear}–${currentYear}`;

  useInteractionHandlers(
    canvasRef,
    osc2Ref,
    osc3Ref,
    mode,
    snapToGrid,
    analyser
  );

  const handleStart = async () => {
    console.log('Start button clicked');
    console.log('Tone.context.state BEFORE:', Tone.context.state);

    await Tone.start();

    console.log('Tone.context.state AFTER:', Tone.context.state);
    setStarted(true);
  };

  useEffect(() => {
    if (!started || !micEnabled || !analyser) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      const micDataArray = analyser.getValue() as Float32Array; // Use Tone.Analyser's getValue method
      drawVisuals(canvas, freqX, freqY, mode, micDataArray);

      requestAnimationFrame(render);
    };

    render();
  }, [started, micEnabled, freqX, freqY, mode, analyser]);

  // Update main render loop
  useEffect(() => {
    if (!canvasRef.current) return;

    drawVisuals(
      canvasRef.current,
      freqX,
      freqY,
      mode,
      micData || undefined
    );
  }, [canvasRef, freqX, freqY, mode, micData]);

  // Dummy effect to "use" the setters so TS sees them referenced.
  useEffect(() => {
    // No-op: these setters are passed to useInteractionHandlers indirectly.
    void setFreqX;
    void setFreqY;
  }, [setFreqX, setFreqY]);

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
      {!started && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            backgroundColor: 'black',
            color: 'white',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>N-ality Sine-Soundscape</h1>
          <p style={{ maxWidth: '600px', marginBottom: '1rem' }}>
            <strong>Warning:</strong> This app produces continuous tones and visual patterns that may be sensitive for users with auditory or photosensitive conditions. Please lower your volume and proceed with care.
          </p>
          <p>Move your finger or mouse to explore the frequency space. Try to find patterns in the chaos!</p>
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
              marginTop: '1rem',
            }}
          >
            Tap to Start Audio
          </button>
        </div>
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
                opacity: 0.5,
                transition: 'opacity 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      {started && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.3rem',
          zIndex: 10,
        }}>
          {['sine', 'triangle', 'square', 'sawtooth'].map((shape) => (
            <button
              key={shape}
              onClick={() => setWaveform(shape as typeof waveform)}
              style={{
                padding: '0.3rem 0.6rem',
                background: waveform === shape ? 'white' : 'black',
                color: waveform === shape ? 'black' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                opacity: 0.5,
                transition: 'opacity 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
            >
              {shape}
            </button>
          ))}
          {started && (
            <button
              onClick={() => setSnapToGrid(prev => !prev)}
              style={{
                padding: '0.3rem 0.6rem',
                background: snapToGrid ? 'white' : 'black',
                color: snapToGrid ? 'black' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                opacity: 0.5,
                transition: 'opacity 0.3s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
            >
              12-TET: {snapToGrid ? 'ON' : 'OFF'}
            </button>
          )}
          <button
            onClick={toggleMic}
            style={{
              padding: '0.3rem 0.6rem',
              background: micEnabled ? 'white' : 'black',
              color: micEnabled ? 'black' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              opacity: 0.5,
              transition: 'opacity 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
          >
            Mic: {micEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      )}
      <a
        href="https://github.com/N1l0c/n-ality-av"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          zIndex: 10,
          opacity: 0.7,
          transition: 'opacity 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: 'white',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
      >
        <svg
          viewBox="0 0 16 16"
          fill="black"
          width="24"
          height="24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 
          0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52
          -.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64
          -.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 
          012-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 
          1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 
          2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
      </a>
      <p
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          zIndex: 10,
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.6)',
          margin: 0,
          fontFamily: 'monospace',
        }}
      >
        © {yearDisplay} Colin Freeth
      </p>
    </div>
  );
}
