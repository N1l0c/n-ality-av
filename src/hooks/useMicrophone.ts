import { useState, useEffect } from 'react';
import * as Tone from 'tone';

export const useMicrophone = (): {
  micEnabled: boolean;
  analyser: Tone.Analyser | null;
  toggleMic: () => void;
} => {
  const [micEnabled, setMicEnabled] = useState(false);
  const [analyser, setAnalyser] = useState<Tone.Analyser | null>(null);

  const toggleMic = async () => {
    if (micEnabled) {
      setMicEnabled(false);
      return;
    }

    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      const micSource = new Tone.UserMedia();
      await micSource.open();
      const analyserNode = new Tone.Analyser('waveform', 2048);
      micSource.connect(analyserNode);
      setAnalyser(analyserNode);
      setMicEnabled(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  useEffect(() => {
    return () => {
      analyser?.dispose();
    };
  }, [analyser]);

  return { micEnabled, analyser, toggleMic };
};