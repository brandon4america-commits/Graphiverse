import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Activity, ShieldAlert, Cpu, Download, CheckCircle2 } from 'lucide-react';
import * as d3 from 'd3';
import { analyzeExoplanetBioSignatureScanner, BioSignatureScanResult } from '../services/gemini';

interface BioSignatureScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  planet: any;
}

export const BioSignatureScannerModal: React.FC<BioSignatureScannerModalProps> = ({
  isOpen,
  onClose,
  planet
}) => {
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<BioSignatureScanResult | null>(null);
  const [activeWavelengthHover, setActiveWavelengthHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);
    analyzeExoplanetBioSignatureScanner(planet)
      .then(res => {
        if (isMounted) {
          setScanResult(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen, planet]);

  // Render D3 Spectral Chart
  useEffect(() => {
    if (!scanResult || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 640;
    const height = 260;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = scanResult.spectralCurve;
    const typedData = data as { wavelength: number; transmissionDepth: number }[];

    const x = d3
      .scaleLinear()
      .domain([d3.min(typedData, d => d.wavelength) || 0.5, d3.max(typedData, d => d.wavelength) || 10.0])
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([
        (d3.min(typedData, d => d.transmissionDepth) || 1.0) * 0.95,
        (d3.max(typedData, d => d.transmissionDepth) || 2.5) * 1.05
      ])
      .range([innerHeight, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(6)
          .tickSize(-innerHeight)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.05)');

    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', 'rgba(255, 255, 255, 0.05)');

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d => `${d}µm`))
      .attr('color', '#64748B')
      .style('font-size', '10px')
      .style('font-family', 'monospace');

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#64748B')
      .style('font-size', '10px')
      .style('font-family', 'monospace');

    // Axis labels
    g.append('text')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + 35})`)
      .style('text-anchor', 'middle')
      .style('fill', '#94A3B8')
      .style('font-size', '10px')
      .style('font-family', 'monospace')
      .text('Wavelength (µm) — JWST NIRSpec / MIRI Bandpass');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -38)
      .attr('x', -innerHeight / 2)
      .style('text-anchor', 'middle')
      .style('fill', '#94A3B8')
      .style('font-size', '10px')
      .style('font-family', 'monospace')
      .text('Transit Absorption Depth (%)');

    // Area generator for transmission envelope
    const area = d3
      .area<any>()
      .x(d => x(d.wavelength))
      .y0(innerHeight)
      .y1(d => y(d.transmissionDepth))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'rgba(56, 189, 248, 0.12)')
      .attr('d', area);

    // Line generator
    const line = d3
      .line<any>()
      .x(d => x(d.wavelength))
      .y(d => y(d.transmissionDepth))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#38BDF8')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Key Biomarker Absorption Bands Annotation
    const biomarkerBands = [
      { wl: 0.76, label: 'O₂ A-Band', color: '#38BDF8' },
      { wl: 1.40, label: 'H₂O', color: '#6366F1' },
      { wl: 1.66, label: 'CH₄', color: '#10B981' },
      { wl: 4.30, label: 'CO₂', color: '#F59E0B' },
      { wl: 9.60, label: 'O₃', color: '#A855F7' }
    ];

    biomarkerBands.forEach(band => {
      if (band.wl >= (x.domain()[0]) && band.wl <= (x.domain()[1])) {
        const cx = x(band.wl);
        const matchPt = data.reduce((prev, curr) => 
          Math.abs(curr.wavelength - band.wl) < Math.abs(prev.wavelength - band.wl) ? curr : prev
        );
        const cy = y(matchPt.transmissionDepth);

        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 5)
          .attr('fill', band.color)
          .attr('stroke', '#0F172A')
          .attr('stroke-width', 2);

        g.append('text')
          .attr('x', cx)
          .attr('y', cy - 10)
          .attr('text-anchor', 'middle')
          .attr('fill', band.color)
          .style('font-size', '9px')
          .style('font-family', 'monospace')
          .style('font-weight', 'bold')
          .text(band.label);
      }
    });

  }, [scanResult]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="hud-panel w-full max-w-5xl h-[88vh] rounded-lg flex flex-col overflow-hidden border border-sky-500/30">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A0E17]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-sky-400 tracking-wider">
                GEMINI 3.8 ASTROBIOLOGY BIO-SIGNATURE SCANNER
              </div>
              <h2 className="text-base font-display font-semibold text-slate-100">
                {planet.name} · High-Precision Spectral Transmission & Biomarker Diagnostics
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded text-slate-400 hover:text-white border border-white/10 cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto p-6 gap-6 bg-slate-950/70">
          {loading ? (
            <div className="lg:col-span-12 flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
              <div className="text-xs font-mono text-sky-400 animate-pulse">
                Executing Gemini Astrobiological Transmission Spectra & Disequilibrium Scan...
              </div>
            </div>
          ) : scanResult ? (
            <>
              {/* Left Column: D3 Spectrum Graph & JWST Parameters */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-4 rounded-lg bg-slate-900/90 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono text-sky-400 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      JWST NIRSpec / MIRI Transmission Spectrum (0.5µm - 10.0µm)
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Rec. JWST Integration: <span className="text-emerald-400">{scanResult.recommendedJwstHours} Hours</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-950 rounded border border-white/10 p-2 flex items-center justify-center">
                    <svg ref={svgRef} className="w-full h-auto max-h-[260px]" />
                  </div>
                </div>

                {/* Biomarker Probability Bars */}
                <div className="p-4 rounded-lg bg-slate-900/90 border border-white/10 space-y-4">
                  <div className="text-xs font-mono text-slate-300">Biomarker Probability & Confidence Matrix</div>
                  <div className="space-y-3">
                    {scanResult.biomarkerProbabilities.map((b, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-200 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              b.status === 'DETECTED' ? 'bg-emerald-400' :
                              b.status === 'SUSPECTED' ? 'bg-amber-400' : 'bg-slate-600'
                            }`} />
                            {b.biomarker}
                          </span>
                          <span className="text-sky-400 font-semibold tabular-nums">{b.probability}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 ${
                              b.status === 'DETECTED' ? 'bg-emerald-500' :
                              b.status === 'SUSPECTED' ? 'bg-amber-500' : 'bg-slate-700'
                            }`}
                            style={{ width: `${b.probability}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">{b.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Gemini Spectroscopic Analysis & Report */}
              <div className="lg:col-span-5 space-y-6 flex flex-col">
                <div className="p-5 rounded-lg bg-slate-900/90 border border-white/10 flex-1 flex flex-col space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
                    <Cpu className="w-4 h-4" />
                    Gemini Astrobiological Synthesis & Falsification Notes
                  </div>
                  <div className="flex-1 bg-slate-950/80 rounded border border-white/10 p-4 overflow-y-auto text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-line">
                    {scanResult.spectroscopicAnalysis}
                  </div>
                  <div className="p-3 rounded bg-amber-950/20 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <div className="font-semibold">Abiotic Degeneracy Check</div>
                      <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                        Verify against volcanic outgassing and UV photolysis false-positives before publishing to Observatory Vault.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={onClose}
                      className="w-full py-2.5 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Acknowledge & Return to Workbench
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="lg:col-span-12 text-center py-16 text-slate-400 text-xs font-mono">
              Scan failed to initialize. Please retry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
