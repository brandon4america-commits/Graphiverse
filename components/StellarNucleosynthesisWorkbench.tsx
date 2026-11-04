import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as d3 from 'd3';
import {
  X,
  Flame,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Database,
  Plus,
  Compass,
  Sliders,
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Node, NodeType, Cluster } from '../types';
import { saveCelestialDiscovery } from '../services/firebase';
import AcademicWhitepaperModal from './AcademicWhitepaperModal';
import { StellarModelSnapshot } from './StellarEvolutionWhitepaper';

export interface StellarPreset {
  id: string;
  name: string;
  subtitle: string;
  massSolar: number;
  metallicityZ: number;
  rotationKms: number;
  coordinatesRaDec: string;
  distanceLabel: string;
  targetClusterId: string;
  linkedNodeLabels: string[];
  pubchemCid: number;
  description: string;
}

export interface IsotopeYieldDatum {
  isotope: string;
  elementName: string;
  atomicNumber: number;
  logMassFraction: number;
  ejectedSolarMasses: number;
  pathway: string;
  astrobiologyRole: string;
}

interface HRPoint {
  epochPct: number;
  phaseName: string;
  logTeff: number;
  teffK: number;
  logL: number;
  radiusSolar: number;
  coreTempMK: number;
  coreDensityGcm3: number;
}

interface GeminiNucleosynthesisReport {
  hydrostaticDiagnosis: string;
  activeReactionChains: string[];
  prebioticSeedingAnalysis: string;
  cToORatioImplication: string;
  anomalyAlerts: {
    title: string;
    severity: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
    mechanism: string;
  }[];
  recommendedAtlasNodes: string[];
  confidenceScore: number;
}

export const STELLAR_PRESETS: StellarPreset[] = [
  {
    id: 'betelgeuse-supergiant',
    name: 'Alpha Orionis (Betelgeuse Progenitor)',
    subtitle: 'Red Supergiant · Full Onion-Shell Hydrostatic Nucleosynthesis',
    massSolar: 18.5,
    metallicityZ: 0.02,
    rotationKms: 15,
    coordinatesRaDec: 'RA 05h 55m 10.3s · Dec +07° 24′ 25″',
    distanceLabel: '548 ly (168 pc)',
    targetClusterId: 'c-interstellar-chemistry',
    linkedNodeLabels: [
      'Orion Molecular Cloud (OMC-1)',
      'Sagittarius B2(N) Molecular Cloud',
      'Glycine & Prebiotic Amino Acid Precursors'
    ],
    pubchemCid: 750,
    description:
      'Massive core-collapse supernova progenitor synthesizing oxygen, silicon, phosphorus, sulfur, and iron-peak nuclei across concentric burning shells before seeding nearby molecular clouds.'
  },
  {
    id: 'sol-g2v-evolution',
    name: 'Sol-Analog G2V → AGB Carbon Star',
    subtitle: 'Intermediate Mass · CNO & s-Process Prebiotic Carbon Enrichment',
    massSolar: 1.8,
    metallicityZ: 0.014,
    rotationKms: 4,
    coordinatesRaDec: 'RA 00h 00m 00.0s · Dec +00° 00′ 00″',
    distanceLabel: '0.000016 ly (1 AU)',
    targetClusterId: 'c-solar-system',
    linkedNodeLabels: [
      'Enceladus Hydrothermal Plumes',
      'Titan Atmospheric Tholin Haze',
      'Europa Subsurface Ocean'
    ],
    pubchemCid: 783,
    description:
      'Intermediate-mass star evolving from Hydrogen main-sequence burning through the Red Giant Branch and Asymptotic Giant Branch (AGB) dredge-up pulses, enriching circumstellar dust with C, N, and s-process isotopes.'
  },
  {
    id: 'wolf-rayet-progenitor',
    name: 'WR 102 / Eta Carinae Massive Progenitor',
    subtitle: 'Very High Mass · Pair-Instability & Rapid r-Process Ejecta',
    massSolar: 36.0,
    metallicityZ: 0.006,
    rotationKms: 210,
    coordinatesRaDec: 'RA 10h 45m 03.5s · Dec -59° 41′ 04″',
    distanceLabel: '7,500 ly (2.30 kpc)',
    targetClusterId: 'c-galactic-structure',
    linkedNodeLabels: [
      'Sagittarius A* Supermassive Black Hole',
      'Fermi Gamma-Ray Bubbles',
      'Galactic Habitable Zone Annulus'
    ],
    pubchemCid: 23925,
    description:
      'Rapidly rotating massive star stripping its outer hydrogen envelope via extreme radiation winds while forging massive yields of O-16, Mg-24, Si-28, and Fe-56.'
  },
  {
    id: 'trappist-mdwarf',
    name: 'TRAPPIST-1 Ultra-Cool M8V Host',
    subtitle: 'Low-Mass Fully Convective · Multi-Trillion-Year Habitable Zone',
    massSolar: 0.09,
    metallicityZ: 0.015,
    rotationKms: 6,
    coordinatesRaDec: 'RA 23h 06m 29.3s · Dec -05° 02′ 29″',
    distanceLabel: '40.66 ly (12.47 pc)',
    targetClusterId: 'c-exoplanets',
    linkedNodeLabels: [
      'TRAPPIST-1e Temperate Terrestrial World',
      'K2-18b Hycean Sub-Neptune',
      'JWST NIRSpec Transmission Spectroscopy'
    ],
    pubchemCid: 962,
    description:
      'Fully convective ultra-low-mass dwarf burning hydrogen slowly via the p-p chain without core-envelope stratification, sustaining temperate rocky exoplanets over cosmic timescales.'
  }
];

interface StellarNucleosynthesisWorkbenchProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  nodes: Node[];
  clusters: Cluster[];
  onSelectAtlasNode: (node: Node) => void;
  onFocusAtlasCluster: (clusterId: string) => void;
  onAddDiscoveryToAtlas: (node: Node) => void;
}

// Reusable module-scope math vectors to guarantee zero GC allocations in the WebGL loop
const _tempVec3 = new THREE.Vector3();
const _shellTargetPos = new THREE.Vector3();

