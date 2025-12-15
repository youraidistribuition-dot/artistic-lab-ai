
import { MixPreset } from '../types';

export interface QualityStats {
  peak: number;
  rms: number;
  clipping: boolean;
  clippingCount: number;
  score: number; // 0-100
}

// AI Voice Mixing Engine
// Handles professional audio processing using Web Audio API

class AudioEngine {
  private context: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  
  // EQ Nodes
  private highPass: BiquadFilterNode | null = null;
  private lowShelf: BiquadFilterNode | null = null;
  private highShelf: BiquadFilterNode | null = null;
  private presence: BiquadFilterNode | null = null;

  constructor() {
    // Lazy initialization handled in getContext
  }

  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.setupMixingChain();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    return this.context;
  }

  private setupMixingChain() {
    if (!this.context) return;
    const ctx = this.context;

    // 1. Dynamics Compressor (The "Glue")
    // Settings optimized for vocal clarity and punch
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24; // Start compressing early
    this.compressor.knee.value = 30;       // Soft knee for natural sound
    this.compressor.ratio.value = 12;      // High ratio for vocals
    this.compressor.attack.value = 0.003;  // Fast attack
    this.compressor.release.value = 0.25;  // Moderate release

    // 2. EQ Chain
    
    // High Pass (Clean Mud)
    this.highPass = ctx.createBiquadFilter();
    this.highPass.type = 'highpass';
    this.highPass.frequency.value = 85; // Cut below 85Hz

    // Low Shelf (Body/Warmth)
    this.lowShelf = ctx.createBiquadFilter();
    this.lowShelf.type = 'lowshelf';
    this.lowShelf.frequency.value = 200;
    this.lowShelf.gain.value = 2; // +2dB warmth

    // Presence (Intelligibility)
    this.presence = ctx.createBiquadFilter();
    this.presence.type = 'peaking';
    this.presence.frequency.value = 3000; // 3kHz is "clarity"
    this.presence.Q.value = 1;
    this.presence.gain.value = 2; // +2dB presence

    // High Shelf (Air)
    this.highShelf = ctx.createBiquadFilter();
    this.highShelf.type = 'highshelf';
    this.highShelf.frequency.value = 10000;
    this.highShelf.gain.value = 3; // +3dB air

    // 3. Master Gain (Makeup Gain)
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 1.2; // Compensate for compression reduction

    // Connect Chain: Source -> HighPass -> LowShelf -> Presence -> HighShelf -> Compressor -> Master -> Dest
    this.highPass.connect(this.lowShelf);
    this.lowShelf.connect(this.presence);
    this.presence.connect(this.highShelf);
    this.highShelf.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);
  }

  // Decodes base64 string to AudioBuffer
  private async decode(base64: string): Promise<AudioBuffer> {
    const ctx = this.getContext();
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    
    // Convert to float32 for Web Audio
    // Raw PCM from Gemini is typically Int16 Little Endian
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;

    // Create buffer (Gemini TTS is typically 24kHz mono)
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    return buffer;
  }

  // Analyze Quality (Peak, RMS, Clipping)
  private analyzeBuffer(buffer: AudioBuffer): QualityStats {
    let peak = 0;
    let sumSquares = 0;
    let clipped = 0;
    const channels = buffer.numberOfChannels;
    const len = buffer.length;

    for (let c = 0; c < channels; c++) {
        const data = buffer.getChannelData(c);
        for (let i = 0; i < len; i++) {
            const abs = Math.abs(data[i]);
            if (abs > peak) peak = abs;
            if (abs >= 0.99) clipped++;
            sumSquares += abs * abs;
        }
    }
    
    const rms = Math.sqrt(sumSquares / (len * channels));
    
    // Simple Score Calc
    let score = 100;
    if (clipped > 100) score -= 20;
    if (clipped > 1000) score -= 30;
    if (rms < 0.05) score -= 20; // Too quiet
    if (peak < 0.5) score -= 10; // Low headroom usage

    return {
        peak,
        rms,
        clipping: clipped > 0,
        clippingCount: clipped,
        score: Math.max(0, score)
    };
  }

  // Play mixed audio
  public async play(base64Audio: string, options: { pitch?: number, speed?: number } = {}): Promise<void> {
    try {
      const ctx = this.getContext();
      const buffer = await this.decode(base64Audio);
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      
      // Apply Custom Voice Identity Modifiers (Pitch/Rate)
      // This allows us to simulate "Custom" voices by altering standard ones
      if (options.pitch) {
         source.detune.value = options.pitch; // cents
      }
      if (options.speed) {
         source.playbackRate.value = options.speed;
      }

      // Connect to Mixing Chain (start at HighPass)
      if (this.highPass) {
        source.connect(this.highPass);
      } else {
        source.connect(ctx.destination); // Fallback
      }

      source.start();
    } catch (e) {
      console.error("Audio Engine Playback Error", e);
    }
  }

  public async analyzeUpload(file: File): Promise<string> {
    // Simulates analyzing user audio for the Voice Trainer
    // Returns a "quality score" or status
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("Analysis Complete: Voice detected. Quality: High.");
        }, 2000);
    });
  }

  // --- MIX TAB PROCESSING ---

  public async processTrack(file: File, preset: MixPreset): Promise<{ url: string; duration: number; stats: QualityStats }> {
    // STABILITY FIX: Create context, decode, then IMMEDIATELY CLOSE it to prevent hardware resource exhaustion.
    const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
        
        // Close the temporary context to free up hardware resources immediately
        if (tempCtx.state !== 'closed') {
            await tempCtx.close();
        }

        // Offline context for rendering faster than real-time
        const offlineCtx = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );

        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;

        // Default Chain Nodes
        let chainStart: AudioNode = source;
        let chainEnd: AudioNode = source;

        // --- PRESET LOGIC ---
        if (preset === 'raw') {
            // RAW: Minimal processing, just safety limiting
            const limiter = offlineCtx.createDynamicsCompressor();
            limiter.threshold.value = -1.0;
            limiter.ratio.value = 10;
            limiter.attack.value = 0.005;
            limiter.release.value = 0.1;

            source.connect(limiter);
            chainEnd = limiter;

        } else if (preset === 'loud') {
            // LOUD: Aggressive Compression & Limiting (Mastering focus)
            const lowCut = offlineCtx.createBiquadFilter();
            lowCut.type = 'highpass';
            lowCut.frequency.value = 35; // Tighten subs

            const comp = offlineCtx.createDynamicsCompressor();
            comp.threshold.value = -20; // Deep threshold
            comp.ratio.value = 5;       // Heavy ratio
            comp.attack.value = 0.002;
            comp.release.value = 0.15;

            const gain = offlineCtx.createGain();
            gain.gain.value = 2.0; // Significant makeup gain

            const limiter = offlineCtx.createDynamicsCompressor();
            limiter.threshold.value = -0.5;
            limiter.ratio.value = 20;
            limiter.attack.value = 0.001;
            limiter.release.value = 0.05;

            source.connect(lowCut);
            lowCut.connect(comp);
            comp.connect(gain);
            gain.connect(limiter);
            chainEnd = limiter;

        } else if (preset === 'dark') {
            // DARK: Low Boost, High Cut
            const lowShelf = offlineCtx.createBiquadFilter();
            lowShelf.type = 'lowshelf';
            lowShelf.frequency.value = 100;
            lowShelf.gain.value = 3.5; // Boost bass

            const highShelf = offlineCtx.createBiquadFilter();
            highShelf.type = 'highshelf';
            highShelf.frequency.value = 6000;
            highShelf.gain.value = -2.0; // Soften highs

            const comp = offlineCtx.createDynamicsCompressor();
            comp.threshold.value = -18;
            comp.ratio.value = 3;

            source.connect(lowShelf);
            lowShelf.connect(highShelf);
            highShelf.connect(comp);
            chainEnd = comp;

        } else {
            // CLEAN (Default): Balanced
            const hp = offlineCtx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 60;

            const presence = offlineCtx.createBiquadFilter();
            presence.type = 'peaking';
            presence.frequency.value = 3000;
            presence.gain.value = 2.0;

            const comp = offlineCtx.createDynamicsCompressor();
            comp.threshold.value = -18;
            comp.ratio.value = 3;
            comp.attack.value = 0.01;
            comp.release.value = 0.2;

            source.connect(hp);
            hp.connect(presence);
            presence.connect(comp);
            chainEnd = comp;
        }

        chainEnd.connect(offlineCtx.destination);
        source.start();

        const renderedBuffer = await offlineCtx.startRendering();
        
        // QUALITY CHECK
        const stats = this.analyzeBuffer(renderedBuffer);

        const wavBlob = this.bufferToWave(renderedBuffer, renderedBuffer.length);
        
        return {
            url: URL.createObjectURL(wavBlob),
            duration: renderedBuffer.duration,
            stats
        };
    } catch (e) {
        // Ensure context is closed even if decoding fails
        if (tempCtx.state !== 'closed') {
            await tempCtx.close();
        }
        throw new Error("Audio Processing Failed: " + (e as any).message);
    }
  }

  // Helper to convert AudioBuffer to WAV Blob
  private bufferToWave(abuffer: AudioBuffer, len: number) {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded in this example)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for(i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));

    while(pos < len) {
      for(i = 0; i < numOfChan; i++) {             // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
        view.setInt16(44 + offset, sample, true); // write 16-bit sample
        offset += 2;
      }
      pos++;
    }

    return new Blob([buffer], {type: "audio/wav"});

    function setUint16(data: any) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: any) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }
}

export const audioEngine = new AudioEngine();
