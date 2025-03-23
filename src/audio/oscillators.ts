// audio/oscillators.ts
import * as Tone from 'tone';

export function createOscillators(waveform: 'sine' | 'triangle' | 'square' | 'sawtooth') {

  const osc1 = new Tone.Oscillator({
    frequency: 220,
    type: waveform,
  }).connect(Tone.getDestination()).start();

  const osc2 = new Tone.Oscillator({
    frequency: 220,
    type: waveform,
  }).connect(Tone.getDestination()).start();

  const osc3 = new Tone.Oscillator({
    frequency: 220,
    type: waveform,
  }).connect(Tone.getDestination()).start();

  return { osc1, osc2, osc3 };
};
