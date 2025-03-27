// Autocorrelation pitch detection
export function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
    const SIZE = buffer.length;
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;
    const correlations = new Array(SIZE).fill(0);
  
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return null; // Too quiet
  
    for (let offset = 1; offset < SIZE; offset++) {
      let correlation = 0;
      for (let i = 0; i < SIZE - offset; i++) {
        correlation += buffer[i] * buffer[i + offset];
      }
      correlations[offset] = correlation;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }
  
    if (bestOffset === -1) return null;
  
    const frequency = sampleRate / bestOffset;
    return frequency;
  }