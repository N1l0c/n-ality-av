// utils/snapTo12TET.ts

export function snapTo12TET(frequency: number): number {
    const baseFreq = 440; // A4
    const midi = Math.round(12 * Math.log2(frequency / baseFreq) + 69);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }