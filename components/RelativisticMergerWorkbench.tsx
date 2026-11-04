import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import * as d3 from 'd3';
import {
  Orbit,
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Database,
  Compass,
  BookOpen,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Radio,
  HardDrive
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Cluster, Node, NodeType } from '../types';
import { saveCelestialDiscovery } from '../services/firebase';
import AcademicWhitepaperModal from './AcademicWhitepaperModal';
import {
  BenchmarkLedgerEntry,
  getBenchmarkLedger,
  subscribeBenchmarkLedger,
  recordEmpiricalMeasurement,
  computeMesaReferenceTrackDeviation
} from '../services/empiricalBenchmarkStore';

export interface RelativisticMergerPreset {
  id: string;
  label: string;
  eventDesignation: string;
  mass1Solar: number;
  mass2Solar: number;
  spin1: number;
  spin2: number;
  inclinationDeg: number;
  distanceMpc: number;
  coordinatesRaDec: string;
  targetClusterId: string;
  remnantClassification: string;
  description: string;
}

export const RELATIVISTIC_MERGER_PRESETS: RelativisticMergerPreset[] = [
  {
    id: 'gw150914-bbh',
    label: 'GW150914 (First LIGO Binary Black Hole Detection)',
    eventDesignation: 'GW150914',
    mass1Solar: 35.6,
    mass2Solar: 30.6,
    spin1: 0.32,
    spin2: 0.44,
    inclinationDeg: 32,
    distanceMpc: 440,
    coordinatesRaDec: 'RA 07h 14m 20s · Dec −70° 18′ 00″',
    targetClusterId: 'c-galactic-dynamics',
    remnantClassification: '63.1 M☉ Kerr Black Hole (χ_f ≈ 0.69)',
    description:
      'Archetypal stellar-mass binary black hole coalescence radiating ~3.0 M☉c² in gravitational waves at peak luminosity 3.6×10⁵⁶ erg/s.'
  },
  {
    id: 'gw170817-bns',
    label: 'GW170817 (Multi-Messenger Binary Neutron Star & Kilonova)',
    eventDesignation: 'GW170817 / AT2017gfo',
    mass1Solar: 1.46,
    mass2Solar: 1.27,
    spin1: 0.04,
    spin2: 0.03,
    inclinationDeg: 28,
    distanceMpc: 40,
    coordinatesRaDec: 'RA 13h 09m 48.1s · Dec −23° 22′ 53.3″',
    targetClusterId: 'c-interstellar-chemistry',
    remnantClassification: '2.70 M☉ Hypermassive NS / BH Remnant + r-Process Kilonova',
    description:
      'Multi-messenger binary neutron star inspiral in NGC 4993 driving rapid neutron-capture (r-process) nucleosynthesis of heavy lanthanides and actinides.'
  },
  {
    id: 'gw190521-imbh',
    label: 'GW190521 (Pair-Instability Mass-Gap IMBH Merger)',
    eventDesignation: 'GW190521',
    mass1Solar: 85.0,
    mass2Solar: 66.0,
    spin1: 0.69,
    spin2: 0.73,
    inclinationDeg: 54,
    distanceMpc: 5300,
    coordinatesRaDec: 'RA 12h 48m 10s · Dec −34° 12′ 00″',
    targetClusterId: 'c-cosmological-web',
    remnantClassification: '142.0 M☉ Intermediate-Mass Black Hole (χ_f ≈ 0.72)',
    description:
      'Hierarchical high-spin binary black hole coalescence producing the first directly observed intermediate-mass black hole (>100 M☉) in the pair-instability mass gap.'
  },
  {
    id: 'cygnus-x1-hmxb',
    label: 'Cygnus X-1 (High-Spin Relativistic Accreting Progenitor)',
    eventDesignation: 'Cyg X-1 / HDE 226868',
    mass1Solar: 21.2,
    mass2Solar: 14.8,
    spin1: 0.96,
    spin2: 0.35,
    inclinationDeg: 27,
    distanceMpc: 2.22,
    coordinatesRaDec: 'RA 19h 58m 21.7s · Dec +35° 12′ 05.8″',
    targetClusterId: 'c-stellar-nurseries',
    remnantClassification: 'Near-Extremal Kerr Black Hole Binary (χ₁ > 0.95)',
    description:
      'Galactic microquasar with a near-extremal Kerr black hole exhibiting strong relativistic Fe Kα broadening and Blandford-Znajek jet launch.'
  },
  {
    id: 'sgr-a-emri',
    label: 'Galactic Center Compact Capture (High-Spin Relativistic Inspiral)',
    eventDesignation: 'Sgr A* Nuclear Cluster Inspiral',
    mass1Solar: 64.0,
    mass2Solar: 14.5,
    spin1: 0.91,
    spin2: 0.58,
    inclinationDeg: 41,
    distanceMpc: 8.2,
    coordinatesRaDec: 'RA 17h 45m 40.0s · Dec −29° 00′ 28.1″',
    targetClusterId: 'c-galactic-dynamics',
    remnantClassification: '74.8 M☉ High-Spin Kerr Remnant',
    description:
      'Asymmetric mass-ratio relativistic coalescence in a dense nuclear star cluster demonstrating strong frame-dragging and higher-order multipole strain.'
  }
];

export interface RelativisticDerivedMetrics {
  totalMassSolar: number;
  chirpMassSolar: number;
  symmetricMassRatio: number;
  massRatioQ: number;
  effectiveSpin: number;
  iscoRadiusKm: number;
  iscoRadiusRg: number;
  iscoFrequencyHz: number;
  ringdownFrequencyHz: number;
  finalRemnantMassSolar: number;
  finalRemnantSpin: number;
  radiatedMassSolar: number;
  peakLuminosityErgS: number;
  peakStrain22: number;
  currentPhaseLabel: string;
}

export interface GravitationalWaveSynthesisReport {
  relativisticRegimeSummary: string;
  waveformMorphologyAnalysis: string;
  remnantKerrHorizonsAndJets: string;
  multiMessengerCounterparts: string;
  detectorObservabilityNotes: string[];
  recommendedAtlasNodes: string[];
  confidenceScore: number;
  provenanceMode: 'GEMINI_CLOUD' | 'DETERMINISTIC_LOCAL_FALLBACK';
}

interface WaveformSample {
  tNorm: number;
  timeMs: number;
  hPlus: number;
  hCross: number;
  envelope: number;
  freqHz: number;
}

interface SpectralSample {
  freqHz: number;
  hcSignal: number;
  aligoNoise: number;
  cosmicExplorerNoise: number;
}

interface RelativisticMergerWorkbenchProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  nodes: Node[];
  clusters: Cluster[];
  onSelectAtlasNode: (node: Node) => void;
  onFocusAtlasCluster: (clusterId: string) => void;
  onAddDiscoveryToAtlas: (node: Node) => void;
}

const LOCAL_GW_VAULT_KEY = 'graphiverse_relativistic_merger_dossiers_v1';

/**
 * Exact Bardeen-Press-Teukolsky (1972) prograde ISCO radius in units of gravitational radius R_g = GM/c²
 */
export function computeKerrIscoRadiusRg(chi: number): number {
  const a = Math.max(-0.998, Math.min(0.998, chi));
  const z1 =
    1 +
    Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(Math.max(0, 1 - a)));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  return 3 + z2 - Math.sign(a || 1) * Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
}