function computeEvolutionTrack(
  massSolar: number,
  metallicityZ: number,
  rotationKms: number
): HRPoint[] {
  const m = Math.max(0.08, massSolar);
  const zFactor = Math.log10(Math.max(0.001, metallicityZ) / 0.014);
  const rotBoost = 1 + (rotationKms / 300) * 0.12;

  // Base ZAMS luminosity and effective temperature scaling laws
  const zamsLogL =
    m < 0.43
      ? Math.log10(0.23 * Math.pow(m, 2.3))
      : m < 2
      ? Math.log10(Math.pow(m, 4.0) * rotBoost)
      : m < 20
      ? Math.log10(1.4 * Math.pow(m, 3.5) * rotBoost)
      : Math.log10(32000 * m * rotBoost);

  const zamsTeff =
    m < 0.5
      ? 3100 + m * 1800
      : m < 2.0
      ? 5778 * Math.pow(m, 0.52) * Math.pow(10, -0.04 * zFactor)
      : Math.min(46000, 5778 * Math.pow(m, 0.58) * Math.pow(10, -0.05 * zFactor));

  const points: HRPoint[] = [];
  for (let pct = 0; pct <= 100; pct += 2) {
    const t = pct / 100;
    let teffK = zamsTeff;
    let logL = zamsLogL;
    let coreTempMK = 15 * Math.pow(m, 0.45);
    let coreDensityGcm3 = 150 * Math.pow(m, -0.7);
    let phaseName = 'Zero-Age Main Sequence (Core H → He)';

    if (m < 0.45) {
      // Fully convective M-dwarf track
      if (t < 0.75) {
        phaseName = 'Convective Main Sequence (p-p Chain H Burning)';
        teffK = zamsTeff * (1 + t * 0.08);
        logL = zamsLogL + t * 0.25;
        coreTempMK = 8.5 + t * 6.0;
        coreDensityGcm3 = 420 + t * 380;
      } else {
        const b = (t - 0.75) / 0.25;
        phaseName = b < 0.6 ? 'Blue Dwarf Radiative Transition' : 'Helium White Dwarf Cooling';
        teffK = zamsTeff * (1.06 + Math.sin(b * Math.PI) * 0.45);
        logL = zamsLogL + 0.25 - b * 1.8;
        coreTempMK = 14.5 * (1 - b * 0.7);
        coreDensityGcm3 = 800 + b * 45000;
      }
    } else if (m < 8.0) {
      // Intermediate-mass star (Sol / AGB → Carbon-Oxygen White Dwarf)
      if (t <= 0.45) {
        const p = t / 0.45;
        phaseName = 'Main Sequence (Core H → He Burning)';
        teffK = zamsTeff * (1 - p * 0.06);
        logL = zamsLogL + p * 0.35;
        coreTempMK = 15.7 * Math.pow(m, 0.3) * (1 + p * 0.6);
        coreDensityGcm3 = 150 * (1 + p * 4.5);
      } else if (t <= 0.68) {
        const p = (t - 0.45) / 0.23;
        phaseName = 'Red Giant Branch (H-Shell Burning & Core Contraction)';
        teffK = zamsTeff * 0.94 * (1 - p * 0.36);
        logL = zamsLogL + 0.35 + p * 2.1;
        coreTempMK = 28 + p * 78;
        coreDensityGcm3 = 850 + p * 18000;
      } else if (t <= 0.88) {
        const p = (t - 0.68) / 0.2;
        phaseName = 'Asymptotic Giant Branch (Triple-Alpha He → C/O & s-Process)';
        teffK = Math.max(3000, zamsTeff * 0.6 * (1 - p * 0.14 + Math.sin(p * Math.PI * 3) * 0.04));
        logL = zamsLogL + 2.45 + p * 0.85 + Math.sin(p * Math.PI * 3) * 0.15;
        coreTempMK = 110 + p * 140;
        coreDensityGcm3 = 22000 + p * 140000;
      } else {
        const p = (t - 0.88) / 0.12;
        phaseName =
          p < 0.5
            ? 'Planetary Nebula Ejection & C/O Dust Seeding'
            : 'Degenerate Carbon-Oxygen White Dwarf Remnant';
        teffK = 3200 + p * 68000;
        logL = zamsLogL + 3.3 - p * 4.6;
        coreTempMK = 250 * (1 - p * 0.85);
        coreDensityGcm3 = 180000 + p * 850000;
      }
    } else {
      // Massive Supergiant / Wolf-Rayet Progenitor (Onion-shell -> Core Collapse Supernova)
      if (t <= 0.4) {
        const p = t / 0.4;
        phaseName = 'Massive Main Sequence (Convective CNO Core H → He)';
        teffK = zamsTeff * (1 - p * 0.22);
        logL = zamsLogL + p * 0.32;
        coreTempMK = 34 + p * 25;
        coreDensityGcm3 = 8 + p * 35;
      } else if (t <= 0.65) {
        const p = (t - 0.4) / 0.25;
        phaseName = 'Red/Blue Supergiant (Core Triple-Alpha He → C/O)';
        teffK = Math.max(3450, zamsTeff * 0.78 * (1 - p * 0.58));
        logL = zamsLogL + 0.32 + p * 0.28;
        coreTempMK = 160 + p * 420;
        coreDensityGcm3 = 650 + p * 4200;
      } else if (t <= 0.88) {
        const p = (t - 0.65) / 0.23;
        phaseName = 'Advanced Onion-Shell Burning (C → Ne/Mg → O → Si → Fe Core)';
        teffK = Math.max(3350, zamsTeff * 0.33 * (1 + Math.sin(p * Math.PI) * 0.08));
        logL = zamsLogL + 0.6 + p * 0.22;
        coreTempMK = 600 + Math.pow(p, 2) * 3100;
        coreDensityGcm3 = 12000 + Math.pow(p, 2.4) * 4800000;
      } else {
        const p = (t - 0.88) / 0.12;
        phaseName =
          p < 0.45
            ? 'Core-Collapse Supernova Shockwave & r-Process Nucleosynthesis'
            : 'Relativistic Remnant & Heavy-Element ISM Enrichment';
        teffK = 4200 + p * 42000;
        logL = zamsLogL + 0.82 + (p < 0.45 ? p * 3.2 : 1.44 - (p - 0.45) * 3.8);
        coreTempMK = p < 0.45 ? 3800 + p * 6200 : 1200 * (1 - p * 0.6);
        coreDensityGcm3 = 5.0e6 + p * 1.2e8;
      }
    }

    const logTeff = Math.log10(Math.max(2500, teffK));
    // Stefan-Boltzmann radius in solar units: R/R_sun = sqrt(L/L_sun) * (5778 / Teff)^2
    const radiusSolar = Math.sqrt(Math.pow(10, logL)) * Math.pow(5778 / Math.max(2500, teffK), 2);

    points.push({
      epochPct: pct,
      phaseName,
      logTeff,
      teffK: Math.round(teffK),
      logL: Number(logL.toFixed(3)),
      radiusSolar: Number(radiusSolar.toFixed(3)),
      coreTempMK: Number(coreTempMK.toFixed(1)),
      coreDensityGcm3: Number(coreDensityGcm3.toFixed(1))
    });
  }
  return points;
}

