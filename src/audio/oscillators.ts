// audio/oscillators.ts
import * as Tone from 'tone';

export const createOscillators = () => {
  const baseFreq = 220;
  const gain = new Tone.Gain(0.3).toDestination();

  const osc1 = new Tone.Oscillator({ frequency: baseFreq, type: 'sine' }).connect(gain).start();
  const osc2 = new Tone.Oscillator({ frequency: baseFreq, type: 'sine' }).connect(gain).start();
  const osc3 = new Tone.Oscillator({ frequency: baseFreq, type: 'sine' }).connect(gain).start();

  return { osc1, osc2, osc3 };
};