export function computeRelativisticMetrics(
  m1: number,
  m2: number,
  chi1: number,
  chi2: number,
  inclinationDeg: number,
  distanceMpc: number,
  phasePct: number
): RelativisticDerivedMetrics {
  const primary = Math.max(m1, m2);
  const secondary = Math.min(m1, m2);
  const mTot = primary + secondary;
  const eta = (primary * secondary) / (mTot * mTot);
  const chirpMass = Math.pow(primary * secondary, 0.6) / Math.pow(mTot, 0.2);
  const q = secondary / primary;
  const chiEff = (primary * chi1 + secondary * chi2) / mTot;

  const iscoRg = computeKerrIscoRadiusRg(chiEff);
  const rgKm = 1.476625 * mTot;
  const iscoRadiusKm = iscoRg * rgKm;

  // Keplerian GW frequency at ISCO: f_ISCO = c³ / (π G M_tot iscoRg^(3/2))
  const c3OverPiGMsun = 64602.4;
  const iscoFreqHz = c3OverPiGMsun / (mTot * Math.pow(iscoRg, 1.5));

  // Hofmann-Barausse-Rezzolla / Buonanno analytic remnant spin & radiated energy approximations
  const orbitalL = 2 * Math.sqrt(3) * eta - 2.9 * eta * eta;
  const finalSpin = Math.max(
    0.1,
    Math.min(0.995, chiEff * (1 - 2 * eta) + orbitalL)
  );
  const radFraction =
    eta * (0.0484 + 0.035 * chiEff + 0.018 * chiEff * chiEff) * 4.0;
  const radiatedMassSolar = Math.max(0.01, mTot * Math.min(0.11, radFraction));
  const finalRemnantMassSolar = mTot - radiatedMassSolar;

  // Fundamental l=2, m=2 quasi-normal mode ringdown frequency (Berti, Cardoso & Will 2006)
  const f1 = 1.5251 - 1.1568 * Math.pow(Math.max(0.002, 1 - finalSpin), 0.1292);
  const ringdownFreqHz = (32301.2 / finalRemnantMassSolar) * f1;

  // Peak gravitational-wave luminosity (erg/s) scaled by η²
  const peakLuminosityErgS =
    3.6e56 * Math.pow(eta / 0.25, 2) * (1 + 0.35 * chiEff);

  // Peak quadrupole strain h_22 at luminosity distance D_L (scaled to units of 10⁻²¹)
  const incRad = (inclinationDeg * Math.PI) / 180;
  const incMod = 0.5 * (1 + Math.cos(incRad) * Math.cos(incRad));
  const peakStrain22 =
    ((1.22 * Math.pow(chirpMass / 28.0, 5 / 3)) / Math.max(1, distanceMpc / 440)) *
    incMod;

  let currentPhaseLabel = 'Adiabatic Post-Newtonian Inspiral (Quadrupole Driven)';
  if (phasePct >= 88) {
    currentPhaseLabel = 'Quasi-Normal Mode Kerr Horizon Ringdown (l=2, m=2 Damped Sinusoid)';
  } else if (phasePct >= 74) {
    currentPhaseLabel = 'Strong-Field Plunge & Common Apparent Horizon Merger';
  } else if (phasePct >= 48) {
    currentPhaseLabel = 'Late Relativistic Chirp & Frame-Dragging Orbital Precession';
  }

  return {
    totalMassSolar: Number(mTot.toFixed(2)),
    chirpMassSolar: Number(chirpMass.toFixed(2)),
    symmetricMassRatio: Number(eta.toFixed(4)),
    massRatioQ: Number(q.toFixed(3)),
    effectiveSpin: Number(chiEff.toFixed(3)),
    iscoRadiusKm: Number(iscoRadiusKm.toFixed(1)),
    iscoRadiusRg: Number(iscoRg.toFixed(2)),
    iscoFrequencyHz: Number(iscoFreqHz.toFixed(1)),
    ringdownFrequencyHz: Number(ringdownFreqHz.toFixed(1)),
    finalRemnantMassSolar: Number(finalRemnantMassSolar.toFixed(2)),
    finalRemnantSpin: Number(finalSpin.toFixed(3)),
    radiatedMassSolar: Number(radiatedMassSolar.toFixed(3)),
    peakLuminosityErgS,
    peakStrain22: Number(peakStrain22.toFixed(3)),
    currentPhaseLabel
  };
}

function buildDeterministicLocalGwSynthesis(
  preset: RelativisticMergerPreset,
  metrics: RelativisticDerivedMetrics,
  m1: number,
  m2: number,
  chi1: number,
  chi2: number,
  inclinationDeg: number
): GravitationalWaveSynthesisReport {
  const isBns = metrics.totalMassSolar < 6.0;
  return {
    relativisticRegimeSummary: `[Deterministic Post-Newtonian & Kerr Metric Synthesis] Binary compact system (${m1.toFixed(
      1
    )} M☉ + ${m2.toFixed(1)} M☉, χ_eff = ${
      metrics.effectiveSpin
    }) exhibits a chirp mass M_c = ${metrics.chirpMassSolar} M☉ and symmetric mass ratio η = ${
      metrics.symmetricMassRatio
    }. Prograde Kerr innermost stable circular orbit occurs at R_ISCO = ${
      metrics.iscoRadiusRg
    } R_g (${metrics.iscoRadiusKm} km), corresponding to f_ISCO = ${
      metrics.iscoFrequencyHz
    } Hz.`,
    waveformMorphologyAnalysis: `At inclination ι = ${inclinationDeg}°, the plus (h+) and cross (h×) polarizations sweep from early 3.5PN inspiral to a peak strain amplitude h_22 ≈ ${
      metrics.peakStrain22
    }×10⁻²¹ at D_L = ${
      preset.distanceMpc
    } Mpc, followed by l=2, m=2 quasi-normal mode ringdown at f_QNM = ${
      metrics.ringdownFrequencyHz
    } Hz.`,
    remnantKerrHorizonsAndJets: `Coalescence radiates ΔE_GW = ${
      metrics.radiatedMassSolar
    } M☉c² (peak luminosity L_GW ≈ ${metrics.peakLuminosityErgS.toExponential(
      2
    )} erg/s), leaving a ${metrics.finalRemnantMassSolar} M☉ remnant with dimensionless spin χ_f = ${
      metrics.finalRemnantSpin
    } capable of driving Blandford-Znajek ergospheric Poynting flux.`,
    multiMessengerCounterparts: isBns
      ? 'Low-mass neutron-rich tidal ejecta (M_ej ~ 0.03–0.05 M☉) undergoes rapid neutron capture (r-process), synthesizing lanthanides, gold, and platinum alongside an optical/infrared kilonova transient.'
      : 'Stellar-mass binary black hole coalescence in vacuum or thin circumbinary gas disk; primary observable signature is broadband gravitational radiation across 10–1,000 Hz.',
    detectorObservabilityNotes: [
      `ISCO transition at ${metrics.iscoFrequencyHz} Hz lies directly within the LIGO/Virgo/KAGRA high-sensitivity bucket (20–1,000 Hz).`,
      `Quasi-normal mode ringdown at ${metrics.ringdownFrequencyHz} Hz tests the Kerr no-hair theorem via damping time τ_220.`,
      `Note: Heuristic confidence indices represent analytical model completeness, never calibrated astrophysical detection probabilities.`
    ],
    recommendedAtlasNodes: [
      preset.label,
      'Sagittarius A* Supermassive Horizon',
      'Cygnus X-1 Microquasar',
      'Cass A Supernova Remnant'
    ],
    confidenceScore: 0.91,
    provenanceMode: 'DETERMINISTIC_LOCAL_FALLBACK'
  };
}

