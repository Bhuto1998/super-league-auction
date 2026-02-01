// Sound effects for match simulation
// Uses Web Audio API to generate sounds without external files

class SoundEffects {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return this.audioContext;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // Whistle sound for kick-off, half-time, full-time
  public playWhistle(duration: number = 0.5): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + duration * 0.3);
      oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + duration);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }

  // Goal celebration sound
  public playGoal(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();

      // Play a triumphant chord
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 chord

      frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

        oscillator.start(ctx.currentTime + i * 0.05);
        oscillator.stop(ctx.currentTime + 1);
      });

      // Add crowd roar effect
      setTimeout(() => this.playCrowdRoar(), 200);
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }

  // Crowd roar (white noise burst)
  public playCrowdRoar(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate filtered noise for crowd sound
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

      source.start(ctx.currentTime);
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }

  // Kick/shoot sound
  public playKick(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(150, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }

  // Card shown sound (sharp beep)
  public playCard(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.type = 'square';

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }

  // Foul whistle (short sharp whistle)
  public playFoul(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
      oscillator.frequency.setValueAtTime(900, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }

  // Ambient crowd background (low murmur)
  public playAmbientCrowd(): { stop: () => void } {
    if (!this.enabled) return { stop: () => {} };
    try {
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1);
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(0.03, ctx.currentTime);

      source.start(ctx.currentTime);

      return {
        stop: () => {
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          setTimeout(() => source.stop(), 500);
        }
      };
    } catch (e) {
      console.warn('Sound playback failed:', e);
      return { stop: () => {} };
    }
  }
}

// Singleton instance
export const soundEffects = new SoundEffects();
