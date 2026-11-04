import { AudioSettings, ClusterStability } from '../types';

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let analyserNode: AnalyserNode | null = null;
let synthBusGain: GainNode | null = null;
let narrationGain: GainNode | null = null;
let narrationCompressor: DynamicsCompressorNode | null = null;
let reverbNode: ConvolverNode | null = null;
let reverbGain: GainNode | null = null;

// Active Narration
let narrationSource: AudioBufferSourceNode | null = null;

// Procedural Synth Engine Nodes
let subOsc: OscillatorNode | null = null;
let padOsc1: OscillatorNode | null = null;
let padOsc2: OscillatorNode | null = null;
let synthFilter: BiquadFilterNode | null = null;
let arpTimer: number | null = null;
let isSynthRunning = false;

// Pre-allocated FFT array for zero-GC 60fps shader & UI telemetry (0..255)
const fftBuffer = new Uint8Array(64);
const spectrumBins = new Uint8Array(32);

let currentSettings: AudioSettings = {
  masterVolume: 0.85,
  musicEnabled: true,
  narrationEnabled: true,
  voiceMode: 'SINGLE'
};

let currentCue = {
  baseFreq: 146.83, // D3
  bpm: 84,
  stability: ClusterStability.SETTLED
};

const SYNTH_VOL_NORMAL = 0.28;
const SYNTH_VOL_DUCKED = 0.09;

function createReverbImpulse(ctx: AudioContext, duration = 3.2, decay = 3.8): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const n = length - i;
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
    }
  }
  return impulse;
}

export function initAudio(): AudioContext {
  if (!audioContext) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = new AudioCtx();

    masterGain = audioContext.createGain();
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 128;
    analyserNode.smoothingTimeConstant = 0.82;

    synthBusGain = audioContext.createGain();
    narrationGain = audioContext.createGain();

    narrationCompressor = audioContext.createDynamicsCompressor();
    narrationCompressor.threshold.value = -22;
    narrationCompressor.knee.value = 24;
    narrationCompressor.ratio.value = 8;
    narrationCompressor.attack.value = 0.004;
    narrationCompressor.release.value = 0.22;

    reverbNode = audioContext.createConvolver();
    reverbNode.buffer = createReverbImpulse(audioContext, 3.2, 3.6);
    reverbGain = audioContext.createGain();
    reverbGain.gain.value = 0.28;

    synthFilter = audioContext.createBiquadFilter();
    synthFilter.type = 'lowpass';
    synthFilter.frequency.value = 620;
    synthFilter.Q.value = 2.4;

    synthFilter.connect(synthBusGain);
    synthBusGain.connect(masterGain);
    synthBusGain.connect(reverbNode);

    narrationGain.connect(masterGain);
    reverbNode.connect(reverbGain);
    reverbGain.connect(masterGain);

    masterGain.connect(analyserNode);
    analyserNode.connect(audioContext.destination);

    synthBusGain.gain.value = SYNTH_VOL_NORMAL;
    narrationGain.gain.value = 1.0;
    masterGain.gain.value = currentSettings.masterVolume;
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

export function updateAudioSettings(
  volumeOrSettings: number | AudioSettings,
  musicEnabled?: boolean,
  narrationEnabled?: boolean
) {
  if (typeof volumeOrSettings === 'number') {
    currentSettings = {
      ...currentSettings,
      masterVolume: volumeOrSettings,
      musicEnabled: musicEnabled ?? currentSettings.musicEnabled,
      narrationEnabled: narrationEnabled ?? currentSettings.narrationEnabled
    };
  } else {
    currentSettings = { ...volumeOrSettings };
  }

  if (masterGain && audioContext) {
    masterGain.gain.setTargetAtTime(
      currentSettings.masterVolume,
      audioContext.currentTime,
      0.08
    );
  }
  if (!currentSettings.musicEnabled && isSynthRunning) {
    stopProceduralSynth();
  }
  if (!currentSettings.narrationEnabled && narrationSource) {
    stopNarration();
  }
}

function getScaleIntervals(stability: ClusterStability): number[] {
  switch (stability) {
    case ClusterStability.SETTLED:
      return [0, 3, 7, 10, 12, 15];
    case ClusterStability.EMERGING:
      return [0, 2, 7, 9, 12, 14];
    case ClusterStability.CONTESTED:
      return [0, 1, 6, 7, 10, 13];
    default:
      return [0, 3, 7, 10, 12];
  }
}

function triggerArpNote() {
  if (!isSynthRunning || !audioContext || !synthFilter || !currentSettings.musicEnabled) return;

  const now = audioContext.currentTime;
  const intervals = getScaleIntervals(currentCue.stability);
  const semitone = intervals[Math.floor(Math.random() * intervals.length)];
  const octaveMultiplier = Math.random() > 0.35 ? 2 : 4;
  const freq = currentCue.baseFreq * octaveMultiplier * Math.pow(2, semitone / 12);

  const osc = audioContext.createOscillator();
  const noteGain = audioContext.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);

  const peakGain = 0.06;
  noteGain.gain.setValueAtTime(0.0001, now);
  noteGain.gain.linearRampToValueAtTime(peakGain, now + 0.03);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

  osc.connect(noteGain);
  noteGain.connect(synthFilter);

  osc.start(now);
  osc.stop(now + 0.6);
}

