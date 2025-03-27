import * as Tone from 'tone';
import { useState, useCallback, useEffect, useRef } from 'react';

interface MicAnalysis {
  rms: number;
  isOnset: boolean;
  spectralCentroid: number;
}

export const useMicrophone = (started: boolean) => {
  const [micEnabled, setMicEnabled] = useState(false);
  const [analyser, setAnalyser] = useState<Tone.Analyser | null>(null);
  const [fftAnalyser, setFftAnalyser] = useState<Tone.Analyser | null>(null);
  const [micData, setMicData] = useState<Float32Array | null>(null);
  const [analysis, setAnalysis] = useState<MicAnalysis>({
    rms: 0,
    isOnset: false,
    spectralCentroid: 0
  });

  // Keep a small history for onset detection
  const lastRmsRef = useRef<number>(0);
  const onsetThreshold = 0.1;

  const toggleMic = useCallback(async () => {
    if (!micEnabled) {
      await Tone.start();
      const mic = new Tone.UserMedia();
      const newAnalyser = new Tone.Analyser('waveform', 1024);
      const newFftAnalyser = new Tone.Analyser('fft', 1024);
      
      try {
        await mic.open();
        mic.connect(newAnalyser);
        mic.connect(newFftAnalyser);
        setAnalyser(newAnalyser);
        setFftAnalyser(newFftAnalyser);
        setMicEnabled(true);
      } catch (e) {
        console.error('Error opening microphone:', e);
      }
    } else {
      analyser?.dispose();
      fftAnalyser?.dispose();
      setAnalyser(null);
      setFftAnalyser(null);
      setMicEnabled(false);
    }
  }, [micEnabled, analyser, fftAnalyser]);

  // Analyze mic input
  useEffect(() => {
    if (!started || !analyser || !fftAnalyser) return;

    const interval = setInterval(() => {
      const buffer = analyser.getValue() as Float32Array;
      setMicData(buffer);

      // Calculate RMS
      const rms = Math.sqrt(
        buffer.reduce((sum, val) => sum + val * val, 0) / buffer.length
      );

      // Detect onset
      const isOnset = rms > onsetThreshold && lastRmsRef.current < onsetThreshold;
      lastRmsRef.current = rms;

      // Calculate spectral centroid
      const spectrum = fftAnalyser.getValue() as Float32Array;
      let numerator = 0;
      let denominator = 0;
      
      for (let i = 0; i < spectrum.length; i++) {
        const freq = i * (Tone.context.sampleRate / 2) / spectrum.length;
        const magnitude = Math.abs(spectrum[i]);
        numerator += freq * magnitude;
        denominator += magnitude;
      }

      const centroid = denominator > 0 ? numerator / denominator : 0;

      setAnalysis({
        rms,
        isOnset,
        spectralCentroid: centroid
      });
    }, 50);

    return () => clearInterval(interval);
  }, [started, analyser, fftAnalyser]);

  return { micEnabled, analyser, toggleMic, micData, analysis };
};