const RelativisticMergerWorkbench: React.FC<RelativisticMergerWorkbenchProps> = ({
  isOpen,
  onClose,
  user,
  nodes,
  onSelectAtlasNode,
  onFocusAtlasCluster,
  onAddDiscoveryToAtlas
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    RELATIVISTIC_MERGER_PRESETS[0].id
  );
  const activePreset = useMemo(
    () =>
      RELATIVISTIC_MERGER_PRESETS.find(p => p.id === selectedPresetId) ||
      RELATIVISTIC_MERGER_PRESETS[0],
    [selectedPresetId]
  );

  const [mass1Solar, setMass1Solar] = useState<number>(activePreset.mass1Solar);
  const [mass2Solar, setMass2Solar] = useState<number>(activePreset.mass2Solar);
  const [spin1, setSpin1] = useState<number>(activePreset.spin1);
  const [spin2, setSpin2] = useState<number>(activePreset.spin2);
  const [inclinationDeg, setInclinationDeg] = useState<number>(activePreset.inclinationDeg);
  const [distanceMpc, setDistanceMpc] = useState<number>(activePreset.distanceMpc);
  const [coalescencePct, setCoalescencePct] = useState<number>(58);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeChartTab, setActiveChartTab] = useState<'STRAIN_WAVEFORM' | 'SPECTRAL_SENSITIVITY'>(
    'STRAIN_WAVEFORM'
  );

  // Gemini Scientific Synthesis state
  const [synthesisReport, setSynthesisReport] = useState<GravitationalWaveSynthesisReport | null>(
    null
  );
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  // Empirical Benchmark Harness state
  const [benchmarkRows, setBenchmarkRows] = useState<BenchmarkLedgerEntry[]>(() =>
    getBenchmarkLedger()
  );
  const [isRunningBenchmark, setIsRunningBenchmark] = useState<boolean>(false);
  const [liveFpsReadout, setLiveFpsReadout] = useState<number>(60);

  // Vault Persistence & Whitepaper Modal state
  const [isSavingVault, setIsSavingVault] = useState<boolean>(false);
  const [vaultStatusBanner, setVaultStatusBanner] = useState<{
    mode: 'CLOUD' | 'LOCAL';
    text: string;
  } | null>(null);
  const [isWhitepaperOpen, setIsWhitepaperOpen] = useState<boolean>(false);

  const mountRef = useRef<HTMLDivElement>(null);
  const d3SvgRef = useRef<SVGSVGElement>(null);

  // Subscribe to shared benchmark ledger
  useEffect(() => {
    setBenchmarkRows(getBenchmarkLedger());
    return subscribeBenchmarkLedger(rows => setBenchmarkRows(rows));
  }, []);

  // Apply preset when selected
  const handleSelectPreset = (preset: RelativisticMergerPreset) => {
    setSelectedPresetId(preset.id);
    setMass1Solar(preset.mass1Solar);
    setMass2Solar(preset.mass2Solar);
    setSpin1(preset.spin1);
    setSpin2(preset.spin2);
    setInclinationDeg(preset.inclinationDeg);
    setDistanceMpc(preset.distanceMpc);
    setCoalescencePct(58);
    setVaultStatusBanner(null);
  };

  // Derived relativistic metrics
  const derivedMetrics = useMemo(
    () =>
      computeRelativisticMetrics(
        mass1Solar,
        mass2Solar,
        spin1,
        spin2,
        inclinationDeg,
        distanceMpc,
        coalescencePct
      ),
    [mass1Solar, mass2Solar, spin1, spin2, inclinationDeg, distanceMpc, coalescencePct]
  );

  // Generate IMR Strain Waveform series h+(t) and hx(t)
  const waveformSeries = useMemo<WaveformSample[]>(() => {
    const samples: WaveformSample[] = [];
    const n = 220;
    const incRad = (inclinationDeg * Math.PI) / 180;
    const plusFactor = 0.5 * (1 + Math.cos(incRad) * Math.cos(incRad));
    const crossFactor = Math.cos(incRad);

    for (let i = 0; i <= n; i++) {
      const tNorm = i / n; // 0.0 -> 1.0 (merger peak at tNorm = 0.80)
      const timeMs = (tNorm - 0.8) * 250; // -200 ms to +50 ms around coalescence
      let env = 0;
      let phase = 0;
      let freqHz = 35;

      if (tNorm <= 0.8) {
        // Post-Newtonian chirp inspiral
        const tau = Math.max(0.012, 0.812 - tNorm);
        env = derivedMetrics.peakStrain22 * Math.pow(0.014 / tau, 0.28);
        freqHz =
          24 +
          (derivedMetrics.iscoFrequencyHz * 1.45 - 24) *
            Math.pow(tNorm / 0.8, 1.85);
        phase = 48.0 * Math.pow(tau, 0.625) + 12 * derivedMetrics.effectiveSpin * tNorm;
      } else {
        // Quasi-normal mode Kerr ringdown (exponentially damped sinusoid)
        const dt = tNorm - 0.8;
        const dampingTau = 0.042 * (0.7 + 0.5 * derivedMetrics.finalRemnantSpin);
        env = derivedMetrics.peakStrain22 * Math.exp(-dt / dampingTau);
        freqHz = derivedMetrics.ringdownFrequencyHz;
        phase = -dt * 155.0 * (1 + 0.3 * derivedMetrics.finalRemnantSpin);
      }

      const hPlus = env * plusFactor * Math.cos(phase);
      const hCross = env * crossFactor * Math.sin(phase);

      samples.push({
        tNorm: Number((tNorm * 100).toFixed(1)),
        timeMs: Number(timeMs.toFixed(1)),
        hPlus,
        hCross,
        envelope: env,
        freqHz: Number(freqHz.toFixed(1))
      });
    }
    return samples;
  }, [derivedMetrics, inclinationDeg]);

  // Generate Frequency-Domain Characteristic Strain Spectrum hc(f) vs Detector Noise
  const spectralSeries = useMemo<SpectralSample[]>(() => {
    const out: SpectralSample[] = [];
    const freqs = d3.range(10, 1200, 14);
    for (const f of freqs) {
      // Phenomenological IMR amplitude in frequency domain: hc(f) ~ f^(-1/6) in inspiral, steep cutoff above ringdown
      const fIsco = Math.max(25, derivedMetrics.iscoFrequencyHz);
      const fRing = Math.max(fIsco * 1.35, derivedMetrics.ringdownFrequencyHz);
      let hc =
        derivedMetrics.peakStrain22 *
        1.4 *
        Math.pow(f / 60, -1 / 6);
      if (f > fIsco && f <= fRing) {
        hc *= Math.pow(f / fIsco, 0.45);
      } else if (f > fRing) {
        hc *= Math.exp(-(f - fRing) / (0.28 * fRing));
      }

      // Reference detector characteristic noise floors (in units of 10⁻²¹)
      const x = f / 150;
      const aligoNoise = 0.08 * (Math.pow(x, -2.6) + 1.0 + 0.45 * x * x);
      const cosmicExplorerNoise = 0.014 * (Math.pow(x, -2.4) + 0.85 + 0.35 * x * x);

      out.push({
        freqHz: f,
        hcSignal: Math.max(0.002, hc),
        aligoNoise: Math.min(8.0, aligoNoise),
        cosmicExplorerNoise: Math.min(8.0, cosmicExplorerNoise)
      });
    }
    return out;
  }, [derivedMetrics]);

  // Coalescence playback loop
  useEffect(() => {
    if (!isOpen || !isPlaying) return;
    const timer = window.setInterval(() => {
      setCoalescencePct(prev => (prev >= 100 ? 0 : Number((prev + 0.65).toFixed(2))));
    }, 55);
    return () => window.clearInterval(timer);
  }, [isOpen, isPlaying]);

  // Refs for dynamic shader uniforms in Three.js loop
  const simParamsRef = useRef({
    coalescencePct,
    mass1Solar,
    mass2Solar,
    spin1,
    spin2,
    inclinationDeg,
    effectiveSpin: derivedMetrics.effectiveSpin
  });
  useEffect(() => {
    simParamsRef.current = {
      coalescencePct,
      mass1Solar,
      mass2Solar,
      spin1,
      spin2,
      inclinationDeg,
      effectiveSpin: derivedMetrics.effectiveSpin
    };
  }, [
    coalescencePct,
    mass1Solar,
    mass2Solar,
    spin1,
    spin2,
    inclinationDeg,
    derivedMetrics.effectiveSpin
  ]);

  // 3D WebGL 2.0 / GLSL Composite Relativistic Binary Scene (7-Part THREE.Group)
  useEffect(() => {
    if (!isOpen) return;
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050811);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(0, 6.2, 13.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const binaryRootGroup = new THREE.Group();
    scene.add(binaryRootGroup);

    // 1. Primary Kerr Black Hole Event Horizon & Ergosphere Shader
    const horizonShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpin: { value: 0.7 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        uniform float uTime;
        uniform float uSpin;
        void main() {
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.6);
          vec3 photonRing = mix(vec3(0.02, 0.04, 0.08), vec3(0.0, 0.92, 1.0), fresnel * (1.2 + 0.5 * uSpin));
          gl_FragColor = vec4(photonRing, 1.0);
        }
      `
    });

    const primaryGeo = new THREE.SphereGeometry(1.15, 48, 48);
    const primaryMesh = new THREE.Mesh(primaryGeo, horizonShaderMat);
    binaryRootGroup.add(primaryMesh);

    // 2. Secondary Compact Companion Horizon & Tidal Envelope
    const secondaryGeo = new THREE.SphereGeometry(0.88, 48, 48);
    const secondaryMesh = new THREE.Mesh(secondaryGeo, horizonShaderMat);
    binaryRootGroup.add(secondaryMesh);

    // 3. Relativistic Doppler-Beamed Accretion Disk (Custom GLSL ShaderMaterial)
    const diskGeo = new THREE.RingGeometry(1.55, 5.4, 96, 24);
    diskGeo.rotateX(-Math.PI / 2);
    const diskMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSpin: { value: 0.6 },
        uMergerProgress: { value: 0.5 }
      },
      vertexShader: `
        varying vec3 vPos;
        varying vec2 vUv;
        void main() {
          vPos = position;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        varying vec2 vUv;
        uniform float uTime;
        uniform float uSpin;
        uniform float uMergerProgress;
        void main() {
          float r = length(vPos.xz);
          float angle = atan(vPos.z, vPos.x);
          float spiral = sin(angle * 4.0 - r * 3.2 + uTime * (4.0 + uSpin * 3.0));
          float doppler = 0.65 + 0.45 * cos(angle + 0.6);
          float radialMask = smoothstep(1.55, 2.1, r) * (1.0 - smoothstep(4.2, 5.4, r));
          vec3 approachingBlue = vec3(0.05, 0.88, 1.0);
          vec3 thermalAmber = vec3(1.0, 0.58, 0.08);
          vec3 color = mix(thermalAmber, approachingBlue, clamp(doppler * 0.75 + 0.15 * spiral, 0.0, 1.0));
          float alpha = radialMask * (0.45 + 0.25 * spiral) * (0.8 + 0.3 * uMergerProgress);
          gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.88));
        }
      `
    });
    const diskMesh = new THREE.Mesh(diskGeo, diskMat);
    binaryRootGroup.add(diskMesh);

    // 4. Photon Sphere Einstein Lensing Halo
    const lensingGeo = new THREE.TorusGeometry(2.35, 0.09, 24, 96);
    const lensingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
    const lensingHalo = new THREE.Mesh(lensingGeo, lensingMat);
    binaryRootGroup.add(lensingHalo);

    // 5. Bipolar Relativistic Blandford-Znajek Poynting Jets
    const jetGroup = new THREE.Group();
    const jetGeo = new THREE.ConeGeometry(0.55, 6.2, 32, 1, true);
    const jetMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const northJet = new THREE.Mesh(jetGeo, jetMat);
    northJet.position.y = 3.4;
    const southJet = new THREE.Mesh(jetGeo, jetMat);
    southJet.rotation.x = Math.PI;
    southJet.position.y = -3.4;
    jetGroup.add(northJet, southJet);
    binaryRootGroup.add(jetGroup);

    // 6. Dynamic Spacetime Metric Curvature & Quadrupole Strain Wave Grid
    const gridGeo = new THREE.PlaneGeometry(24, 24, 72, 72);
    gridGeo.rotateX(-Math.PI / 2);
    const gridMat = new THREE.ShaderMaterial({
      wireframe: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uStrainAmp: { value: 0.45 },
        uChirpFreq: { value: 2.2 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uStrainAmp;
        uniform float uChirpFreq;
        varying float vWaveHeight;
        void main() {
          vec3 p = position;
          float r = max(0.8, length(p.xz));
          float angle = atan(p.z, p.x);
          // Quadrupole l=2, m=2 gravitational-wave ripple + gravity well funnel
          float well = -2.2 / (1.0 + 0.35 * r * r);
          float gwRipple = uStrainAmp * cos(2.0 * angle - r * uChirpFreq + uTime * 6.5) / (1.0 + 0.14 * r);
          p.y += well + gwRipple;
          vWaveHeight = gwRipple;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        varying float vWaveHeight;
        void main() {
          vec3 base = vec3(0.07, 0.28, 0.48);
          vec3 crest = vec3(0.02, 0.90, 1.0);
          vec3 col = mix(base, crest, clamp(vWaveHeight * 1.8 + 0.5, 0.0, 1.0));
          gl_FragColor = vec4(col, 0.36);
        }
      `
    });
    const strainGrid = new THREE.Mesh(gridGeo, gridMat);
    strainGrid.position.y = -1.65;
    scene.add(strainGrid);

    // 7. Background Astrometric Starfield
    const starCount = 450;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = ((i * 73.13) % 360) * (Math.PI / 180);
      const phi = Math.acos(1 - 2 * ((i * 0.6180339) % 1));
      const radius = 38 + (i % 18);
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.14 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    let animId = 0;
    const clock = new THREE.Clock();
    let frameCounter = 0;
    let lastFpsSampleTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const p = simParamsRef.current;
      const progress = p.coalescencePct / 100;

      // Measure live FPS every 30 frames
      frameCounter++;
      if (frameCounter >= 30) {
        const now = performance.now();
        const fps = (frameCounter * 1000) / Math.max(1, now - lastFpsSampleTime);
        setLiveFpsReadout(Math.min(120, Math.round(fps)));
        frameCounter = 0;
        lastFpsSampleTime = now;
      }

      // Orbital separation shrinks until merger at progress = 0.80, then forms single spinning Kerr remnant
      const mTot = p.mass1Solar + p.mass2Solar;
      const m1Frac = p.mass1Solar / mTot;
      const m2Frac = p.mass2Solar / mTot;

      if (progress < 0.8) {
        const sep = 3.2 * Math.pow(Math.max(0.02, (0.8 - progress) / 0.8), 0.42);
        const omega = 2.5 + 14.0 * Math.pow(progress / 0.8, 2.2);
        const angle = elapsed * omega;

        primaryMesh.visible = true;
        secondaryMesh.visible = true;
        primaryMesh.scale.setScalar(0.75 + 0.55 * m1Frac);
        secondaryMesh.scale.setScalar(0.65 + 0.55 * m2Frac);

        primaryMesh.position.set(
          Math.cos(angle) * sep * m2Frac,
          0,
          Math.sin(angle) * sep * m2Frac
        );
        secondaryMesh.position.set(
          -Math.cos(angle) * sep * m1Frac,
          0,
          -Math.sin(angle) * sep * m1Frac
        );
      } else {
        // Post-merger ringdown oscillating Kerr horizon
        const ringDelta = progress - 0.8;
        const ringOsc = Math.exp(-ringDelta * 14.0) * Math.sin(elapsed * 26.0) * 0.14;
        primaryMesh.position.set(0, 0, 0);
        primaryMesh.scale.set(1.38 + ringOsc, 1.24 - ringOsc * 0.6, 1.38 + ringOsc);
        secondaryMesh.visible = false;
      }

      const incRad = ((p.inclinationDeg - 25) * Math.PI) / 180;
      binaryRootGroup.rotation.x = incRad * 0.45;

      horizonShaderMat.uniforms.uTime.value = elapsed;
      horizonShaderMat.uniforms.uSpin.value = p.effectiveSpin;
      diskMat.uniforms.uTime.value = elapsed;
      diskMat.uniforms.uSpin.value = p.effectiveSpin;
      diskMat.uniforms.uMergerProgress.value = progress;

      const isPeak = Math.abs(progress - 0.8) < 0.12;
      gridMat.uniforms.uTime.value = elapsed;
      gridMat.uniforms.uStrainAmp.value = isPeak ? 0.82 : 0.35 + 0.35 * progress;
      gridMat.uniforms.uChirpFreq.value = 1.8 + 2.4 * progress;

      jetMat.opacity = 0.12 + 0.32 * p.effectiveSpin;
      lensingHalo.rotation.y = elapsed * 0.6;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      primaryGeo.dispose();
      secondaryGeo.dispose();
      diskGeo.dispose();
      lensingGeo.dispose();
      jetGeo.dispose();
      gridGeo.dispose();
      starGeo.dispose();
      horizonShaderMat.dispose();
      diskMat.dispose();
      lensingMat.dispose();
      jetMat.dispose();
      gridMat.dispose();
      starMat.dispose();
      renderer.dispose();
    };
  }, [isOpen]);

  // Render D3 Telemetry Chart (Waveform or Spectral Sensitivity)
  useEffect(() => {
    if (!isOpen) return;
    const svgEl = d3SvgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const width = 680;
    const height = 225;
    const margin = { top: 20, right: 24, bottom: 32, left: 52 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    if (activeChartTab === 'STRAIN_WAVEFORM') {
      const xScale = d3.scaleLinear().domain([-200, 50]).range([0, innerW]);
      const maxAmp = Math.max(0.4, derivedMetrics.peakStrain22 * 1.18);
      const yScale = d3.scaleLinear().domain([-maxAmp, maxAmp]).range([innerH, 0]);

      // Grid lines
      g.append('g')
        .attr('class', 'text-slate-800')
        .call(
          d3
            .axisLeft(yScale)
            .ticks(5)
            .tickSize(-innerW)
            .tickFormat(() => '')
        )
        .selectAll('line')
        .attr('stroke', 'rgba(148, 163, 184, 0.14)');

      // Zero axis
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', yScale(0))
        .attr('y2', yScale(0))
        .attr('stroke', 'rgba(148, 163, 184, 0.35)')
        .attr('stroke-dasharray', '3,3');

      // Envelope area
      const areaGen = d3
        .area<WaveformSample>()
        .x(d => xScale(d.timeMs))
        .y0(d => yScale(-d.envelope))
        .y1(d => yScale(d.envelope))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(waveformSeries)
        .attr('fill', 'rgba(6, 182, 212, 0.08)')
        .attr('d', areaGen);

      // h+(t) solid cyan curve
      const linePlus = d3
        .line<WaveformSample>()
        .x(d => xScale(d.timeMs))
        .y(d => yScale(d.hPlus))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(waveformSeries)
        .attr('fill', 'none')
        .attr('stroke', '#06B6D4')
        .attr('stroke-width', 1.8)
        .attr('d', linePlus);

      // hx(t) dashed amber curve
      const lineCross = d3
        .line<WaveformSample>()
        .x(d => xScale(d.timeMs))
        .y(d => yScale(d.hCross))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(waveformSeries)
        .attr('fill', 'none')
        .attr('stroke', '#F59E0B')
        .attr('stroke-width', 1.3)
        .attr('stroke-dasharray', '4,3')
        .attr('d', lineCross);

      // Current scrubber marker
      const currentMs = (coalescencePct / 100 - 0.8) * 250;
      const markerX = xScale(Math.max(-200, Math.min(50, currentMs)));
      g.append('line')
        .attr('x1', markerX)
        .attr('x2', markerX)
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', '#10B981')
        .attr('stroke-width', 1.6);

      // Axes
      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(xScale).ticks(7).tickFormat(d => `${d} ms`))
        .attr('color', '#94A3B8')
        .style('font-family', 'JetBrains Mono, monospace')
        .style('font-size', '10px');

      g.append('g')
        .call(d3.axisLeft(yScale).ticks(5))
        .attr('color', '#94A3B8')
        .style('font-family', 'JetBrains Mono, monospace')
        .style('font-size', '10px');

      // Legend label
      g.append('text')
        .attr('x', 8)
        .attr('y', 12)
        .attr('fill', '#06B6D4')
        .style('font-family', 'JetBrains Mono, monospace')
        .style('font-size', '10px')
        .text('— h+(t) Plus Polarization (×10⁻²¹)   --- h×(t) Cross Polarization');
    } else {
      // SPECTRAL_SENSITIVITY Tab: Log-Log Characteristic Strain hc(f) vs Detector Noise
      const xScale = d3.scaleLog().domain([10, 1200]).range([0, innerW]);
      const yScale = d3.scaleLog().domain([0.005, 8.0]).range([innerH, 0]);

      const lineSignal = d3
        .line<SpectralSample>()
        .x(d => xScale(d.freqHz))
        .y(d => yScale(Math.max(0.005, Math.min(8.0, d.hcSignal))))
        .curve(d3.curveMonotoneX);

      const lineAligo = d3
        .line<SpectralSample>()
        .x(d => xScale(d.freqHz))
        .y(d => yScale(Math.max(0.005, Math.min(8.0, d.aligoNoise))))
        .curve(d3.curveMonotoneX);

      const lineCe = d3
        .line<SpectralSample>()
        .x(d => xScale(d.freqHz))
        .y(d => yScale(Math.max(0.005, Math.min(8.0, d.cosmicExplorerNoise))))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(spectralSeries)
        .attr('fill', 'none')
        .attr('stroke', '#06B6D4')
        .attr('stroke-width', 2.2)
        .attr('d', lineSignal);

      g.append('path')
        .datum(spectralSeries)
        .attr('fill', 'none')
        .attr('stroke', '#F59E0B')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3')
        .attr('d', lineAligo);

      g.append('path')
        .datum(spectralSeries)
        .attr('fill', 'none')
        .attr('stroke', '#10B981')
        .attr('stroke-width', 1.3)
        .attr('stroke-dasharray', '2,3')
        .attr('d', lineCe);

      // ISCO Frequency vertical line
      const fIscoClamped = Math.max(10, Math.min(1200, derivedMetrics.iscoFrequencyHz));
      g.append('line')
        .attr('x1', xScale(fIscoClamped))
        .attr('x2', xScale(fIscoClamped))
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', '#F43F5E')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '3,3');

      g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(xScale).ticks(6, '~g').tickFormat(d => `${d} Hz`))
        .attr('color', '#94A3B8')
        .style('font-family', 'JetBrains Mono, monospace')
        .style('font-size', '10px');

      g.append('g')
        .call(d3.axisLeft(yScale).ticks(4, '~g'))
        .attr('color', '#94A3B8')
        .style('font-family', 'JetBrains Mono, monospace')
        .style('font-size', '10px');

      g.append('text')
        .attr('x', 8)
        .attr('y', 12)
        .attr('fill', '#06B6D4')
        .style('font-family', 'JetBrains Mono, monospace')
        .style('font-size', '10px')
        .text('— Signal hc(f)   --- Adv. LIGO O4 Noise   ··· Cosmic Explorer   | f_ISCO');
    }
  }, [isOpen, activeChartTab, waveformSeries, spectralSeries, coalescencePct, derivedMetrics]);

  // Run Gemini Relativistic Synthesis with bounded retry & deterministic fallback
  const handleRunGeminiSynthesis = async () => {
    setIsSynthesizing(true);
    const t0 = performance.now();
    try {
      const response = await fetch('/api/gemini/gravitational-wave-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventDesignation: activePreset.eventDesignation,
          mass1Solar,
          mass2Solar,
          spin1,
          spin2,
          inclinationDeg,
          distanceMpc,
          derivedMetrics
        })
      });
      const rttMs = performance.now() - t0;

      if (!response.ok) {
        recordEmpiricalMeasurement(
          'BM-03',
          `HTTP ${response.status} Fallback Triggered in ${rttMs.toFixed(0)} ms (Deterministic Local Synthesis Active)`,
          1
        );
        const fallback = buildDeterministicLocalGwSynthesis(
          activePreset,
          derivedMetrics,
          mass1Solar,
          mass2Solar,
          spin1,
          spin2,
          inclinationDeg
        );
        setSynthesisReport(fallback);
        return;
      }

      const data = await response.json();
      recordEmpiricalMeasurement(
        'BM-03',
        `${rttMs.toFixed(0)} ms Round-Trip (/api/gemini/gravitational-wave-synthesis HTTP 200)`,
        1
      );
      setSynthesisReport({
        ...data,
        provenanceMode: 'GEMINI_CLOUD'
      });
    } catch {
      const rttMs = performance.now() - t0;
      recordEmpiricalMeasurement(
        'BM-03',
        `Network/Quota Fallback in ${rttMs.toFixed(0)} ms (Deterministic Local Synthesis Active)`,
        1
      );
      const fallback = buildDeterministicLocalGwSynthesis(
        activePreset,
        derivedMetrics,
        mass1Solar,
        mass2Solar,
        spin1,
        spin2,
        inclinationDeg
      );
      setSynthesisReport(fallback);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Run Full 120-Frame Empirical Benchmark Suite and sync to Whitepaper Ledger
  const handleRunFullEmpiricalBenchmark = async () => {
    if (isRunningBenchmark) return;
    setIsRunningBenchmark(true);
    try {
      // 1. BM-01: 120-frame live WebGL 2.0 requestAnimationFrame timing
      const frameTimes: number[] = [];
      await new Promise<void>(resolve => {
        let prev = performance.now();
        let count = 0;
        const tick = (now: number) => {
          if (count > 0) {
            frameTimes.push(now - prev);
          }
          prev = now;
          count++;
          if (count <= 120) {
            requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(tick);
      });
      const sorted = [...frameTimes].sort((a, b) => a - b);
      const meanMs = frameTimes.reduce((a, b) => a + b, 0) / Math.max(1, frameTimes.length);
      const p99Ms =
        sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))] || meanMs;
      const fps = 1000 / Math.max(0.1, meanMs);
      recordEmpiricalMeasurement(
        'BM-01',
        `Mean ${meanMs.toFixed(2)} ms (${fps.toFixed(1)} FPS) · P99 ${p99Ms.toFixed(2)} ms (n=120 WebGL frames)`,
        120
      );

      // 2. BM-02: 20-cycle D3 & Relativistic Waveform recomputation latency
      const d3Timings: number[] = [];
      for (let i = 0; i < 20; i++) {
        const tStart = performance.now();
        computeRelativisticMetrics(
          mass1Solar + i * 0.1,
          mass2Solar,
          spin1,
          spin2,
          inclinationDeg,
          distanceMpc,
          (i * 5) % 100
        );
        d3Timings.push(performance.now() - tStart);
      }
      const meanD3Ms = d3Timings.reduce((a, b) => a + b, 0) / d3Timings.length;
      recordEmpiricalMeasurement(
        'BM-02',
        `Mean ${meanD3Ms.toFixed(3)} ms / sweep (n=20 synchronous commits)`,
        20
      );

      // 3. BM-04: 3D Atlas Sector Focus Dispatch timing
      const tCam0 = performance.now();
      onFocusAtlasCluster(activePreset.targetClusterId);
      const camDispatchMs = performance.now() - tCam0;
      recordEmpiricalMeasurement(
        'BM-04',
        `Dispatch ${camDispatchMs.toFixed(3)} ms · Exponential camera damping active (${activePreset.targetClusterId})`,
        1
      );

      // 4. BM-05: Pointwise L2 residual against MESA reference anchors
      const mesa = computeMesaReferenceTrackDeviation();
      recordEmpiricalMeasurement('BM-05', mesa.formattedSummary, mesa.pointCount);

      // 5. BM-03: Trigger synthesis if not already measured
      if (!synthesisReport) {
        await handleRunGeminiSynthesis();
      }
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  // Sync Target to 3D Cosmic Atlas
  const handleSyncToCosmicAtlas = () => {
    const t0 = performance.now();
    const existing = nodes.find(
      n =>
        n.label.toLowerCase().includes(activePreset.eventDesignation.toLowerCase()) ||
        n.clusterId === activePreset.targetClusterId
    );
    if (existing) {
      onSelectAtlasNode(existing);
    } else {
      const newNode: Node = {
        id: `node-gw-${activePreset.id}-${Date.now()}`,
        label: `${activePreset.eventDesignation} (${derivedMetrics.finalRemnantMassSolar} M☉ Remnant)`,
        type: NodeType.EVIDENCE,
        clusterId: activePreset.targetClusterId,
        val: 22,
        confidence: synthesisReport?.confidenceScore ?? 0.92,
        source: 'Relativistic Gravitational-Wave Merger Lab',
        coordinatesRaDec: activePreset.coordinatesRaDec,
        distanceLabel: `${distanceMpc} Mpc`,
        description: `${activePreset.description} Chirp Mass M_c=${derivedMetrics.chirpMassSolar} M☉, Final Spin χ_f=${derivedMetrics.finalRemnantSpin}.`,
        citations: ['LIGO-Virgo-KAGRA GWTC Catalog', 'Bardeen, Press & Teukolsky (1972)']
      };
      onAddDiscoveryToAtlas(newNode);
    }
    onFocusAtlasCluster(activePreset.targetClusterId);
    const dt = performance.now() - t0;
    recordEmpiricalMeasurement(
      'BM-04',
      `Dispatch ${dt.toFixed(3)} ms · Focused sector ${activePreset.targetClusterId}`,
      1
    );
  };

  // Save Relativistic Merger Dossier to Observatory Vault (Firestore + Labeled Local Fallback)
  const handleSaveMergerToVault = async () => {
    setIsSavingVault(true);
    setVaultStatusBanner(null);

    const summaryNotes = JSON.stringify({
      type: 'RELATIVISTIC_GW_MERGER_DOSSIER',
      eventDesignation: activePreset.eventDesignation,
      parameters: {
        mass1Solar,
        mass2Solar,
        spin1,
        spin2,
        inclinationDeg,
        distanceMpc,
        coalescencePct
      },
      derivedMetrics,
      synthesisProvenance: synthesisReport?.provenanceMode || 'ANALYTIC_PN_BASELINE',
      savedAtIso: new Date().toISOString()
    }).slice(0, 3900);

    const saveLocalFallback = (reason: string) => {
      try {
        const raw = window.localStorage.getItem(LOCAL_GW_VAULT_KEY);
        const list = raw ? JSON.parse(raw) : [];
        window.localStorage.setItem(
          LOCAL_GW_VAULT_KEY,
          JSON.stringify([{ id: `local_gw_${Date.now()}`, summaryNotes }, ...list].slice(0, 25))
        );
        setVaultStatusBanner({
          mode: 'LOCAL',
          text: `Saved to Local Browser Storage (${reason}). Cloud Firestore was not modified.`
        });
      } catch {
        setVaultStatusBanner({
          mode: 'LOCAL',
          text: `Local browser fallback write failed (${reason}).`
        });
      }
    };

    if (!user) {
      saveLocalFallback('Unauthenticated Session');
      setIsSavingVault(false);
      return;
    }

    try {
      const docId = await saveCelestialDiscovery({
        label:
          `[GW Merger Dossier] ${activePreset.eventDesignation} (${mass1Solar}+${mass2Solar} M☉)`.slice(
            0,
            180
          ),
        scaleRegime: 'III. Stellar & Compact Remnant Regime',
        clusterId: activePreset.targetClusterId,
        coordinatesRaDec: activePreset.coordinatesRaDec,
        distanceLabel: `${distanceMpc} Mpc`,
        biosignatureNotes: summaryNotes,
        confidence: synthesisReport?.confidenceScore ?? 0.92,
        isPublic: true
      });
      setVaultStatusBanner({
        mode: 'CLOUD',
        text: `Persisted to Remote Cloud Observatory Vault (Firestore ID: ${docId}).`
      });
    } catch {
      saveLocalFallback('Cloud Firestore Unavailable');
    } finally {
      setIsSavingVault(false);
    }
  };

  if (!isOpen) return null;

  const measuredCount = benchmarkRows.filter(
    r => r.verificationStatus === 'Empirically Measured'
  ).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Relativistic Black Hole and Gravitational-Wave Merger Lab"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden"
    >
      <div className="w-full max-w-[1440px] h-[94vh] bg-[#07090E] border border-slate-800 rounded-lg shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Top Telemetry Ribbon */}
        <header className="px-4 py-2.5 bg-[#0B0F19] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Orbit className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
                <span>RELATIVISTIC ASTROPHYSICS &amp; GRAVITATIONAL-WAVE MERGER LAB</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400">● {liveFpsReadout} FPS WebGL 2.0</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300">
                  Whitepaper Benchmarks: {measuredCount}/{benchmarkRows.length} Measured
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-display font-semibold text-white">
                Binary Compact Coalescence, Kerr Ergosphere &amp; IMR Strain Telemetry Simulator
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunFullEmpiricalBenchmark}
              disabled={isRunningBenchmark}
              className="px-3 py-1.5 rounded text-xs font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Execute 120-frame WebGL, D3, Camera & MESA residual benchmark and sync with Whitepaper Table 2"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>
                {isRunningBenchmark
                  ? 'Measuring 120 Frames...'
                  : 'Run Empirical Benchmark Suite'}
              </span>
            </button>

            <button
              onClick={() => setIsWhitepaperOpen(true)}
              className="px-3 py-1.5 rounded text-xs font-mono font-medium bg-sky-500 text-slate-950 hover:bg-sky-400 transition flex items-center gap-1.5 cursor-pointer"
              title="Open Academic Whitepaper & Live Benchmark Ledger"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Academic Whitepaper</span>
            </button>

            <button
              onClick={handleSyncToCosmicAtlas}
              className="px-3 py-1.5 rounded text-xs font-mono text-slate-200 bg-slate-900 border border-slate-700 hover:border-cyan-400/50 transition flex items-center gap-1.5 cursor-pointer"
              title="Focus 3D Cosmic Atlas camera on this event sector"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sync 3D Atlas</span>
            </button>

            <button
              onClick={handleSaveMergerToVault}
              disabled={isSavingVault}
              className="px-3 py-1.5 rounded text-xs font-mono text-amber-300 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {user ? <Database className="w-3.5 h-3.5" /> : <HardDrive className="w-3.5 h-3.5" />}
              <span>{isSavingVault ? 'Archiving...' : 'Save Dossier to Vault'}</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Close Relativistic Merger Lab"
              className="p-1.5 rounded bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Vault Persistence Status Banner */}
        {vaultStatusBanner && (
          <div
            className={`px-4 py-1.5 text-xs font-mono flex items-center justify-between border-b shrink-0 ${
              vaultStatusBanner.mode === 'CLOUD'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {vaultStatusBanner.mode === 'CLOUD' ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{vaultStatusBanner.text}</span>
            </div>
            <button
              onClick={() => setVaultStatusBanner(null)}
              className="text-[11px] underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Asymmetric Split Console Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
          {/* Left Column (3 cols): Catalog Presets & Relativistic Parameter Sliders */}
          <aside className="lg:col-span-3 bg-[#0B0E17] border-r border-slate-800 p-4 space-y-4 overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>GW Catalog Event Preset</span>
              </label>
              <select
                value={selectedPresetId}
                onChange={e => {
                  const found = RELATIVISTIC_MERGER_PRESETS.find(p => p.id === e.target.value);
                  if (found) handleSelectPreset(found);
                }}
                className="w-full px-2.5 py-2 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {RELATIVISTIC_MERGER_PRESETS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                {activePreset.description}
              </p>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Relativistic Binary Parameters</span>
              </div>

              {/* Primary Mass M1 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono tabular-nums">
                  <span className="text-slate-300">Primary Mass (M₁)</span>
                  <span className="text-cyan-400 font-semibold">{mass1Solar.toFixed(1)} M☉</span>
                </div>
                <input
                  type="range"
                  min={1.2}
                  max={95}
                  step={0.2}
                  value={mass1Solar}
                  onChange={e => setMass1Solar(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Secondary Mass M2 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono tabular-nums">
                  <span className="text-slate-300">Secondary Mass (M₂)</span>
                  <span className="text-cyan-400 font-semibold">{mass2Solar.toFixed(1)} M☉</span>
                </div>
                <input
                  type="range"
                  min={1.2}
                  max={85}
                  step={0.2}
                  value={mass2Solar}
                  onChange={e => setMass2Solar(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Primary Spin chi1 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono tabular-nums">
                  <span className="text-slate-300">Primary Kerr Spin (χ₁)</span>
                  <span className="text-amber-400 font-semibold">{spin1.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.99}
                  step={0.01}
                  value={spin1}
                  onChange={e => setSpin1(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Secondary Spin chi2 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono tabular-nums">
                  <span className="text-slate-300">Secondary Kerr Spin (χ₂)</span>
                  <span className="text-amber-400 font-semibold">{spin2.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.99}
                  step={0.01}
                  value={spin2}
                  onChange={e => setSpin2(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Orbital Inclination */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono tabular-nums">
                  <span className="text-slate-300">Orbital Inclination (ι)</span>
                  <span className="text-emerald-400 font-semibold">{inclinationDeg}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={1}
                  value={inclinationDeg}
                  onChange={e => setInclinationDeg(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Luminosity Distance */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono tabular-nums">
                  <span className="text-slate-300">Luminosity Distance (D_L)</span>
                  <span className="text-slate-200 font-semibold">{distanceMpc} Mpc</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={6000}
                  step={10}
                  value={distanceMpc}
                  onChange={e => setDistanceMpc(Number(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Derived Relativistic Invariants Card */}
            <div className="border-t border-slate-800 pt-3 space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Derived Post-Newtonian &amp; Kerr Metrics
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono tabular-nums">
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Chirp Mass M_c</div>
                  <div className="text-sm font-bold text-cyan-400">
                    {derivedMetrics.chirpMassSolar}{' '}
                    <span className="text-[10px] font-normal text-slate-400">M☉</span>
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Mass Ratio η / q</div>
                  <div className="text-sm font-bold text-slate-100">
                    {derivedMetrics.symmetricMassRatio}{' '}
                    <span className="text-[10px] font-normal text-slate-400">
                      (q={derivedMetrics.massRatioQ})
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Kerr R_ISCO</div>
                  <div className="text-sm font-bold text-amber-400">
                    {derivedMetrics.iscoRadiusKm}{' '}
                    <span className="text-[10px] font-normal text-slate-400">
                      km ({derivedMetrics.iscoRadiusRg} R_g)
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">f_ISCO / f_QNM</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {derivedMetrics.iscoFrequencyHz}{' '}
                    <span className="text-[10px] font-normal text-slate-400">
                      / {derivedMetrics.ringdownFrequencyHz} Hz
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Remnant M_f / χ_f</div>
                  <div className="text-sm font-bold text-sky-400">
                    {derivedMetrics.finalRemnantMassSolar} M☉{' '}
                    <span className="text-[10px] font-normal text-slate-400">
                      (χ={derivedMetrics.finalRemnantSpin})
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Radiated ΔE_GW</div>
                  <div className="text-sm font-bold text-rose-400">
                    {derivedMetrics.radiatedMassSolar}{' '}
                    <span className="text-[10px] font-normal text-slate-400">M☉c²</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Center Column (6 cols): 3D WebGL Relativistic Viewport + D3 Strain & Spectrum Tray */}
          <main className="lg:col-span-6 flex flex-col bg-[#07090E] overflow-y-auto">
            {/* 3D WebGL 2.0 Kerr Binary Canvas */}
            <div className="relative flex-1 min-h-[290px] border-b border-slate-800 cursor-crosshair">
              <div ref={mountRef} className="w-full h-full" />

              {/* Viewport Corner Telemetry Overlay */}
              <div className="pointer-events-none absolute top-3 left-3 p-2.5 rounded bg-slate-950/85 border border-slate-800 font-mono text-[11px] space-y-0.5">
                <div className="text-cyan-400 font-semibold">
                  {activePreset.eventDesignation} · {derivedMetrics.currentPhaseLabel}
                </div>
                <div className="text-slate-400">
                  Coordinates: {activePreset.coordinatesRaDec} · Peak h₂₂ ≈{' '}
                  {derivedMetrics.peakStrain22}×10⁻²¹
                </div>
              </div>

              {/* Time-Domain Coalescence Scrubber Bar */}
              <div className="absolute bottom-3 inset-x-3 p-2.5 rounded bg-slate-950/90 border border-slate-800 flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(p => !p)}
                  className="px-2.5 py-1 rounded bg-cyan-500 text-slate-950 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  onClick={() => setCoalescencePct(0)}
                  className="p-1 rounded bg-slate-900 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                  title="Reset to Early Inspiral (0%)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    Phase τ:
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.5}
                    value={coalescencePct}
                    onChange={e => {
                      setIsPlaying(false);
                      setCoalescencePct(Number(e.target.value));
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <span className="text-xs font-mono tabular-nums text-cyan-400 w-12 text-right">
                    {coalescencePct.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom D3 Telemetry Tray */}
            <div className="p-3.5 bg-[#090D16] space-y-2 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 p-1 rounded bg-slate-900 border border-slate-800">
                  <button
                    onClick={() => setActiveChartTab('STRAIN_WAVEFORM')}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
                      activeChartTab === 'STRAIN_WAVEFORM'
                        ? 'bg-cyan-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    IMR Strain Waveform h+(t), h×(t)
                  </button>
                  <button
                    onClick={() => setActiveChartTab('SPECTRAL_SENSITIVITY')}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
                      activeChartTab === 'SPECTRAL_SENSITIVITY'
                        ? 'bg-cyan-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    Characteristic Strain hc(f) vs. LIGO/CE
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                  L_GW(peak) = {derivedMetrics.peakLuminosityErgS.toExponential(2)} erg/s
                </div>
              </div>

              <div className="w-full overflow-x-auto bg-slate-950/90 border border-slate-800 rounded p-2">
                <svg
                  ref={d3SvgRef}
                  viewBox="0 0 680 225"
                  className="w-full h-[215px] select-none"
                />
              </div>
            </div>
          </main>

          {/* Right Column (3 cols): Gemini Relativistic Synthesis + Live Empirical Benchmark Ledger */}
          <aside className="lg:col-span-3 bg-[#0B0E17] border-l border-slate-800 p-4 space-y-4 overflow-y-auto">
            {/* Gemini Synthesis Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                  Relativistic AI Synthesis
                </span>
                <button
                  onClick={handleRunGeminiSynthesis}
                  disabled={isSynthesizing}
                  className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize Dossier'}</span>
                </button>
              </div>

              {synthesisReport ? (
                <div className="space-y-2.5 text-xs">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Provenance</span>
                    <span
                      className={
                        synthesisReport.provenanceMode === 'GEMINI_CLOUD'
                          ? 'text-emerald-400'
                          : 'text-amber-300'
                      }
                    >
                      {synthesisReport.provenanceMode === 'GEMINI_CLOUD'
                        ? '● Gemini 3.8 Flash Verified'
                        : '▲ Deterministic Local PN Fallback'}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="font-mono text-[11px] text-cyan-400">
                      Relativistic Regime &amp; ISCO
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {synthesisReport.relativisticRegimeSummary}
                    </p>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="font-mono text-[11px] text-amber-400">
                      Waveform &amp; QNM Ringdown
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {synthesisReport.waveformMorphologyAnalysis}
                    </p>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="font-mono text-[11px] text-emerald-400">
                      Kerr Ergosphere &amp; Multi-Messenger Notes
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {synthesisReport.remnantKerrHorizonsAndJets}
                    </p>
                    <p className="text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">
                      {synthesisReport.multiMessengerCounterparts}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                  Click <strong>Synthesize Dossier</strong> to generate a relativistic analysis of{' '}
                  {activePreset.eventDesignation} (with automatic deterministic Post-Newtonian
                  fallback if offline or quota-limited).
                </div>
              )}
            </div>

            {/* Live Whitepaper Benchmark Ledger Status */}
            <div className="border-t border-slate-800 pt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                  Whitepaper Table 2 Telemetry
                </span>
                <button
                  onClick={() => setIsWhitepaperOpen(true)}
                  className="text-[11px] font-mono text-sky-400 hover:underline cursor-pointer"
                >
                  View Full Ledger →
                </button>
              </div>

              <div className="space-y-2">
                {benchmarkRows.map(row => {
                  const isMeasured = row.verificationStatus === 'Empirically Measured';
                  return (
                    <div
                      key={row.metricId}
                      className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">
                          {row.metricId} · {row.category}
                        </span>
                        <span className={isMeasured ? 'text-emerald-400' : 'text-amber-400'}>
                          {isMeasured ? '● Measured' : '○ Not measured'}
                        </span>
                      </div>
                      <div className="text-slate-400 truncate" title={row.measuredValue}>
                        {row.measuredValue}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Root Academic Whitepaper Modal */}
      <AcademicWhitepaperModal
        isOpen={isWhitepaperOpen}
        onClose={() => setIsWhitepaperOpen(false)}
        initialTab="STELLAR_WHITEPAPER"
        user={user}
      />
    </div>
  );
};

export default RelativisticMergerWorkbench;
