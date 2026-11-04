import * as THREE from 'three';

let audioCtx: AudioContext | null = null;
let pannerNode: PannerNode | null = null;
let gainNode: GainNode | null = null;
let oscillator: OscillatorNode | null = null;
let isSpatialAudioActive = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Initializes or updates 3D Spatial Audio positioning relative to camera listener
 */
export function updateSpatialAudioListener(camera: THREE.Camera): void {
  try {
    const ctx = getAudioContext();
    const listener = ctx.listener;

    const pos = camera.position;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    if (listener.positionX) {
      listener.positionX.setValueAtTime(pos.x, ctx.currentTime);
      listener.positionY.setValueAtTime(pos.y, ctx.currentTime);
      listener.positionZ.setValueAtTime(pos.z, ctx.currentTime);
      listener.forwardX.setValueAtTime(dir.x, ctx.currentTime);
      listener.forwardY.setValueAtTime(dir.y, ctx.currentTime);
      listener.forwardZ.setValueAtTime(dir.z, ctx.currentTime);
      listener.upX.setValueAtTime(0, ctx.currentTime);
      listener.upY.setValueAtTime(1, ctx.currentTime);
      listener.upZ.setValueAtTime(0, ctx.currentTime);
    } else {
      // Fallback for legacy webkit listener methods
      listener.setPosition(pos.x, pos.y, pos.z);
      listener.setOrientation(dir.x, dir.y, dir.z, 0, 1, 0);
    }
  } catch {
    // Graceful silent fallback if AudioContext restricted
  }
}

/**
 * Emits a 3D directional harmonic chime from target node position
 */
export function emitSpatialChime(position: { x: number; y: number; z: number }, frequency = 440, duration = 1.2): void {
  try {
    const ctx = getAudioContext();

    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 50;
    panner.maxDistance = 2000;
    panner.rolloffFactor = 1.2;

    if (panner.positionX) {
      panner.positionX.setValueAtTime(position.x, ctx.currentTime);
      panner.positionY.setValueAtTime(position.y, ctx.currentTime);
      panner.positionZ.setValueAtTime(position.z, ctx.currentTime);
    } else {
      panner.setPosition(position.x, position.y, position.z);
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Harmonic decay envelope
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silent fail
  }
}
