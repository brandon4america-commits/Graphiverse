import React, { useState } from 'react';
import {
  Flame,
  Activity,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Sliders,
  Sparkles,
  Eye,
  EyeOff,
  Palette,
  AlertCircle
} from 'lucide-react';
import {
  HeatmapSettings,
  HeatmapMetricMode,
  HeatmapPalette,
  HeatmapHotspot
} from '../types';
import { getPaletteColorRamps } from '../services/heatmapEngine';

interface HeatmapControlsProps {
  settings: HeatmapSettings;
  onUpdateSettings: (newSettings: HeatmapSettings) => void;
  hotspots: HeatmapHotspot[];
  onFocusHotspot: (hotspot: HeatmapHotspot) => void;
  selectedHotspotId?: string | null;
}

export const HeatmapControls: React.FC<HeatmapControlsProps> = ({
  settings,
  onUpdateSettings,
  hotspots,
  onFocusHotspot,
  selectedHotspotId
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'CALIBRATION' | 'HOTSPOTS'>('CALIBRATION');

  const updateSetting = <K extends keyof HeatmapSettings>(
    key: K,
    val: HeatmapSettings[K]
  ) => {
    onUpdateSettings({
      ...settings,
      [key]: val
    });
  };

  const currentRamp = getPaletteColorRamps(settings.palette);

  return (
    <div className="pointer-events-auto fixed bottom-24 right-5 z-20 flex flex-col items-end">
      {/* Expanded Control Drawer */}
      {isExpanded && (
        <div className="hud-panel hud-reticle mb-2.5 w-84 sm:w-96 rounded p-4 shadow-[0_12px_40px_rgba(0,0,0,0.85)] border border-[#00F0FF]/35 max-h-[70vh] overflow-y-auto">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#00F0FF]/25 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40">
                <Flame className="w-4 h-4" />
              </span>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#00F0FF]">
                  VOLUMETRIC SCALAR FIELD
                </div>
                <h4 className="text-xs font-bold text-white tracking-wide">
                  Epistemic Friction & Graph Activity
                </h4>
              </div>
            </div>

            <button
              onClick={() => updateSetting('enabled', !settings.enabled)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase flex items-center gap-1.5 transition cursor-pointer border ${
                settings.enabled
                  ? 'bg-[#00FF9D]/15 text-[#00FF9D] border-[#00FF9D]/50 shadow-[0_0_10px_rgba(0,255,157,0.25)]'
                  : 'bg-white/5 text-[#94A3B8] border-white/20'
              }`}
            >
              {settings.enabled ? (
                <>
                  <Eye className="w-3 h-3" />
                  <span>OVERLAY ON</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" />
                  <span>DISABLED</span>
                </>
              )}
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="grid grid-cols-2 gap-1.5 mb-3 p-1 rounded bg-black/40 border border-white/10">
            <button
              onClick={() => setActiveTab('CALIBRATION')}
              className={`py-1 text-[10px] font-mono uppercase rounded transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'CALIBRATION'
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-bold border border-[#00F0FF]/40'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>FIELD CALIBRATION</span>
            </button>
            <button
              onClick={() => setActiveTab('HOTSPOTS')}
              className={`py-1 text-[10px] font-mono uppercase rounded transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'HOTSPOTS'
                  ? 'bg-[#FF2A5F]/20 text-[#FF2A5F] font-bold border border-[#FF2A5F]/40'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Crosshair className="w-3 h-3" />
              <span>EPICENTERS ({hotspots.length})</span>
            </button>
          </div>

          {activeTab === 'CALIBRATION' ? (
            <div className="space-y-3.5">
              {/* Metric Mode Selector */}
              <div>
                <label className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider block mb-1.5">
                  Target Field Metric
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => updateSetting('mode', 'FRICTION')}
                    className={`p-2 rounded text-left transition cursor-pointer border flex flex-col gap-1 ${
                      settings.mode === 'FRICTION'
                        ? 'bg-[#FF2A5F]/20 border-[#FF2A5F] text-white shadow-[0_0_12px_rgba(255,42,95,0.3)]'
                        : 'bg-[#0A1322] border-white/10 text-[#94A3B8] hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-[#FF2A5F]">
                      <Flame className="w-3 h-3" />
                      <span>FRICTION</span>
                    </div>
                    <div className="text-[9px] leading-tight text-white/70">
                      Tension & Disputes
                    </div>
                  </button>

                  <button
                    onClick={() => updateSetting('mode', 'ACTIVITY')}
                    className={`p-2 rounded text-left transition cursor-pointer border flex flex-col gap-1 ${
                      settings.mode === 'ACTIVITY'
                        ? 'bg-[#00FF9D]/20 border-[#00FF9D] text-white shadow-[0_0_12px_rgba(0,255,157,0.3)]'
                        : 'bg-[#0A1322] border-white/10 text-[#94A3B8] hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-[#00FF9D]">
                      <Activity className="w-3 h-3" />
                      <span>ACTIVITY</span>
                    </div>
                    <div className="text-[9px] leading-tight text-white/70">
                      Velocity & Hubs
                    </div>
                  </button>

                  <button
                    onClick={() => updateSetting('mode', 'COMPOSITE')}
                    className={`p-2 rounded text-left transition cursor-pointer border flex flex-col gap-1 ${
                      settings.mode === 'COMPOSITE'
                        ? 'bg-[#B877FF]/20 border-[#B877FF] text-white shadow-[0_0_12px_rgba(184,119,255,0.3)]'
                        : 'bg-[#0A1322] border-white/10 text-[#94A3B8] hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-[#B877FF]">
                      <Zap className="w-3 h-3" />
                      <span>COMPOSITE</span>
                    </div>
                    <div className="text-[9px] leading-tight text-white/70">
                      Unified Synergy
                    </div>
                  </button>
                </div>
              </div>

              {/* Sliders Grid */}
              <div className="space-y-2.5 pt-1 border-t border-white/10">
                {/* Intensity Slider */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8] mb-1">
                    <span>FIELD GAIN (INTENSITY)</span>
                    <span className="text-[#00F0FF]">{settings.intensity.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="2.8"
                    step="0.05"
                    value={settings.intensity}
                    onChange={e => updateSetting('intensity', parseFloat(e.target.value))}
                    className="w-full accent-[#00F0FF] bg-black/60 h-1.5 rounded cursor-pointer"
                  />
                </div>

                {/* Influence Radius Slider */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8] mb-1">
                    <span>DISPERSION RADIUS (σ)</span>
                    <span className="text-[#00F0FF]">{Math.round(settings.radius)} px</span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="135"
                    step="1"
                    value={settings.radius}
                    onChange={e => updateSetting('radius', parseFloat(e.target.value))}
                    className="w-full accent-[#00F0FF] bg-black/60 h-1.5 rounded cursor-pointer"
                  />
                </div>

                {/* Threshold Noise Gate Slider */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8] mb-1">
                    <span>THRESHOLD GATE (CUTOFF)</span>
                    <span className="text-[#FFB800]">{Math.round(settings.threshold * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.45"
                    step="0.01"
                    value={settings.threshold}
                    onChange={e => updateSetting('threshold', parseFloat(e.target.value))}
                    className="w-full accent-[#FFB800] bg-black/60 h-1.5 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Palette & Aesthetics */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <label className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider block">
                  Volumetric Color Spectrum
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['SPECTRAL_FRICTION', 'THERMAL_ENERGY', 'CHRONO_NEON'] as HeatmapPalette[]).map(
                    p => {
                      const ramp = getPaletteColorRamps(p);
                      const isSelected = settings.palette === p;
                      return (
                        <button
                          key={p}
                          onClick={() => updateSetting('palette', p)}
                          className={`p-2 rounded text-left border cursor-pointer transition ${
                            isSelected
                              ? 'bg-white/10 border-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                              : 'bg-[#0A1322] border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center h-2 rounded overflow-hidden mb-1.5">
                            {ramp.hexStrings.map(hex => (
                              <div
                                key={hex}
                                className="flex-1 h-full"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                          <div className="text-[9px] font-mono text-white/80 truncate">
                            {ramp.label}
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Quick Feature Toggles */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showHotspots}
                    onChange={e => updateSetting('showHotspots', e.target.checked)}
                    className="accent-[#00F0FF] rounded cursor-pointer"
                  />
                  <span>Epicenter Beacons</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showIsoContours}
                    onChange={e => updateSetting('showIsoContours', e.target.checked)}
                    className="accent-[#00F0FF] rounded cursor-pointer"
                  />
                  <span>Iso-Surface Shells</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.pulseWithAudio}
                    onChange={e => updateSetting('pulseWithAudio', e.target.checked)}
                    className="accent-[#00F0FF] rounded cursor-pointer"
                  />
                  <span>Audio Sync</span>
                </label>
              </div>
            </div>
          ) : (
            /* Hotspots Epicenters List */
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-[#94A3B8] mb-1 flex items-center justify-between">
                <span>DETECTED LOCAL MAXIMA ({hotspots.length})</span>
                <span className="text-[#00F0FF]">CLICK TO WARP</span>
              </div>

              {hotspots.length === 0 ? (
                <div className="p-4 rounded bg-black/40 border border-white/10 text-center text-xs text-[#94A3B8]">
                  No high-tension epicenters found at current threshold.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[38vh] overflow-y-auto pr-1">
                  {hotspots.map((spot, idx) => {
                    const isSelected = selectedHotspotId === spot.id;
                    const isFriction = spot.category !== 'ACTIVITY_SURGE';
                    const scorePct = Math.round(spot.score * 100);

                    return (
                      <div
                        key={spot.id}
                        onClick={() => onFocusHotspot(spot)}
                        className={`p-2.5 rounded transition cursor-pointer border ${
                          isSelected
                            ? 'bg-[#00F0FF]/20 border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                            : 'bg-[#0A1322] border-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isFriction ? 'bg-[#FF2A5F]' : 'bg-[#00FF9D]'
                              }`}
                            />
                            <span
                              className={
                                isFriction ? 'text-[#FF2A5F]' : 'text-[#00FF9D]'
                              }
                            >
                              EPICENTER #{idx + 1} // {spot.category.replace('_', ' ')}
                            </span>
                          </span>

                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/10 text-white font-bold">
                            {scorePct}%
                          </span>
                        </div>

                        <div className="text-xs font-bold text-white leading-tight truncate mb-1">
                          {spot.label}
                        </div>

                        <div className="text-[10px] font-mono text-[#94A3B8] line-clamp-2 leading-relaxed mb-2">
                          {spot.diagnostic}
                        </div>

                        <div className="flex items-center justify-between text-[9px] font-mono text-[#7CE8FF] pt-1.5 border-t border-white/5">
                          <span>SECTOR: {spot.clusterName}</span>
                          <span className="flex items-center gap-1 text-[#00F0FF] group-hover:underline">
                            <Crosshair className="w-2.5 h-2.5" />
                            <span>WARP FOCUS</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Toggle HUD Pill */}
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className={`hud-panel px-3.5 py-2 rounded-full font-mono text-xs uppercase flex items-center gap-2.5 cursor-pointer transition shadow-[0_6px_24px_rgba(0,0,0,0.65)] border ${
          settings.enabled
            ? 'border-[#00F0FF]/60 text-white hover:border-[#00F0FF] shadow-[0_0_16px_rgba(0,240,255,0.25)]'
            : 'border-white/20 text-[#94A3B8] hover:border-white/40'
        }`}
        title="Toggle Volumetric Epistemic Heatmap Overlay Controls"
      >
        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
          {settings.enabled && (
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
              style={{
                backgroundColor:
                  settings.mode === 'FRICTION'
                    ? '#FF2A5F'
                    : settings.mode === 'ACTIVITY'
                    ? '#00FF9D'
                    : '#B877FF'
              }}
            />
          )}
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{
              backgroundColor: settings.enabled
                ? settings.mode === 'FRICTION'
                  ? '#FF2A5F'
                  : settings.mode === 'ACTIVITY'
                  ? '#00FF9D'
                  : '#B877FF'
                : '#64748B'
            }}
          />
        </span>

        <span className="font-bold tracking-wider text-[11px]">
          HEATMAP [{settings.enabled ? settings.mode : 'OFF'}]
        </span>

        <span className="text-[#00F0FF] ml-0.5">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </span>
      </button>
    </div>
  );
};

export default HeatmapControls;