export function startProceduralSynth(params?: {
  baseFreq?: number;
  bpm?: number;
  stability?: ClusterStability;
}) {
  if (params?.baseFreq) currentCue.baseFreq = params.baseFreq;
  if (params?.bpm) currentCue.bpm = params.bpm;
  if (params?.stability) currentCue.stability = params.stability;

  if (!currentSettings.musicEnabled) return;
  const ctx = initAudio();
  const now = ctx.currentTime;

  if (!isSynthRunning) {
    subOsc = ctx.createOscillator();
    padOsc1 = ctx.createOscillator();
    padOsc2 = ctx.createOscillator();

    const subGain = ctx.createGain();
    const padGain = ctx.createGain();

    subOsc.type = 'sine';
    padOsc1.type = 'sine';
    padOsc2.type = 'triangle';

    subGain.gain.value = 0.36;
    padGain.gain.value = 0.15;

    subOsc.connect(subGain);
    padOsc1.connect(padGain);
    padOsc2.connect(padGain);

    subGain.connect(synthFilter!);
    padGain.connect(synthFilter!);

    subOsc.start(now);
    padOsc1.start(now);
    padOsc2.start(now);
    isSynthRunning = true;
  }

  const root = currentCue.baseFreq;
  const fifthRatio =
    currentCue.stability === ClusterStability.CONTESTED
      ? Math.pow(2, 6 / 12)
      : Math.pow(2, 7 / 12);

  subOsc?.frequency.setTargetAtTime(root * 0.5, now, 0.4);
  padOsc1?.frequency.setTargetAtTime(root, now, 0.4);
  padOsc2?.frequency.setTargetAtTime(root * fifthRatio * 1.003, now, 0.4);

  if (synthFilter) {
    const cutoff = currentCue.stability === ClusterStability.CONTESTED ? 840 : 580;
    synthFilter.frequency.setTargetAtTime(cutoff, now, 0.5);
  }

  if (arpTimer !== null) {
    window.clearInterval(arpTimer);
  }
  const stepMs = Math.max(180, Math.round((60 / (currentCue.bpm || 84)) * 500));
  arpTimer = window.setInterval(triggerArpNote, stepMs);
}

export async function playBackgroundScore(cueJsonOrData?: string): Promise<void> {
  let bpm = 80;
  let baseFreq = 146.83;
  if (cueJsonOrData) {
    try {
      const parsed = JSON.parse(cueJsonOrData);
      if (parsed.tempo) bpm = Number(parsed.tempo) || 80;
      if (typeof parsed.key === 'string') {
        if (parsed.key.startsWith('C')) baseFreq = 130.81;
        else if (parsed.key.startsWith('E')) baseFreq = 164.81;
        else if (parsed.key.startsWith('F')) baseFreq = 174.61;
        else if (parsed.key.startsWith('G')) baseFreq = 196.0;
        else if (parsed.key.startsWith('A')) baseFreq = 220.0;
      }
    } catch {
      // default values
    }
  }
  startProceduralSynth({ baseFreq, bpm });
}

export function stopProceduralSynth() {
  if (arpTimer !== null) {
    window.clearInterval(arpTimer);
    arpTimer = null;
  }
  if (subOsc) {
    try {
      subOsc.stop();
      subOsc.disconnect();
    } catch {
      // ignore
    }
    subOsc = null;
  }
  if (padOsc1) {
    try {
      padOsc1.stop();
      padOsc1.disconnect();
    } catch {
      // ignore
    }
    padOsc1 = null;
  }
  if (padOsc2) {
    try {
      padOsc2.stop();
      padOsc2.disconnect();
    } catch {
      // ignore
    }
    padOsc2 = null;
  }
  isSynthRunning = false;
}

export function setBackgroundDucking(isDucked: boolean) {
  if (!synthBusGain || !audioContext) return;
  const target = isDucked ? SYNTH_VOL_DUCKED : SYNTH_VOL_NORMAL;
  synthBusGain.gain.setTargetAtTime(target, audioContext.currentTime, 0.35);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function decodeRawPcmFallback(
  buffer: ArrayBuffer,
  ctx: AudioContext,
  sampleRate = 24000
): AudioBuffer {
  const dataInt16 = new Int16Array(buffer);
  const frameCount = dataInt16.length;
  const audioBuffer = ctx.createBuffer(1, frameCount, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return audioBuffer;
}

export async function playNarration(
  base64Audio: string,
  onEnded?: () => void
): Promise<number> {
  if (!currentSettings.narrationEnabled || !base64Audio) {
    if (onEnded) onEnded();
    return 0;
  }

  const ctx = initAudio();

  if (narrationSource) {
    narrationSource.onended = null;
    try {
      narrationSource.stop();
    } catch {
      // ignore
    }
    narrationSource = null;
  }

  const arrayBuffer = base64ToArrayBuffer(base64Audio);
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } catch {
    audioBuffer = decodeRawPcmFallback(arrayBuffer, ctx, 24000);
  }

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;

  source.connect(narrationCompressor!);
  narrationCompressor!.connect(narrationGain!);
  narrationCompressor!.connect(reverbNode!);

  setBackgroundDucking(true);

  source.onended = () => {
    setBackgroundDucking(false);
    if (onEnded) onEnded();
  };

  source.start();
  narrationSource = source;

  return audioBuffer.duration;
}

export function stopNarration() {
  if (narrationSource) {
    narrationSource.onended = null;
    try {
      narrationSource.stop();
    } catch {
      // ignore
    }
    narrationSource = null;
  }
  setBackgroundDucking(false);
}

export function stopAllAudio() {
  stopProceduralSynth();
  stopNarration();
}

export function getAudioSpectrum(): Uint8Array {
  if (!analyserNode) {
    const t = performance.now() * 0.003;
    for (let i = 0; i < 32; i++) {
      spectrumBins[i] = Math.floor(14 + Math.sin(t + i * 0.4) * 10);
    }
    return spectrumBins;
  }
  analyserNode.getByteFrequencyData(fftBuffer);
  for (let i = 0; i < 32; i++) {
    spectrumBins[i] = fftBuffer[i];
  }
  return spectrumBins;
}
