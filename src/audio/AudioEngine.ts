/**
 * StageTalk Low-Latency Audio Engine
 * Handles Web Audio API routing, mic capture, ducking, hearing limiter, and VU metering.
 */

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micProcessor: ScriptProcessorNode | null = null;
  private micAnalyser: AnalyserNode | null = null;

  // Master output chain
  private masterGain: GainNode | null = null;
  private limiterNode: DynamicsCompressorNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;

  // Ducking chain for program feed
  private duckingGain: GainNode | null = null;
  private programGain: GainNode | null = null;

  // Program feed synthesizer nodes
  private isProgramFeedActive = false;
  private programTimer: number | null = null;
  private programBeat = 0;

  // State
  private isInitialized = false;
  private isMicTransmitting = false;
  private duckingDb = -15; // default 15dB ducking
  private limiterThresholdDb = -6; // safe hearing limiter
  private masterVolumeLevel = 0.85;

  // Callbacks
  public onAudioDataChunk: ((buffer: ArrayBuffer) => void) | null = null;
  public onInputPeakUpdate: ((peakDb: number, rmsDb: number, isClipping: boolean) => void) | null = null;
  public onOutputPeakUpdate: ((peakDb: number, rmsDb: number, isClipping: boolean) => void) | null = null;

  // VU meter animation frame
  private vuAnimationId: number | null = null;

  constructor() {
    // Lazy initialize on first user gesture
  }

  public async init(): Promise<boolean> {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({
        latencyHint: 'interactive',
        sampleRate: 48000,
      });

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolumeLevel, this.ctx.currentTime);

      // Limiter (Hearing Protection Brickwall Compressor)
      this.limiterNode = this.ctx.createDynamicsCompressor();
      this.limiterNode.threshold.setValueAtTime(this.limiterThresholdDb, this.ctx.currentTime);
      this.limiterNode.knee.setValueAtTime(0, this.ctx.currentTime);
      this.limiterNode.ratio.setValueAtTime(20, this.ctx.currentTime);
      this.limiterNode.attack.setValueAtTime(0.001, this.ctx.currentTime); // 1ms instant clamp
      this.limiterNode.release.setValueAtTime(0.05, this.ctx.currentTime); // 50ms fast recovery

      // Output Analyser
      this.outputAnalyser = this.ctx.createAnalyser();
      this.outputAnalyser.fftSize = 256;
      this.outputAnalyser.smoothingTimeConstant = 0.3;

      // Program feed ducking gain
      this.duckingGain = this.ctx.createGain();
      this.duckingGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.programGain = this.ctx.createGain();
      this.programGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

      // Route: Program Feed -> Program Gain -> Ducking Gain -> Limiter -> Master Gain -> Output Analyser -> Destination
      this.programGain.connect(this.duckingGain);
      this.duckingGain.connect(this.limiterNode);

      this.limiterNode.connect(this.masterGain);
      this.masterGain.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.ctx.destination);

      this.isInitialized = true;
      this.startVuLoop();

      return true;
    } catch (err) {
      console.error('Failed to init AudioContext:', err);
      return false;
    }
  }

  public async requestMicrophone(): Promise<boolean> {
    await this.init();
    if (!this.ctx) return false;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
          channelCount: 1,
          sampleRate: 48000,
        },
      });

      this.micSource = this.ctx.createMediaStreamSource(this.micStream);

      // Analyser for input
      this.micAnalyser = this.ctx.createAnalyser();
      this.micAnalyser.fftSize = 256;
      this.micAnalyser.smoothingTimeConstant = 0.2;
      this.micSource.connect(this.micAnalyser);

      // Processor for raw low-latency audio capture (bufferSize 512 = ~10.6ms at 48kHz)
      this.micProcessor = this.ctx.createScriptProcessor(512, 1, 1);
      this.micProcessor.onaudioprocess = (e) => {
        if (!this.isMicTransmitting) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM for ultra-compact network streaming
        const pcmBuffer = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        if (this.onAudioDataChunk) {
          this.onAudioDataChunk(pcmBuffer.buffer);
        }
      };

      this.micSource.connect(this.micProcessor);
      // Dummy destination to keep processor alive
      const silentGain = this.ctx.createGain();
      silentGain.gain.value = 0;
      this.micProcessor.connect(silentGain);
      silentGain.connect(this.ctx.destination);

      return true;
    } catch (err) {
      console.warn('Microphone permission not granted or device not found:', err);
      return false;
    }
  }

  public setMicTransmitting(active: boolean) {
    this.isMicTransmitting = active;
    if (active) {
      this.playTactileChirp(880, 0.03); // Mic ON cue chirp
    } else {
      this.playTactileChirp(440, 0.025); // Mic OFF cue chirp
    }
  }

  public setDuckingActive(active: boolean, duckingDb?: number) {
    if (!this.ctx || !this.duckingGain) return;
    const db = duckingDb !== undefined ? duckingDb : this.duckingDb;
    this.duckingDb = db;

    const targetGain = active ? Math.pow(10, db / 20) : 1.0;
    const rampTime = active ? 0.02 : 0.25; // 20ms attack, 250ms smooth release

    this.duckingGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.duckingGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, rampTime);
  }

  public setLimiter(enabled: boolean, thresholdDb: number = -6) {
    if (!this.ctx || !this.limiterNode) return;
    this.limiterThresholdDb = thresholdDb;
    const targetThreshold = enabled ? thresholdDb : 0;
    this.limiterNode.threshold.setTargetAtTime(targetThreshold, this.ctx.currentTime, 0.01);
  }

  public setMasterVolume(val: number) {
    // val: 0.0 to 1.0
    this.masterVolumeLevel = Math.max(0, Math.min(1, val));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.masterVolumeLevel, this.ctx.currentTime, 0.02);
    }
  }

  public playIncomingAudioChunk(arrayBuffer: ArrayBuffer) {
    if (!this.ctx || !this.limiterNode) return;

    try {
      const pcm16 = new Int16Array(arrayBuffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = this.ctx.createBuffer(1, float32.length, this.ctx.sampleRate);
      audioBuffer.copyToChannel(float32, 0);

      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Connect talkback directly to limiter & master (bypassing ducking so voice is loud and clear!)
      source.connect(this.limiterNode);
      source.start();
    } catch (e) {
      console.error('Error playing audio chunk:', e);
    }
  }

  public playTactileChirp(freq: number, duration: number) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  // Simulated Program Feed (Stage Live Band Groove / Soundcheck)
  public toggleProgramFeed(type: 'funk' | 'click' | 'pink_noise' = 'funk'): boolean {
    if (!this.ctx) return false;

    if (this.isProgramFeedActive) {
      this.stopProgramFeed();
      return false;
    } else {
      this.startProgramFeed(type);
      return true;
    }
  }

  public isProgramActive(): boolean {
    return this.isProgramFeedActive;
  }

  private startProgramFeed(type: 'funk' | 'click' | 'pink_noise') {
    if (!this.ctx || !this.programGain) return;
    this.isProgramFeedActive = true;
    this.programBeat = 0;

    const tempoBpm = 118;
    const intervalMs = (60 / tempoBpm / 2) * 1000; // 8th note

    this.programTimer = window.setInterval(() => {
      if (!this.ctx || !this.programGain || !this.isProgramFeedActive) return;

      const time = this.ctx.currentTime;
      const step = this.programBeat % 16;

      if (type === 'click') {
        // Metronome click (high on 1, medium on 2,3,4)
        if (step % 4 === 0) {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.frequency.value = step === 0 ? 1600 : 900;
          g.gain.setValueAtTime(0.2, time);
          g.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
          osc.connect(g);
          g.connect(this.programGain);
          osc.start(time);
          osc.stop(time + 0.04);
        }
      } else if (type === 'funk') {
        // Stage Funk Groove with Synth Bass, Kick & Hi-hat
        // Kick on 0, 6, 8, 10
        if (step === 0 || step === 6 || step === 8 || step === 10) {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.frequency.setValueAtTime(140, time);
          osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);
          g.gain.setValueAtTime(0.35, time);
          g.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
          osc.connect(g);
          g.connect(this.programGain);
          osc.start(time);
          osc.stop(time + 0.12);
        }

        // Snare / Clap on 4, 12
        if (step === 4 || step === 12) {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220, time);
          g.gain.setValueAtTime(0.25, time);
          g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
          osc.connect(g);
          g.connect(this.programGain);
          osc.start(time);
          osc.stop(time + 0.1);
        }

        // Hi-hat on every 8th note
        if (step % 2 === 0) {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(4000 + Math.random() * 2000, time);
          g.gain.setValueAtTime(step % 4 === 2 ? 0.08 : 0.04, time);
          g.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
          osc.connect(g);
          g.connect(this.programGain);
          osc.start(time);
          osc.stop(time + 0.03);
        }

        // Synth Bass Note
        const bassNotes = [55, 55, 65, 55, 73, 55, 65, 82]; // A1, C2, D2, E2 etc.
        const noteFreq = bassNotes[Math.floor(step / 2) % bassNotes.length];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(noteFreq * 2, time);
        bassGain.gain.setValueAtTime(0.12, time);
        bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        bassOsc.connect(bassGain);
        bassGain.connect(this.programGain);
        bassOsc.start(time);
        bassOsc.stop(time + 0.15);
      }

      this.programBeat++;
    }, intervalMs);
  }

  public stopProgramFeed() {
    this.isProgramFeedActive = false;
    if (this.programTimer !== null) {
      clearInterval(this.programTimer);
      this.programTimer = null;
    }
  }

  // Route output to specific audio device (e.g. Bluetooth IEM)
  public async setAudioOutputDevice(deviceId: string): Promise<boolean> {
    if (!this.ctx) return false;
    try {
      const anyCtx = this.ctx as unknown as { setSinkId?: (id: string) => Promise<void> };
      if (typeof anyCtx.setSinkId === 'function') {
        await anyCtx.setSinkId(deviceId);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('setSinkId failed or not supported:', err);
      return false;
    }
  }

  private startVuLoop() {
    const inputData = new Uint8Array(128);
    const outputData = new Uint8Array(128);

    const updateVu = () => {
      // Calculate Input VU
      if (this.micAnalyser && this.onInputPeakUpdate) {
        this.micAnalyser.getByteTimeDomainData(inputData);
        let max = 0;
        let sumSquares = 0;
        for (let i = 0; i < inputData.length; i++) {
          const val = (inputData[i] - 128) / 128;
          const abs = Math.abs(val);
          if (abs > max) max = abs;
          sumSquares += val * val;
        }
        const rms = Math.sqrt(sumSquares / inputData.length);
        const peakDb = max > 0 ? Math.max(-60, 20 * Math.log10(max)) : -60;
        const rmsDb = rms > 0 ? Math.max(-60, 20 * Math.log10(rms)) : -60;
        const isClipping = peakDb > -0.5;

        this.onInputPeakUpdate(peakDb, rmsDb, isClipping);
      }

      // Calculate Output VU
      if (this.outputAnalyser && this.onOutputPeakUpdate) {
        this.outputAnalyser.getByteTimeDomainData(outputData);
        let max = 0;
        let sumSquares = 0;
        for (let i = 0; i < outputData.length; i++) {
          const val = (outputData[i] - 128) / 128;
          const abs = Math.abs(val);
          if (abs > max) max = abs;
          sumSquares += val * val;
        }
        const rms = Math.sqrt(sumSquares / outputData.length);
        const peakDb = max > 0 ? Math.max(-60, 20 * Math.log10(max)) : -60;
        const rmsDb = rms > 0 ? Math.max(-60, 20 * Math.log10(rms)) : -60;
        const isClipping = peakDb > -0.5;

        this.onOutputPeakUpdate(peakDb, rmsDb, isClipping);
      }

      this.vuAnimationId = requestAnimationFrame(updateVu);
    };

    this.vuAnimationId = requestAnimationFrame(updateVu);
  }

  public cleanup() {
    if (this.vuAnimationId !== null) {
      cancelAnimationFrame(this.vuAnimationId);
      this.vuAnimationId = null;
    }
    this.stopProgramFeed();
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}

export const globalAudioEngine = new AudioEngine();
