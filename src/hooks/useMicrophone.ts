// audio/useMicrophone.ts
import { useRef, useState } from 'react';
import * as Tone from 'tone';

export const useMicrophone = () => {
  const micRef = useRef<Tone.UserMedia | null>(null);
  const analyserRef = useRef<Tone.Analyser | null>(null);
  const [micEnabled, setMicEnabled] = useState(false);

  const toggleMic = async () => {
    if (micEnabled) {
      // Stop mic
      micRef.current?.disconnect();
      micRef.current?.close();
      analyserRef.current?.dispose();
      micRef.current = null;
      analyserRef.current = null;
      setMicEnabled(false);
    } else {
      try {
        const mic = new Tone.UserMedia();
        await mic.open();
        const analyser = new Tone.Analyser('waveform', 1024);
        mic.connect(analyser);

        micRef.current = mic;
        analyserRef.current = analyser;
        setMicEnabled(true);
      } catch (error) {
        console.error('Microphone access denied or failed:', error);
      }
    }
  };

  return {
    micEnabled,
    analyser: analyserRef.current,
    toggleMic,
  };
};