function computeIsotopeYields(
  massSolar: number,
  metallicityZ: number,
  rotationKms: number,
  epochPct: number
): { yields: IsotopeYieldDatum[]; cToORatio: number } {
  const t = epochPct / 100;
  const m = Math.max(0.08, massSolar);
  const rotFactor = 1 + (rotationKms / 250) * 0.35;
  const zScale = Math.max(0.2, metallicityZ / 0.014);

  // Compute dynamic mass fractions log10(X_i) based on stellar mass and evolutionary epoch
  const hDepletion = Math.min(0.62, t * (0.28 + Math.min(0.34, m * 0.015)));
  const heGain = Math.min(0.55, t * (0.24 + Math.min(0.28, m * 0.012)));

  const cBoost =
    m >= 0.8
      ? Math.max(0, (t - 0.42) * 3.4) * (m < 8 ? 1.55 : 1.15) * rotFactor
      : t * 0.1;
  const nBoost = Math.max(0, (t - 0.25) * 2.6) * zScale * rotFactor;
  const oBoost =
    m >= 8
      ? Math.max(0, (t - 0.48) * 4.2) * (1 + m * 0.025)
      : m >= 0.8
      ? Math.max(0, (t - 0.5) * 2.1)
      : t * 0.05;

  const neMgBoost = m >= 8 ? Math.max(0, (t - 0.62) * 4.5) : Math.max(0, (t - 0.7) * 0.8);
  const siSBoost = m >= 8 ? Math.max(0, (t - 0.72) * 5.1) : Math.max(0, (t - 0.8) * 0.35);
  const pBoost = m >= 8 ? Math.max(0, (t - 0.7) * 4.4) * rotFactor : Math.max(0, (t - 0.75) * 0.6);
  const feBoost = m >= 8 ? Math.max(0, (t - 0.8) * 6.2) : Math.max(0, (t - 0.85) * 0.25);

  const rawYields: Omit<IsotopeYieldDatum, 'ejectedSolarMasses'>[] = [
    {
      isotope: '¹H',
      elementName: 'Hydrogen-1',
      atomicNumber: 1,
      logMassFraction: Number((-0.15 - hDepletion).toFixed(2)),
      pathway: 'Primordial / p-p & CNO Fuel',
      astrobiologyRole: 'Water (H₂O) & organic C-H bond donor across protoplanetaryices'
    },
    {
      isotope: '⁴He',
      elementName: 'Helium-4',
      atomicNumber: 2,
      logMassFraction: Number((-0.6 + heGain).toFixed(2)),
      pathway: 'p-p Chain & CNO Cycle Product',
      astrobiologyRole: 'Primary intermediate for Triple-Alpha ¹²C synthesis'
    },
    {
      isotope: '¹²C',
      elementName: 'Carbon-12',
      atomicNumber: 6,
      logMassFraction: Number(Math.min(-0.85, -2.62 + cBoost * 0.52).toFixed(2)),
      pathway: 'Triple-Alpha (3 ⁴He → ¹²C)',
      astrobiologyRole: 'Covalent backbone of PAH, amino acids, and nucleic acid bases'
    },
    {
      isotope: '¹⁴N',
      elementName: 'Nitrogen-14',
      atomicNumber: 7,
      logMassFraction: Number(Math.min(-1.2, -3.15 + nBoost * 0.48).toFixed(2)),
      pathway: 'CNO-I / CNO-II Bi-Cycle Bottleneck',
      astrobiologyRole: 'Essential for HCN, formamide, peptide bonds & purine/pyrimidine rings'
    },
    {
      isotope: '¹⁶O',
      elementName: 'Oxygen-16',
      atomicNumber: 8,
      logMassFraction: Number(Math.min(-0.65, -2.24 + oBoost * 0.45).toFixed(2)),
      pathway: 'Helium Alpha-Capture (¹²C(α,γ)¹⁶O)',
      astrobiologyRole: 'Dominant volatile in H₂O oceans, CO₂ atmospheres & silicate crusts'
    },
    {
      isotope: '²⁰Ne',
      elementName: 'Neon-20',
      atomicNumber: 10,
      logMassFraction: Number(Math.min(-1.1, -2.9 + neMgBoost * 0.42).toFixed(2)),
      pathway: 'Carbon Burning (¹²C + ¹²C → ²⁰Ne + α)',
      astrobiologyRole: 'Tracer of primary atmosphere retention vs hydrodynamic escape'
    },
    {
      isotope: '²⁴Mg',
      elementName: 'Magnesium-24',
      atomicNumber: 12,
      logMassFraction: Number(Math.min(-1.25, -3.2 + neMgBoost * 0.44).toFixed(2)),
      pathway: 'Carbon & Neon Shell Burning',
      astrobiologyRole: 'Mantle olivine/pyroxene rheology & RNA/ATP Mg²⁺ coordination'
    },
    {
      isotope: '²⁸Si',
      elementName: 'Silicon-28',
      atomicNumber: 14,
      logMassFraction: Number(Math.min(-1.15, -3.18 + siSBoost * 0.45).toFixed(2)),
      pathway: 'Oxygen Burning (¹⁶O + ¹⁶O → ²⁸Si + α)',
      astrobiologyRole: 'Lithospheric silicate crust & carbonate-silicate climate thermostat'
    },
    {
      isotope: '³¹P',
      elementName: 'Phosphorus-31',
      atomicNumber: 15,
      logMassFraction: Number(Math.min(-2.1, -5.2 + pBoost * 0.62).toFixed(2)),
      pathway: 'Neon/Silicon Neutron Capture',
      astrobiologyRole: 'Rate-limiting bio-essential element for ATP & phospholipid membranes'
    },
    {
      isotope: '³²S',
      elementName: 'Sulfur-32',
      atomicNumber: 16,
      logMassFraction: Number(Math.min(-1.4, -3.4 + siSBoost * 0.44).toFixed(2)),
      pathway: 'Silicon Alpha-Process (²⁸Si(α,γ)³²S)',
      astrobiologyRole: 'Hydrothermal [Fe-S] cluster redox catalysts & H₂S chemosynthesis'
    },
    {
      isotope: '⁵⁶Fe',
      elementName: 'Iron-56',
      atomicNumber: 26,
      logMassFraction: Number(Math.min(-1.05, -2.9 + feBoost * 0.42).toFixed(2)),
      pathway: 'Silicon Quasi-Equilibrium (⁵⁶Ni → ⁵⁶Co → ⁵⁶Fe)',
      astrobiologyRole: 'Planetary magnetic geodynamo core & iron-sulfur metalloenzymes'
    }
  ];

  const yields: IsotopeYieldDatum[] = rawYields.map(item => {
    const frac = Math.pow(10, item.logMassFraction);
    const ejectedSolarMasses = Number((frac * m * (0.18 + t * 0.65)).toFixed(4));
    return {
      ...item,
      ejectedSolarMasses
    };
  });

  const cFrac = Math.pow(10, yields.find(y => y.isotope === '¹²C')?.logMassFraction || -2.6);
  const oFrac = Math.pow(10, yields.find(y => y.isotope === '¹⁶O')?.logMassFraction || -2.2);
  // Number ratio (C/O) = (X_C / 12) / (X_O / 16)
  const cToORatio = Number(((cFrac / 12) / Math.max(1e-7, oFrac / 16)).toFixed(2));

  return { yields, cToORatio };
}

