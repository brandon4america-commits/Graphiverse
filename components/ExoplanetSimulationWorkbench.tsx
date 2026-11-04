import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Sliders,
  Sparkles,
  FlaskConical,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Share2,
  ExternalLink,
  X,
  Compass
} from 'lucide-react';
import { StoredDiscovery, saveCelestialDiscovery } from '../services/firebase';
import { User } from 'firebase/auth';
import { BioSignatureScannerModal } from './BioSignatureScannerModal';

interface ExoplanetSimulationWorkbenchProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onAddDiscoveryToAtlas: (discovery: StoredDiscovery) => void;
}

interface ExoplanetState {
  name: string;
  stellarType: 'M-Dwarf (Red)' | 'K-Dwarf (Orange)' | 'G-Dwarf (Solar)' | 'F-Dwarf (Yellow-White)';
  stellarFlux: number; // 0.2 to 3.5 Earth units
  planetRadius: number; // 0.8 to 2.2 Earth radii
  distanceLightYears: number; // 4.2 to 1240
  // Atmospheric gas percentages (sum to ~100)
  gasO2: number;
  gasCH4: number;
  gasCO2: number;
  gasH2O: number;
  gasNH3: number;
  gasN2: number;
}

export const ExoplanetSimulationWorkbench: React.FC<ExoplanetSimulationWorkbenchProps> = ({
  isOpen,
  onClose,
  user,
  onAddDiscoveryToAtlas
}) => {
  const [planet, setPlanet] = useState<ExoplanetState>({
    name: 'K2-18b (Temperate Hycean / Sub-Neptune)',
    stellarType: 'M-Dwarf (Red)',
    stellarFlux: 1.05,
    planetRadius: 2.37,
    distanceLightYears: 124.0,
    gasO2: 12.0,
    gasCH4: 1.8,
    gasCO2: 1.4,
    gasH2O: 24.5,
    gasNH3: 0.2,
    gasN2: 60.1
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isBioScannerOpen, setIsBioScannerOpen] = useState(false);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);

  // Normalize gases so they sum to 100 whenever modified
  const updateGas = (key: keyof ExoplanetState, val: number) => {
    setPlanet(prev => {
      const next = { ...prev, [key]: val };
      const total =
        next.gasO2 + next.gasCH4 + next.gasCO2 + next.gasH2O + next.gasNH3 + next.gasN2;
      // Rescale N2 to balance
      if (key !== 'gasN2' && total > 0) {
        const others = next.gasO2 + next.gasCH4 + next.gasCO2 + next.gasH2O + next.gasNH3;
        next.gasN2 = Math.max(0, parseFloat((100 - others).toFixed(1)));
      }
      return next;
    });
  };

  // Compute Photochemical Equilibrium & Biosignature Score
  const computeMetrics = () => {
    // Co-presence of oxidizing O2 and reducing CH4 indicates strong thermodynamic disequilibrium
    const o2Ch4Synergy = Math.min(1, (planet.gasO2 * planet.gasCH4) / 45);
    const waterPresence = Math.min(1, planet.gasH2O / 25);
    const co2Greenhouse = Math.min(1, planet.gasCO2 / 10);
    
    // Stability against UV photolysis
    const uvStability = planet.stellarType.includes('M-Dwarf') ? 0.72 : 0.94;

    const disequilibriumScore = Math.round((o2Ch4Synergy * 0.45 + waterPresence * 0.35 + (1 - planet.gasNH3 / 10) * 0.2) * 100 * uvStability);
    
    let confidenceLabel = 'Abiotic Equilibrium / Geological';
    if (disequilibriumScore > 82 && planet.gasO2 > 5 && planet.gasCH4 > 0.5) {
      confidenceLabel = 'High Biosignature Confidence (O2 + CH4 Coexistence)';
    } else if (disequilibriumScore > 65) {
      confidenceLabel = 'Moderate Astrobiological Disequilibrium';
    } else if (planet.gasNH3 > 5) {
      confidenceLabel = 'Primitive Reducing Volatiles';
    }

    return { disequilibriumScore, confidenceLabel, o2Ch4Synergy };
  };

  const metrics = computeMetrics();

  // Draw Synthetic JWST Transmission Spectrum (0.6µm - 5.0µm)
  useEffect(() => {
    if (!isOpen) return;
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background grid & axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, h - 30);
      ctx.stroke();
    }
    for (let y = 20; y < h - 30; y += 40) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = '#94A3B8';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('0.6µm (Optical)', 40, h - 12);
    ctx.fillText('2.5µm (JWST NIRSpec)', w / 2 - 50, h - 12);
    ctx.fillText('5.0µm (MIRI)', w - 80, h - 12);

    ctx.save();
    ctx.translate(12, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Transit Depth (%)', 0, 0);
    ctx.restore();

    // Plot Transmission Spectrum Curve
    ctx.beginPath();
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2.5;

    const points: { x: number; y: number }[] = [];
    const step = 2;
    for (let px = 40; px <= w - 20; px += step) {
      const wavelength = 0.6 + ((px - 40) / (w - 60)) * 4.4; // 0.6 to 5.0 µm
      
      // Base baseline transit depth
      let depth = 1.4 + Math.sin(wavelength * 1.5) * 0.12;

      // Absorption features based on atmospheric gases
      // H2O absorption at ~1.4µm, 1.9µm, 2.7µm
      const h2oAbs = (planet.gasH2O / 30) * (
        Math.exp(-Math.pow(wavelength - 1.4, 2) / 0.04) * 0.35 +
        Math.exp(-Math.pow(wavelength - 1.9, 2) / 0.05) * 0.45 +
        Math.exp(-Math.pow(wavelength - 2.7, 2) / 0.08) * 0.6
      );

      // CH4 absorption at ~2.3µm, 3.3µm
      const ch4Abs = (planet.gasCH4 / 5) * (
        Math.exp(-Math.pow(wavelength - 2.3, 2) / 0.03) * 0.4 +
        Math.exp(-Math.pow(wavelength - 3.3, 2) / 0.04) * 0.75
      );

      // CO2 absorption at ~4.3µm
      const co2Abs = (planet.gasCO2 / 10) * (
        Math.exp(-Math.pow(wavelength - 4.3, 2) / 0.05) * 0.85
      );

      depth += h2oAbs + ch4Abs + co2Abs;
      const py = (h - 30) - (depth / 3.2) * (h - 50);
      points.push({ x: px, y: py });
    }

    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Annotate Absorption Peaks
    const annotations = [
      { wl: 1.4, label: 'H₂O', color: '#38BDF8' },
      { wl: 2.3, label: 'CH₄', color: '#10B981' },
      { wl: 3.3, label: 'CH₄', color: '#10B981' },
      { wl: 4.3, label: 'CO₂', color: '#F59E0B' }
    ];

    annotations.forEach(ann => {
      const px = 40 + ((ann.wl - 0.6) / 4.4) * (w - 60);
      ctx.beginPath();
      ctx.fillStyle = ann.color;
      ctx.arc(px, h / 2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ann.label, px, (h / 2) - 10);
    });
  }, [isOpen, planet]);

  const handleSaveToVault = async () => {
    if (!user) {
      alert('Please sign in with Google to save exoplanet simulations to your Observatory Vault.');
      return;
    }
    setIsSaving(true);
    try {
      await saveCelestialDiscovery({
        label: planet.name,
        scaleRegime: 'EXOPLANETARY',
        clusterId: 'c-exoplanets',
        coordinatesRaDec: `RA ${Math.random().toFixed(2)}h DEC +${Math.random().toFixed(1)}°`,
        distanceLabel: `${planet.distanceLightYears} Light-Years`,
        biosignatureNotes: `Atmosphere: O2(${planet.gasO2}%), CH4(${planet.gasCH4}%), CO2(${planet.gasCO2}%), H2O(${planet.gasH2O}%). Disequilibrium Score: ${metrics.disequilibriumScore}%. ${metrics.confidenceLabel}`,
        pubchemCid: 297,
        confidence: metrics.disequilibriumScore / 100,
        isPublic: true
      });
      const discovery: StoredDiscovery = {
        id: `exo-${Date.now()}`,
        ownerId: user.uid,
        ownerName: user.displayName || 'Cosmic Astronomer',
        label: planet.name,
        scaleRegime: 'EXOPLANETARY',
        clusterId: 'c-exoplanets',
        coordinatesRaDec: `RA ${Math.random().toFixed(2)}h DEC +${Math.random().toFixed(1)}°`,
        distanceLabel: `${planet.distanceLightYears} Light-Years`,
        biosignatureNotes: `Atmosphere: O2(${planet.gasO2}%), CH4(${planet.gasCH4}%), CO2(${planet.gasCO2}%), H2O(${planet.gasH2O}%). Disequilibrium Score: ${metrics.disequilibriumScore}%. ${metrics.confidenceLabel}`,
        pubchemCid: 297,
        confidence: metrics.disequilibriumScore / 100,
        isPublic: true
      };
      onAddDiscoveryToAtlas(discovery);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.warn('Failed to save exoplanet simulation:', e);
      alert('Failed to save simulation to Firebase vault. Please check permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6">
      <div className="hud-panel w-full max-w-6xl h-[90vh] rounded-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0A0E17]">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-sky-400" />
            <div>
              <div className="text-xs font-mono text-sky-400">
                Advanced Astrobiology & Exoplanet Simulation Workbench
              </div>
              <h2 className="text-sm sm:text-base font-display font-semibold text-slate-100">
                {planet.name} · Photochemical Equilibrium & JWST Transmission Spectra
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white border border-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto p-5 gap-6">
          {/* Left Column: Atmospheric Sliders & Stellar Parameters */}
          <div className="lg:col-span-6 space-y-5">
            {/* Target Selector Bar */}
            <div className="p-4 rounded-md bg-slate-900/80 border border-white/10 space-y-3">
              <div className="text-xs font-mono text-slate-400">Exoplanet Target Profile</div>
              <input
                type="text"
                value={planet.name}
                onChange={e => setPlanet({ ...planet, name: e.target.value })}
                className="w-full bg-slate-950 border border-white/15 rounded px-3 py-2 text-sm text-slate-100 focus:border-sky-400 outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Stellar Type</label>
                  <select
                    value={planet.stellarType}
                    onChange={e => setPlanet({ ...planet, stellarType: e.target.value as any })}
                    className="w-full mt-1 bg-slate-950 border border-white/15 rounded px-2.5 py-2 text-xs text-slate-200 outline-none"
                  >
                    <option>M-Dwarf (Red)</option>
                    <option>K-Dwarf (Orange)</option>
                    <option>G-Dwarf (Solar)</option>
                    <option>F-Dwarf (Yellow-White)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Stellar Flux ($S_0$)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.2"
                    max="4.0"
                    value={planet.stellarFlux}
                    onChange={e => setPlanet({ ...planet, stellarFlux: parseFloat(e.target.value) || 1 })}
                    className="w-full mt-1 bg-slate-950 border border-white/15 rounded px-2.5 py-2 text-xs text-slate-200 font-mono tabular-nums outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Atmospheric Composition Sliders */}
            <div className="p-4 rounded-md bg-slate-900/80 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-slate-400">Atmospheric Gas Mixing Ratios</div>
                <div className="text-[11px] font-mono text-sky-400 tabular-nums">
                  Total: {Math.round(planet.gasO2 + planet.gasCH4 + planet.gasCO2 + planet.gasH2O + planet.gasNH3 + planet.gasN2)}%
                </div>
              </div>

              {[
                { label: 'Oxygen (O₂ - Oxidizer)', key: 'gasO2' as const, color: '#38BDF8', val: planet.gasO2, max: 40 },
                { label: 'Methane (CH₄ - Biosignature)', key: 'gasCH4' as const, color: '#10B981', val: planet.gasCH4, max: 15 },
                { label: 'Carbon Dioxide (CO₂ - Greenhouse)', key: 'gasCO2' as const, color: '#F59E0B', val: planet.gasCO2, max: 30 },
                { label: 'Water Vapor (H₂O - Hydrosphere)', key: 'gasH2O' as const, color: '#6366F1', val: planet.gasH2O, max: 60 },
                { label: 'Ammonia (NH₃ - Reducing)', key: 'gasNH3' as const, color: '#EC4899', val: planet.gasNH3, max: 10 },
                { label: 'Nitrogen (N₂ - Inert Buffer)', key: 'gasN2' as const, color: '#94A3B8', val: planet.gasN2, max: 90 }
              ].map(gas => (
                <div key={gas.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span style={{ color: gas.color }}>{gas.label}</span>
                    <span className="text-slate-200 tabular-nums">{gas.val}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={gas.max}
                    step="0.1"
                    value={gas.val}
                    onChange={e => updateGas(gas.key, parseFloat(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Synthetic JWST Spectrum & Disequilibrium Analysis */}
          <div className="lg:col-span-6 space-y-5 flex flex-col">
            {/* Synthetic JWST Transmission Spectrum Canvas */}
            <div className="p-4 rounded-md bg-slate-900/80 border border-white/10 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-mono text-sky-400">
                  Synthetic JWST NIRSpec / MIRI Transmission Spectrum
                </div>
                <div className="text-[11px] font-mono text-slate-400">0.6µm - 5.0µm</div>
              </div>
              <div className="relative w-full h-56 bg-slate-950 rounded border border-white/10 overflow-hidden flex items-center justify-center">
                <canvas ref={spectrumCanvasRef} width={520} height={220} className="w-full h-full" />
              </div>
            </div>

            {/* Biosignature Confidence & Thermodynamic Disequilibrium Score */}
            <div className="p-4 rounded-md bg-slate-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-slate-400">Thermodynamic Disequilibrium Index</div>
                <div className="text-lg font-display font-semibold text-emerald-400 tabular-nums">
                  {metrics.disequilibriumScore}%
                </div>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-500 transition-all duration-500"
                  style={{ width: `${metrics.disequilibriumScore}%` }}
                />
              </div>
              <div className="p-3 rounded bg-slate-950 border border-white/10 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-slate-100">
                    {metrics.confidenceLabel}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Co-occurrence of oxidizing O₂ ({planet.gasO2}%) and reducing CH₄ ({planet.gasCH4}%) requires continual biological replenishment against solar UV photolysis.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions & Firebase Save */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                PubChem CIDs: 977 (O₂), 297 (CH₄), 280 (CO₂), 962 (H₂O)
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsBioScannerOpen(true)}
                  className="px-4 py-2 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  Run Bio-Signature Scanner (Gemini & D3)
                </button>
                <button
                  onClick={handleSaveToVault}
                  disabled={isSaving}
                  className="px-4 py-2 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                      Saved to Vault!
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      Save to Observatory Vault
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bio-Signature Scanner Modal */}
        <BioSignatureScannerModal
          isOpen={isBioScannerOpen}
          onClose={() => setIsBioScannerOpen(false)}
          planet={planet}
        />
      </div>
    </div>
  );
};
