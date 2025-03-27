import * as Tone from 'tone';
import { useState, useCallback, useEffect } from 'react';

export const useMicrophone = (started: boolean) => {
  const [micEnabled, setMicEnabled] = useState(false);
  const [analyser, setAnalyser] = useState<Tone.Analyser | null>(null);
  const [micData, setMicData] = useState<Float32Array | null>(null);

  const toggleMic = useCallback(async () => {
    if (!micEnabled) {
      await Tone.start();
      const mic = new Tone.UserMedia();
      const newAnalyser = new Tone.Analyser('waveform', 1024);
      
      try {
        await mic.open();
        mic.connect(newAnalyser);
        setAnalyser(newAnalyser);
        setMicEnabled(true);
      } catch (e) {
        console.error('Error opening microphone:', e);
      }
    } else {
      analyser?.dispose();
      setAnalyser(null);
      setMicEnabled(false);
    }
  }, [micEnabled, analyser]);

  // Move mic data capture logic here
  useEffect(() => {
    if (!started || !analyser) return;

    const interval = setInterval(() => {
      const buffer = analyser.getValue() as Float32Array;
      setMicData(buffer);
    }, 50);

    return () => clearInterval(interval);
  }, [started, analyser]);

  return { micEnabled, analyser, toggleMic, micData };
};