export const StellarNucleosynthesisWorkbench: React.FC<StellarNucleosynthesisWorkbenchProps> = ({
  isOpen,
  onClose,
  user,
  nodes,
  clusters,
  onSelectAtlasNode,
  onFocusAtlasCluster,
  onAddDiscoveryToAtlas
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(STELLAR_PRESETS[0].id);
  const [massSolar, setMassSolar] = useState<number>(STELLAR_PRESETS[0].massSolar);
  const [metallicityZ, setMetallicityZ] = useState<number>(STELLAR_PRESETS[0].metallicityZ);
  const [rotationKms, setRotationKms] = useState<number>(STELLAR_PRESETS[0].rotationKms);
  const [epochPct, setEpochPct] = useState<number>(76);
  const [cutawayAngleDeg, setCutawayAngleDeg] = useState<number>(135);
  const [explodeShells, setExplodeShells] = useState<number>(0.22);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const [isHudDockCollapsed, setIsHudDockCollapsed] = useState<boolean>(false);

  const [geminiReport, setGeminiReport] = useState<GeminiNucleosynthesisReport | null>(null);
  const [isScanningGemini, setIsScanningGemini] = useState<boolean>(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  const [isSavingVault, setIsSavingVault] = useState<boolean>(false);
  const [vaultSavedStatus, setVaultSavedStatus] = useState<string | null>(null);
  const [isWhitepaperModalOpen, setIsWhitepaperModalOpen] = useState<boolean>(false);

  const activePreset = useMemo(
    () => STELLAR_PRESETS.find(p => p.id === selectedPresetId) || STELLAR_PRESETS[0],
    [selectedPresetId]
  );

  const hrTrack = useMemo(
    () => computeEvolutionTrack(massSolar, metallicityZ, rotationKms),
    [massSolar, metallicityZ, rotationKms]
  );

  const activePoint = useMemo(() => {
    const idx = Math.min(hrTrack.length - 1, Math.max(0, Math.round(epochPct / 2)));
    return hrTrack[idx] || hrTrack[0];
  }, [hrTrack, epochPct]);

  const { yields: isotopeYields, cToORatio } = useMemo(
    () => computeIsotopeYields(massSolar, metallicityZ, rotationKms, epochPct),
    [massSolar, metallicityZ, rotationKms, epochPct]
  );

  const matchingAtlasNodes = useMemo(() => {
    const targetClusterNodes = nodes.filter(n => n.clusterId === activePreset.targetClusterId);
    return targetClusterNodes.slice(0, 6);
  }, [nodes, activePreset]);

  // Apply preset values when switching preset
  const handleSelectPreset = (preset: StellarPreset) => {
    setSelectedPresetId(preset.id);
    setMassSolar(preset.massSolar);
    setMetallicityZ(preset.metallicityZ);
    setRotationKms(preset.rotationKms);
    setEpochPct(preset.massSolar >= 8 ? 78 : preset.massSolar >= 0.8 ? 72 : 40);
    setGeminiReport(null);
    setVaultSavedStatus(null);
  };

  // Timeline auto-playback
  useEffect(() => {
    if (!isPlayingTimeline || !isOpen) return;
    const timer = window.setInterval(() => {
      setEpochPct(prev => {
        if (prev >= 100) {
          setIsPlayingTimeline(false);
          return 100;
        }
        return Math.min(100, prev + 1);
      });
    }, 140);
    return () => window.clearInterval(timer);
  }, [isPlayingTimeline, isOpen]);

  // ==========================================================================
  // THREE.JS 3D ONION-SHELL & SUPERNOVA SHOCKWAVE WEBGL VIEWPORT
  // ==========================================================================
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const simParamsRef = useRef({
    massSolar,
    epochPct,
    cutawayAngleDeg,
    explodeShells,
    teffK: activePoint.teffK,
    coreTempMK: activePoint.coreTempMK
  });

  useEffect(() => {
    simParamsRef.current = {
      massSolar,
      epochPct,
      cutawayAngleDeg,
      explodeShells,
      teffK: activePoint.teffK,
      coreTempMK: activePoint.coreTempMK
    };
  }, [massSolar, epochPct, cutawayAngleDeg, explodeShells, activePoint]);

  useEffect(() => {
    if (!isOpen || !canvasMountRef.current) return;
    const container = canvasMountRef.current;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    scene.fog = new THREE.FogExp2(0x07090e, 0.045);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    camera.position.set(3.8, 2.2, 5.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance'
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.localClippingEnabled = true;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.2;
    controls.maxDistance = 14.0;

    // 3-Point Studio & Stellar Core Illumination
    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.2);
    keyLight.position.set(6, 8, 6);
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0b101e, 0.9);
    scene.add(hemiLight);

    const coreLight = new THREE.PointLight(0x60a5fa, 3.8, 12);
    scene.add(coreLight);

    // Composite Multi-Part Stellar Onion-Shell Group (7 distinct parts)
    const starGroup = new THREE.Group();
    scene.add(starGroup);

    // Concentric nuclear burning shell definitions (outer to inner)
    const shellDefinitions = [
      {
        name: 'H → He Convective Photosphere',
        radius: 1.85,
        colorA: new THREE.Color(0xf97316),
        colorB: new THREE.Color(0xfef08a),
        minEpoch: 0,
        explodeDir: new THREE.Vector3(-0.6, 0.35, 0.4)
      },
      {
        name: 'He → C/O Triple-Alpha Shell',
        radius: 1.42,
        colorA: new THREE.Color(0xf59e0b),
        colorB: new THREE.Color(0xfde047),
        minEpoch: 25,
        explodeDir: new THREE.Vector3(0.45, 0.3, -0.35)
      },
      {
        name: 'C → Ne/Mg Burning Layer',
        radius: 1.06,
        colorA: new THREE.Color(0x10b981),
        colorB: new THREE.Color(0x6ee7b7),
        minEpoch: 52,
        explodeDir: new THREE.Vector3(-0.35, -0.35, 0.35)
      },
      {
        name: 'O → Si/S/P Burning Shell',
        radius: 0.74,
        colorA: new THREE.Color(0x06b6d4),
        colorB: new THREE.Color(0x7dd3fc),
        minEpoch: 65,
        explodeDir: new THREE.Vector3(0.35, -0.3, 0.3)
      },
      {
        name: 'Si → Fe/Ni Degenerate Core',
        radius: 0.42,
        colorA: new THREE.Color(0x6366f1),
        colorB: new THREE.Color(0xe0e7ff),
        minEpoch: 0,
        explodeDir: new THREE.Vector3(0, 0, 0)
      }
    ];

    const shellMeshes: {
      mesh: THREE.Mesh;
      mat: THREE.ShaderMaterial;
      def: (typeof shellDefinitions)[0];
    }[] = [];

    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;
      uniform float uTurbulence;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      void main() {
        vNormal = normalize(normalMatrix * normal);
        float wave = sin(position.x * 6.0 + uTime * 2.2) * cos(position.y * 6.0 - uTime * 1.8) * sin(position.z * 6.0 + uTime * 1.5);
        vec3 displaced = position + normal * (wave * uTurbulence);
        vPosition = displaced;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uCutawayCos;
      uniform float uOpacity;

      void main() {
        // Cutaway octant / wedge in local X-Z space so internal onion shells are clearly visible
        if (vPosition.x > 0.0 && vPosition.z > 0.0) {
          float angle = atan(vPosition.z, vPosition.x);
          if (angle < uCutawayCos) {
            discard;
          }
        }

        float bands = 0.5 + 0.5 * sin(length(vPosition) * 14.0 - uTime * 2.5 + vPosition.y * 5.0);
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 1.6);
        vec3 col = mix(uColorA, uColorB, bands * 0.75 + fresnel * 0.35);
        gl_FragColor = vec4(col, uOpacity);
      }
    `;

    shellDefinitions.forEach((def, idx) => {
      const geom = new THREE.SphereGeometry(def.radius, isSoftwareGl ? 28 : 48, isSoftwareGl ? 20 : 36);
      const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uTurbulence: { value: idx === 0 ? 0.035 : 0.015 },
          uColorA: { value: def.colorA.clone() },
          uColorB: { value: def.colorB.clone() },
          uCutawayCos: { value: 1.2 },
          uOpacity: { value: 0.94 }
        }
      });
      const mesh = new THREE.Mesh(geom, mat);
      starGroup.add(mesh);
      shellMeshes.push({ mesh, mat, def });
    });

    // Part 6: Equatorial Accretion / Circumstellar Ejecta Torus Ring
    const ringGeom = new THREE.TorusGeometry(2.55, 0.045, 16, 96);
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      roughness: 0.25,
      metalness: 0.8,
      transparent: true,
      opacity: 0.65
    });
    const ejectaRing = new THREE.Mesh(ringGeom, ringMat);
    ejectaRing.rotation.x = Math.PI / 2;
    starGroup.add(ejectaRing);

    // Part 7: Bipolar Relativistic Pulsar / Supernova Jets (visible in late evolution epochs)
    const jetGeom = new THREE.CylinderGeometry(0.03, 0.28, 4.6, 20, 1, true);
    const jetMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const bipolarJet = new THREE.Mesh(jetGeom, jetMat);
    starGroup.add(bipolarJet);

    // Subtle coordinate reference plane beneath the star
    const gridHelper = new THREE.PolarGridHelper(3.4, 12, 6, 64, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -2.25;
    scene.add(gridHelper);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let frameId = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const params = simParamsRef.current;

      controls.update();

      const cutawayRad = THREE.MathUtils.degToRad(params.cutawayAngleDeg) * 0.5;
      const isLateRemnant = params.epochPct >= 88;

      shellMeshes.forEach(({ mesh, mat, def }, idx) => {
        mat.uniforms.uTime.value = elapsed;
        mat.uniforms.uCutawayCos.value = cutawayRad;

        // Adjust outer photosphere color according to effective temperature
        if (idx === 0) {
          if (params.teffK > 15000) {
            mat.uniforms.uColorA.value.setHex(0x2563eb);
            mat.uniforms.uColorB.value.setHex(0x93c5fd);
          } else if (params.teffK > 6500) {
            mat.uniforms.uColorA.value.setHex(0xeab308);
            mat.uniforms.uColorB.value.setHex(0xfef9c3);
          } else {
            mat.uniforms.uColorA.value.setHex(0xdc2626);
            mat.uniforms.uColorB.value.setHex(0xfb923c);
          }
        }

        // Smoothly damp shell separation based on explodeShells & supernova shock phase
        const shockFactor = isLateRemnant ? (params.epochPct - 88) * 0.08 : 0;
        _shellTargetPos
          .copy(def.explodeDir)
          .multiplyScalar(params.explodeShells * 1.15 + shockFactor * (5 - idx) * 0.4);

        mesh.position.x = THREE.MathUtils.damp(mesh.position.x, _shellTargetPos.x, 6, delta);
        mesh.position.y = THREE.MathUtils.damp(mesh.position.y, _shellTargetPos.y, 6, delta);
        mesh.position.z = THREE.MathUtils.damp(mesh.position.z, _shellTargetPos.z, 6, delta);

        // Hide advanced burning shells for low-mass M-dwarfs
        const shellActive =
          params.massSolar >= 8 ||
          idx <= 1 ||
          (params.massSolar >= 0.8 && idx === 2 && params.epochPct >= 65) ||
          idx === 4;
        mesh.visible = shellActive;
      });

      // Ejecta ring & relativistic jet dynamics
      const targetRingScale = isLateRemnant ? 1.0 + (params.epochPct - 88) * 0.06 : 1.0;
      _tempVec3.set(targetRingScale, targetRingScale, targetRingScale);
      ejectaRing.scale.lerp(_tempVec3, 1 - Math.exp(-5 * delta));
      ejectaRing.rotation.z = elapsed * 0.25;

      const targetJetOpacity = isLateRemnant && params.massSolar >= 8 ? 0.48 : 0.0;
      jetMat.opacity = THREE.MathUtils.damp(jetMat.opacity, targetJetOpacity, 5, delta);

      starGroup.rotation.y = elapsed * 0.08;

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.dispose();
      shellMeshes.forEach(s => {
        s.mesh.geometry.dispose();
        s.mat.dispose();
      });
      ringGeom.dispose();
      ringMat.dispose();
      jetGeom.dispose();
      jetMat.dispose();
      renderer.dispose();
    };
  }, [isOpen]);

  // ==========================================================================
  // D3 CHART 1: HERTZSPRUNG-RUSSELL (H-R) EVOLUTIONARY TRACK
  // ==========================================================================
  const hrSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!isOpen || !hrSvgRef.current || hrTrack.length === 0) return;
    const svg = d3.select(hrSvgRef.current);
    svg.selectAll('*').remove();

    const width = 440;
    const height = 220;
    const margin = { top: 18, right: 20, bottom: 34, left: 46 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // Inverted X-axis: hot O/B stars on left (logTeff 4.7), cool M stars on right (logTeff 3.4)
    const xScale = d3.scaleLinear().domain([4.7, 3.4]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([-3.5, 6.2]).range([innerH, 0]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Subtle grid lines
    g.append('g')
      .attr('stroke', 'rgba(148, 163, 184, 0.12)')
      .selectAll('line.h')
      .data([-2, 0, 2, 4, 6])
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d));

    // ZAMS Reference Diagonal Locus
    const zamsReference: [number, number][] = [
      [4.62, 5.4],
      [4.3, 3.2],
      [3.98, 1.4],
      [3.76, 0.0],
      [3.58, -1.5],
      [3.46, -2.8]
    ];
    const zamsLine = d3
      .line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(zamsReference)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(148, 163, 184, 0.32)')
      .attr('stroke-width', 1.25)
      .attr('stroke-dasharray', '3,3')
      .attr('d', zamsLine);

    g.append('text')
      .attr('x', xScale(4.15))
      .attr('y', yScale(1.8))
      .attr('fill', '#64748b')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text('ZAMS Locus');

    // Active Star Evolutionary Track Curve
    const trackLine = d3
      .line<HRPoint>()
      .x(d => xScale(d.logTeff))
      .y(d => yScale(d.logL))
      .curve(d3.curveCatmullRom.alpha(0.5));

    g.append('path')
      .datum(hrTrack)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2)
      .attr('d', trackLine);

    // Traversed portion up to current epoch
    const activeSlice = hrTrack.filter(p => p.epochPct <= epochPct);
    g.append('path')
      .datum(activeSlice)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2.6)
      .attr('d', trackLine);

    // Current Epoch Marker + Crosshair
    const cx = xScale(activePoint.logTeff);
    const cy = yScale(activePoint.logL);

    g.append('line')
      .attr('x1', cx)
      .attr('x2', cx)
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', 'rgba(245, 158, 11, 0.35)')
      .attr('stroke-dasharray', '2,2');

    g.append('circle')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', 5)
      .attr('fill', '#f59e0b')
      .attr('stroke', '#07090e')
      .attr('stroke-width', 1.5);

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues([4.6, 4.3, 4.0, 3.76, 3.5])
      .tickFormat(d => `${Math.round(Math.pow(10, Number(d)))}K`);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9px');

    g.append('g')
      .call(yAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9px');

    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 29)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text('Effective Temperature T_eff (K) [O → B → A → F → G → K → M]');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -34)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text('log₁₀(L / L☉)');
  }, [isOpen, hrTrack, activePoint, epochPct]);

  // ==========================================================================
  // D3 CHART 2: CHNOPS & HEAVY-ELEMENT NUCLEOSYNTHESIS YIELD PROFILE
  // ==========================================================================
  const yieldSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!isOpen || !yieldSvgRef.current || isotopeYields.length === 0) return;
    const svg = d3.select(yieldSvgRef.current);
    svg.selectAll('*').remove();

    const width = 440;
    const height = 215;
    const margin = { top: 16, right: 16, bottom: 32, left: 46 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const xScale = d3
      .scaleBand<string>()
      .domain(isotopeYields.map(d => d.isotope))
      .range([0, innerW])
      .padding(0.28);

    // Display normalized abundance index (logMassFraction + 6.0 so bars grow upward from -6.0 floor)
    const yScale = d3.scaleLinear().domain([-6.0, 0.0]).range([innerH, 0]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('stroke', 'rgba(148, 163, 184, 0.12)')
      .selectAll('line.grid')
      .data([-5, -4, -3, -2, -1, 0])
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d));

    // Bars colored by astrobiological CHNOPS vs rocky core classification
    const chnopsSet = new Set(['¹H', '¹²C', '¹⁴N', '¹⁶O', '³¹P', '³²S']);

    g.selectAll('rect.bar')
      .data(isotopeYields)
      .enter()
      .append('rect')
      .attr('x', (d: IsotopeYieldDatum) => xScale(d.isotope) || 0)
      .attr('y', (d: IsotopeYieldDatum) => yScale(Math.max(-6, d.logMassFraction)))
      .attr('width', xScale.bandwidth())
      .attr('height', (d: IsotopeYieldDatum) =>
        Math.max(2, innerH - yScale(Math.max(-6, d.logMassFraction)))
      )
      .attr('rx', 2)
      .attr('fill', (d: IsotopeYieldDatum) => (chnopsSet.has(d.isotope) ? '#10b981' : '#38bdf8'))
      .attr('fill-opacity', 0.82);

    // Value labels above bars
    g.selectAll('text.val')
      .data(isotopeYields)
      .enter()
      .append('text')
      .attr('x', (d: IsotopeYieldDatum) => (xScale(d.isotope) || 0) + xScale.bandwidth() / 2)
      .attr('y', (d: IsotopeYieldDatum) => yScale(Math.max(-6, d.logMassFraction)) - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', '#cbd5e1')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '8px')
      .text((d: IsotopeYieldDatum) => d.logMassFraction.toFixed(1));

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9px');

    g.append('g')
      .call(yAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9px');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -34)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text('log₁₀ Mass Fraction (X_i)');
  }, [isOpen, isotopeYields]);

  // ==========================================================================
  // GEMINI SCIENTIFIC SYNTHESIS & ANOMALY DETECTION HANDLER (WITH 429 FALLBACK)
  // ==========================================================================
  const buildDeterministicLocalSynthesis = (reason: string): GeminiNucleosynthesisReport => {
    const isMassive = massSolar >= 8.0;
    const isIntermediate = massSolar >= 0.8 && massSolar < 8.0;
    return {
      hydrostaticDiagnosis: `[Deterministic Local Parametric Calculation — ${reason}] Progenitor mass ${massSolar.toFixed(
        2
      )} M☉ at epoch ${epochPct}% (${
        activePoint.phaseName
      }) exhibits photospheric T_eff = ${activePoint.teffK} K, log10(L/L☉) = ${
        activePoint.logL
      }, and central core temperature ${activePoint.coreTempMK} MK.`,
      activeReactionChains: isMassive
        ? [
            'CNO Bi-Cycle',
            'Triple-Alpha (3 ⁴He → ¹²C)',
            'Carbon/Neon Shell Burning',
            'Oxygen/Silicon Alpha-Process'
          ]
        : isIntermediate
        ? ['p-p Chain', 'CNO-I Cycle', 'Triple-Alpha He Shell', 's-Process Neutron Capture']
        : ['Proton-Proton (p-p I) Chain', 'Full Interior Convective Mixing'],
      prebioticSeedingAnalysis: `Calculated isotopic mass fractions yield ¹²C log X = ${
        isotopeYields.find(i => i.isotope === '¹²C')?.logMassFraction ?? -2.6
      }, ¹⁶O log X = ${
        isotopeYields.find(i => i.isotope === '¹⁶O')?.logMassFraction ?? -2.2
      }, and ³¹P log X = ${
        isotopeYields.find(i => i.isotope === '³¹P')?.logMassFraction ?? -5.0
      }, supplying volatile CHNOPS feedstock to sector ${activePreset.targetClusterId}.`,
      cToORatioImplication: `Envelope C/O number ratio is ${cToORatio.toFixed(2)} (${
        cToORatio >= 1.0
          ? 'carbon-rich carbide/graphite dust regime'
          : 'oxygen-rich silicate dust regime'
      }).`,
      anomalyAlerts: [
        {
          title: 'Local Parametric Mode Active',
          severity: 'NOMINAL',
          mechanism:
            'Evaluated directly from client-side piecewise analytic scaling laws without external AI inference.'
        }
      ],
      recommendedAtlasNodes: activePreset.linkedNodeLabels,
      confidenceScore: 0.9
    };
  };

  const handleRunGeminiSynthesis = async () => {
    setIsScanningGemini(true);
    setGeminiError(null);
    try {
      const response = await fetch('/api/gemini/stellar-nucleosynthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progenitorName: activePreset.name,
          massSolar,
          metallicityZ,
          rotationKms,
          evolutionEpochPct: epochPct,
          phaseLabel: activePoint.phaseName,
          effectiveTempK: activePoint.teffK,
          luminosityLogSolar: activePoint.logL,
          coreTempMK: activePoint.coreTempMK,
          cToORatio,
          isotopicYields: isotopeYields.map(y => ({
            isotope: y.isotope,
            logMassFraction: y.logMassFraction,
            ejectedSolarMasses: y.ejectedSolarMasses
          }))
        })
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429 || data?.code === 'RESOURCE_EXHAUSTED') {
          setGeminiError(
            'Gemini API quota (HTTP 429) reached. Displaying deterministic local parametric synthesis.'
          );
          setGeminiReport(buildDeterministicLocalSynthesis('Gemini API HTTP 429 Quota Fallback'));
          return;
        }
        throw new Error(data.error || `Gemini synthesis failed (HTTP ${response.status})`);
      }
      setGeminiReport(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Synthesis failed';
      setGeminiError(`${msg} — Showing deterministic local physical summary.`);
      setGeminiReport(buildDeterministicLocalSynthesis('Offline / Local Fallback'));
    } finally {
      setIsScanningGemini(false);
    }
  };

  // ==========================================================================
  // SAVE TO OBSERVATORY VAULT & INJECT NODE INTO 3D COSMIC ATLAS
  // ==========================================================================
  const handleSaveToVault = async () => {
    setIsSavingVault(true);
    setVaultSavedStatus(null);

    const summaryNotes = [
      `Stellar Evolution & Nucleosynthesis Snapshot (${massSolar} M☉, Z=${metallicityZ}, Epoch ${epochPct}%: ${activePoint.phaseName}).`,
      `Photosphere T_eff: ${activePoint.teffK} K · log10(L/L☉): ${activePoint.logL} · Core T: ${activePoint.coreTempMK} MK · C/O Ratio: ${cToORatio}.`,
      geminiReport
        ? `Synthesis: ${geminiReport.hydrostaticDiagnosis} Prebiotic Seeding: ${geminiReport.prebioticSeedingAnalysis}`
        : `Key CHNOPS Yields: ¹²C (${isotopeYields.find(i => i.isotope === '¹²C')?.logMassFraction}), ¹⁶O (${isotopeYields.find(i => i.isotope === '¹⁶O')?.logMassFraction}), ³¹P (${isotopeYields.find(i => i.isotope === '³¹P')?.logMassFraction}).`
    ].join(' ');

    const saveLocalSnapshotFallback = (reason: string) => {
      try {
        const key = 'graphiverse_stellar_workbench_snapshots_v1';
        const prev = JSON.parse(window.localStorage.getItem(key) || '[]');
        const entry = {
          savedAtIso: new Date().toISOString(),
          persistenceMode: 'LOCAL_STORAGE_FALLBACK',
          label: `${activePreset.name.split('(')[0].trim()} [${massSolar} M☉ · Epoch ${epochPct}%]`,
          clusterId: activePreset.targetClusterId,
          coordinatesRaDec: activePreset.coordinatesRaDec,
          distanceLabel: activePreset.distanceLabel,
          summaryNotes
        };
        window.localStorage.setItem(key, JSON.stringify([entry, ...prev].slice(0, 25)));
        setVaultSavedStatus(
          `Saved to Local Browser Storage (${reason}). Cloud Firestore Vault was not modified.`
        );
      } catch {
        setVaultSavedStatus(`Local browser storage fallback failed (${reason}).`);
      }
    };

    if (!user) {
      saveLocalSnapshotFallback('Unauthenticated local fallback');
      setIsSavingVault(false);
      return;
    }

    try {
      const docId = await saveCelestialDiscovery({
        label: `${activePreset.name.split('(')[0].trim()} [${massSolar} M☉ · Epoch ${epochPct}%]`,
        scaleRegime: 'STELLAR_NUCLEOSYNTHESIS',
        clusterId: activePreset.targetClusterId,
        coordinatesRaDec: activePreset.coordinatesRaDec,
        distanceLabel: activePreset.distanceLabel,
        biosignatureNotes: summaryNotes,
        pubchemCid: activePreset.pubchemCid,
        confidence: geminiReport?.confidenceScore || 0.93,
        isPublic: true
      });
      setVaultSavedStatus(`Saved to Cloud Observatory Vault (Firestore celestialDiscoveries/${docId}).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.slice(0, 70) : 'Cloud error';
      saveLocalSnapshotFallback(`Remote error: ${msg}`);
    } finally {
      setIsSavingVault(false);
    }
  };

  const handleInjectNodeIntoAtlas = () => {
    const newNode: Node = {
      id: `stellar-nuc-${Date.now()}`,
      label: `${activePreset.name.split('(')[0].trim()} (${massSolar} M☉ Nucleosynthesis)`,
      type: NodeType.EVIDENCE,
      clusterId: activePreset.targetClusterId,
      val: 24,
      confidence: geminiReport?.confidenceScore || 0.94,
      source: 'Stellar Evolution & Nucleosynthesis Simulator',
      description:
        geminiReport?.prebioticSeedingAnalysis ||
        `Time-domain nucleosynthesis model at epoch ${epochPct}% (${activePoint.phaseName}). Photospheric T_eff = ${activePoint.teffK} K, Core T = ${activePoint.coreTempMK} MK, C/O ratio = ${cToORatio}.`,
      coordinatesRaDec: activePreset.coordinatesRaDec,
      distanceLabel: activePreset.distanceLabel,
      pubchemCid: activePreset.pubchemCid,
      citations: ['Burbidge et al. (1957) Rev. Mod. Phys. B2FH', 'Woosley & Heger (2002) Rev. Mod. Phys.']
    };
    onAddDiscoveryToAtlas(newNode);
    setVaultSavedStatus('Injected nucleosynthesis node into active 3D Cosmic Atlas.');
  };

  if (!isOpen) return null;

  const targetClusterObj = clusters.find(c => c.id === activePreset.targetClusterId);

  return (
    <div className="fixed inset-0 z-50 bg-[#07090E]/95 text-slate-100 flex flex-col overflow-hidden">
      {/* 1. TOP TELEMETRY RIBBON (Calibrated Scientific Observatory Header) */}
      <header className="h-12 px-5 bg-[#0B0E17] border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Flame className="w-4 h-4 text-amber-400 shrink-0" />
          <h2 className="font-display font-semibold text-sm text-slate-100 whitespace-nowrap">
            Stellar Evolution & Nucleosynthesis Time-Domain Simulator
          </h2>
          <span className="hidden lg:inline text-slate-600">·</span>
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400 tabular-nums truncate">
            <span>{activePreset.coordinatesRaDec}</span>
            <span className="text-slate-600">·</span>
            <span>{activePreset.distanceLabel}</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400">● Hydrostatic Solver Nominal</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsWhitepaperModalOpen(true)}
            className="px-3 py-1.5 rounded bg-amber-500/15 border border-amber-400/50 hover:bg-amber-500/25 text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            title="Open Stellar Evolution & Nucleosynthesis Academic Whitepaper"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Academic Whitepaper</span>
          </button>

          <button
            type="button"
            onClick={handleInjectNodeIntoAtlas}
            className="px-3 py-1.5 rounded bg-slate-900 border border-white/15 hover:border-sky-400/60 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>Add Node to 3D Atlas</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToVault}
            disabled={isSavingVault}
            className="px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSavingVault ? 'Saving Snapshot...' : 'Save Snapshot to Vault'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            title="Close Workbench"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. ASYMMETRIC 3-ZONE SCIENTIFIC WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* LEFT COLUMN (3 cols): Progenitor Presets, Physical Parameters & Atlas Linking */}
        <aside className="lg:col-span-3 bg-[#0B0E17] border-r border-white/10 p-4 overflow-y-auto space-y-5">
          {/* Progenitor Presets */}
          <div>
            <div className="text-xs font-mono text-slate-400 mb-2">
              01. Stellar Progenitor Regime
            </div>
            <div className="space-y-1.5">
              {STELLAR_PRESETS.map(preset => {
                const isSelected = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full text-left p-2.5 rounded-md border transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-sky-400/60 text-slate-100'
                        : 'bg-slate-950/60 border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate">{preset.name}</span>
                      <span className="text-[11px] font-mono text-amber-400 tabular-nums shrink-0">
                        {preset.massSolar} M☉
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {preset.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Physical Boundary Sliders */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="text-xs font-mono text-slate-400">
              02. Boundary Conditions & Stellar Mass
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Initial Mass (M / M☉)</span>
                <span className="font-mono text-sky-400 tabular-nums">{massSolar.toFixed(2)} M☉</span>
              </div>
              <input
                type="range"
                min={0.08}
                max={40.0}
                step={0.05}
                value={massSolar}
                onChange={e => setMassSolar(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Metallicity Mass Fraction (Z)</span>
                <span className="font-mono text-sky-400 tabular-nums">
                  {metallicityZ.toFixed(3)} ({(metallicityZ / 0.014).toFixed(2)} Z☉)
                </span>
              </div>
              <input
                type="range"
                min={0.001}
                max={0.04}
                step={0.001}
                value={metallicityZ}
                onChange={e => setMetallicityZ(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Equatorial Rotation (v_rot)</span>
                <span className="font-mono text-sky-400 tabular-nums">{rotationKms} km/s</span>
              </div>
              <input
                type="range"
                min={0}
                max={300}
                step={5}
                value={rotationKms}
                onChange={e => setRotationKms(parseInt(e.target.value, 10))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Live Physical Readout Grid */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <div className="text-xs font-mono text-slate-400">
              03. Instantaneous Interior Telemetry
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded bg-slate-900/90 border border-white/10">
                <div className="text-[10px] font-mono uppercase text-slate-400">Photosphere T_eff</div>
                <div className="text-base font-mono font-semibold text-slate-100 tabular-nums mt-0.5">
                  {activePoint.teffK.toLocaleString()}
                  <span className="text-[10px] text-slate-400 ml-1">K</span>
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-900/90 border border-white/10">
                <div className="text-[10px] font-mono uppercase text-slate-400">Luminosity</div>
                <div className="text-base font-mono font-semibold text-amber-400 tabular-nums mt-0.5">
                  {activePoint.logL >= 0 ? `+${activePoint.logL}` : activePoint.logL}
                  <span className="text-[10px] text-slate-400 ml-1">log L☉</span>
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-900/90 border border-white/10">
                <div className="text-[10px] font-mono uppercase text-slate-400">Core Temperature</div>
                <div className="text-base font-mono font-semibold text-sky-400 tabular-nums mt-0.5">
                  {activePoint.coreTempMK}
                  <span className="text-[10px] text-slate-400 ml-1">MK</span>
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-900/90 border border-white/10">
                <div className="text-[10px] font-mono uppercase text-slate-400">Envelope C/O Ratio</div>
                <div className="text-base font-mono font-semibold text-emerald-400 tabular-nums mt-0.5">
                  {cToORatio.toFixed(2)}
                  <span className="text-[10px] text-slate-400 ml-1">
                    {cToORatio >= 1.0 ? 'Carbide' : 'Silicate'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Direct 3D Cosmic Atlas Node Linking & Camera Synchronization */}
          <div className="pt-2 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                04. 3D Cosmic Atlas Synchronization
              </span>
              {targetClusterObj && (
                <button
                  onClick={() => {
                    onFocusAtlasCluster(activePreset.targetClusterId);
                    onClose();
                  }}
                  className="text-[11px] font-mono text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Compass className="w-3 h-3" />
                  <span>Jump Camera to Sector</span>
                </button>
              )}
            </div>

            <div className="text-xs text-slate-400 leading-relaxed">
              Target Sector:{' '}
              <span className="text-slate-200 font-medium">
                {targetClusterObj?.name || activePreset.targetClusterId}
              </span>
            </div>

            <div className="space-y-1.5">
              {matchingAtlasNodes.map(node => (
                <button
                  key={node.id}
                  onClick={() => {
                    onSelectAtlasNode(node);
                    onClose();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded bg-slate-900/70 border border-white/10 hover:border-sky-400/50 transition flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="text-xs text-slate-200 truncate">{node.label}</span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    Focus 3D →
                  </span>
                </button>
              ))}
            </div>
          </div>

          {vaultSavedStatus && (
            <div className="p-2.5 rounded bg-slate-900 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{vaultSavedStatus}</span>
            </div>
          )}
        </aside>

        {/* CENTER STAGE (5 cols): 3D WebGL Onion-Shell Cutaway & Collapsible Bottom Dock */}
        <main className="lg:col-span-5 relative bg-[#07090E] flex flex-col min-h-[380px] overflow-hidden">
          {/* Minimal Top-Left Viewport Overlay */}
          <div className="pointer-events-none absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
            <div className="bg-[#0B0E17]/90 border border-white/10 rounded px-3 py-2">
              <div className="text-[11px] font-mono text-amber-400">
                EPOCH {epochPct}% · {activePoint.phaseName}
              </div>
              <div className="text-xs text-slate-300 mt-0.5 tabular-nums font-mono">
                R = {activePoint.radiusSolar} R☉ · ρ_core ={' '}
                {activePoint.coreDensityGcm3.toLocaleString()} g/cm³
              </div>
            </div>

            <div className="bg-[#0B0E17]/90 border border-white/10 rounded px-2.5 py-1.5 text-[11px] font-mono text-slate-400">
              <span>Concentric Burning Shells: </span>
              <span className="text-orange-400">H</span> ·{' '}
              <span className="text-amber-300">He</span> ·{' '}
              <span className="text-emerald-400">C/Ne</span> ·{' '}
              <span className="text-sky-400">O/Si</span> ·{' '}
              <span className="text-indigo-300">Fe Core</span>
            </div>
          </div>

          {/* Isolated Three.js Canvas Mount Container */}
          <div ref={canvasMountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

          {/* Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-xl">
            <div className="flex justify-center mb-1">
              <button
                onClick={() => setIsHudDockCollapsed(prev => !prev)}
                className="px-2.5 py-0.5 rounded-t bg-[#0B0E17] border border-b-0 border-white/15 text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {isHudDockCollapsed ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Show Time-Domain & Cutaway Controls</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Hide Controls</span>
                  </>
                )}
              </button>
            </div>

            {!isHudDockCollapsed && (
              <div className="bg-[#0B0E17]/95 border border-white/15 rounded-lg p-3 space-y-2.5 shadow-xl">
                {/* Time-Domain Epoch Scrubber */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsPlayingTimeline(prev => !prev)}
                    className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {isPlayingTimeline ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Evolve</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setIsPlayingTimeline(false);
                      setEpochPct(0);
                    }}
                    className="p-1.5 rounded bg-slate-900 border border-white/10 text-slate-300 hover:text-white cursor-pointer shrink-0"
                    title="Reset to Zero-Age Main Sequence (0%)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-0.5 tabular-nums">
                      <span>Evolutionary Epoch Scrubber</span>
                      <span className="text-amber-400">{epochPct}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={epochPct}
                      onChange={e => setEpochPct(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 3D Cutaway & Shell Explode Controls */}
                <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-white/10">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-0.5 tabular-nums">
                      <span className="flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-sky-400" />
                        Cutaway Wedge
                      </span>
                      <span>{cutawayAngleDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={180}
                      step={5}
                      value={cutawayAngleDeg}
                      onChange={e => setCutawayAngleDeg(parseInt(e.target.value, 10))}
                      className="w-full accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-0.5 tabular-nums">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-emerald-400" />
                        Shell Separation
                      </span>
                      <span>{Math.round(explodeShells * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.02}
                      value={explodeShells}
                      onChange={e => setExplodeShells(parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT COLUMN (4 cols): D3 H-R Diagram, D3 CHNOPS Yields & Gemini Synthesis */}
        <aside className="lg:col-span-4 bg-[#0B0E17] border-l border-white/10 p-4 overflow-y-auto space-y-4">
          {/* D3 Chart 1: Hertzsprung-Russell Diagram */}
          <div className="p-3 rounded-md bg-slate-900/80 border border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-100">
                Hertzsprung-Russell Evolutionary Track
              </span>
              <span className="text-[11px] font-mono text-amber-400 tabular-nums">
                log T_eff = {activePoint.logTeff.toFixed(2)}
              </span>
            </div>
            <svg
              ref={hrSvgRef}
              viewBox="0 0 440 220"
              className="w-full h-auto overflow-visible"
            />
          </div>

          {/* D3 Chart 2: CHNOPS & Heavy-Element Nucleosynthesis Yields */}
          <div className="p-3 rounded-md bg-slate-900/80 border border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-100">
                Isotopic Nucleosynthesis Yield Profile
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                Emerald: CHNOPS · Cyan: Core/Mantle
              </span>
            </div>
            <svg
              ref={yieldSvgRef}
              viewBox="0 0 440 215"
              className="w-full h-auto overflow-visible"
            />
          </div>

          {/* Gemini Scientific Synthesis & Anomaly Detection */}
          <div className="p-3.5 rounded-md bg-slate-900/90 border border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Gemini Nucleosynthesis & Seeding Synthesis</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Evaluates nuclear reaction chains, C/O mineralogy & prebiotic seeding
                </div>
              </div>

              <button
                onClick={handleRunGeminiSynthesis}
                disabled={isScanningGemini}
                className="px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {isScanningGemini ? 'Synthesizing...' : 'Run Gemini Analysis'}
              </button>
            </div>

            {geminiError && (
              <div className="p-2.5 rounded bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
                {geminiError}
              </div>
            )}

            {geminiReport ? (
              <div className="space-y-3 text-xs leading-relaxed pt-1 border-t border-white/10">
                <div>
                  <div className="text-[11px] font-mono text-sky-400 mb-0.5">
                    Hydrostatic & Nuclear Regime Diagnosis
                  </div>
                  <p className="text-slate-300">{geminiReport.hydrostaticDiagnosis}</p>
                </div>

                <div>
                  <div className="text-[11px] font-mono text-amber-400 mb-1">
                    Active Nuclear Reaction Networks
                  </div>
                  <div className="text-slate-300 font-mono text-[11px]">
                    {geminiReport.activeReactionChains.join(' · ')}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-mono text-emerald-400 mb-0.5">
                    Prebiotic Astrobiology & C/O Seeding Impact
                  </div>
                  <p className="text-slate-300">{geminiReport.prebioticSeedingAnalysis}</p>
                  <p className="text-slate-400 mt-1">{geminiReport.cToORatioImplication}</p>
                </div>

                {geminiReport.anomalyAlerts && geminiReport.anomalyAlerts.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono text-slate-400">
                      Instability & Anomaly Telemetry
                    </div>
                    {geminiReport.anomalyAlerts.map((alert, i) => (
                      <div
                        key={i}
                        className="p-2 rounded bg-slate-950/80 border border-white/10 space-y-0.5"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-200 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            {alert.title}
                          </span>
                          <span
                            className={
                              alert.severity === 'CRITICAL'
                                ? 'text-rose-400'
                                : alert.severity === 'ELEVATED'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{alert.mechanism}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-2">
                Click <strong className="text-slate-200">Run Gemini Analysis</strong> to synthesize
                how the current stellar mass ({massSolar} M☉) and evolutionary epoch ({epochPct}%)
                seed interstellar molecular clouds with bio-essential isotopes.
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Single Root Academic Whitepaper Modal Instance */}
      <AcademicWhitepaperModal
        isOpen={isWhitepaperModalOpen}
        onClose={() => setIsWhitepaperModalOpen(false)}
        initialTab="STELLAR_WHITEPAPER"
        user={user}
        stellarSnapshot={{
          presetId: activePreset.id,
          progenitorName: activePreset.name,
          massSolar,
          metallicityZ,
          rotationKms,
          epochPct,
          phaseName: activePoint.phaseName,
          teffK: activePoint.teffK,
          logTeff: activePoint.logTeff,
          logL: activePoint.logL,
          radiusSolar: activePoint.radiusSolar,
          coreTempMK: activePoint.coreTempMK,
          coreDensityGcm3: activePoint.coreDensityGcm3,
          cToORatio,
          coordinatesRaDec: activePreset.coordinatesRaDec,
          distanceLabel: activePreset.distanceLabel,
          targetClusterId: activePreset.targetClusterId,
          pubchemCid: activePreset.pubchemCid,
          isotopicYields: isotopeYields,
          capturedAtIso: new Date().toISOString()
        }}
        onJumpToFigureTarget={clusterId => {
          onFocusAtlasCluster(clusterId);
          setIsWhitepaperModalOpen(false);
          onClose();
        }}
      />
    </div>
  );
};
