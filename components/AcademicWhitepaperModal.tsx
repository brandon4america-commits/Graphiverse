import React, { useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  BookOpen,
  Download,
  Sliders,
  Library,
  FileCode,
  ExternalLink,
  Plus,
  Compass,
  CheckCircle2,
  Sparkles,
  Search,
  Printer,
  Database,
  Flame,
  HardDrive,
  X
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  AcademicCitation,
  GraphData,
  LiveOpticalPhysicsParams
} from '../types';
import {
  DEFAULT_OPTICAL_PHYSICS_PARAMS,
  INITIAL_WHITEPAPER_CITATIONS,
  WHITEPAPER_MANUSCRIPT_TITLE,
  WHITEPAPER_AUTHORS,
  WHITEPAPER_SECTIONS,
  EMPIRICAL_BENCHMARK_TABLE,
  generateBibTeXFile,
  generateLaTeXManuscript,
  generateMarkdownWhitepaper
} from '../services/whitepaperData';
import { searchAstrobiologyLiterature, LiteratureWorkItem } from '../services/scienceService';
import { saveCelestialDiscovery } from '../services/firebase';
import {
  StellarEvolutionWhitepaper,
  StellarModelSnapshot,
  StellarWhitepaperVaultRecord,
  STELLAR_WHITEPAPER_TITLE
} from './StellarEvolutionWhitepaper';

export type WhitepaperTab =
  | 'STELLAR_WHITEPAPER'
  | 'MANUSCRIPT'
  | 'EQUATIONS'
  | 'BIBLIOGRAPHY'
  | 'EXPORT';

export interface AcademicWhitepaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphData?: GraphData;
  citations?: AcademicCitation[];
  onAddCitation?: (citation: AcademicCitation) => void;
  physicsParams?: LiveOpticalPhysicsParams;
  onUpdatePhysicsParams?: (params: LiveOpticalPhysicsParams) => void;
  onJumpToFigureTarget?: (clusterId: string, nodeId?: string) => void;
  initialTab?: WhitepaperTab;
  user?: User | null;
  stellarSnapshot?: StellarModelSnapshot;
}

const LOCAL_STORAGE_WHITEPAPER_KEY = 'graphiverse_stellar_whitepaper_records_v1';

const FALLBACK_EMPTY_GRAPH: GraphData = {
  nodes: [],
  links: [],
  clusters: []
};

const AcademicWhitepaperModal: React.FC<AcademicWhitepaperModalProps> = ({
  isOpen,
  onClose,
  graphData = FALLBACK_EMPTY_GRAPH,
  citations = INITIAL_WHITEPAPER_CITATIONS,
  onAddCitation,
  physicsParams = DEFAULT_OPTICAL_PHYSICS_PARAMS,
  onUpdatePhysicsParams,
  onJumpToFigureTarget,
  initialTab = 'STELLAR_WHITEPAPER',
  user = null,
  stellarSnapshot
}) => {
  const [activeTab, setActiveTab] = useState<WhitepaperTab>(initialTab);
  const [litQuery, setLitQuery] = useState('exoplanet biosignature dimethyl sulfide K2-18b');
  const [litResults, setLitResults] = useState<LiteratureWorkItem[]>([]);
  const [isSearchingLit, setIsSearchingLit] = useState(false);
  const [exportPreviewMode, setExportPreviewMode] = useState<'LATEX' | 'BIBTEX' | 'MARKDOWN'>('LATEX');
  const [copiedFlag, setCopiedFlag] = useState(false);

  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    mode: 'CLOUD' | 'LOCAL';
    message: string;
  } | null>(null);

  const opticsCanvasRef = useRef<HTMLCanvasElement>(null);
  const modalDialogRef = useRef<HTMLDivElement>(null);

  // Sync activeTab when modal opens with a specific initialTab
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSaveFeedback(null);
      // Focus dialog container for keyboard accessibility
      setTimeout(() => {
        modalDialogRef.current?.focus();
      }, 20);
    }
  }, [isOpen, initialTab]);

  // Keyboard Accessibility: Escape closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Render Live Optical Physics Curves (Cauchy n(λ) & Airy Thin-Film Reflectance)
  useEffect(() => {
    if (!isOpen || activeTab !== 'EQUATIONS') return;
    const canvas = opticsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 15);
      ctx.lineTo(x, h - 25);
      ctx.stroke();
    }
    for (let y = 20; y < h - 20; y += 35) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(w - 15, y);
      ctx.stroke();
    }

    // Wavelength range: 380 nm to 750 nm
    // Curve 1: Cauchy Refractive Index n(λ) = A + B / λ_μm²
    ctx.beginPath();
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2.5;
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const lambdaNm = 380 + t * (750 - 380);
      const lambdaUm = lambdaNm / 1000;
      const nLambda = physicsParams.cauchyA + physicsParams.cauchyB / (lambdaUm * lambdaUm);
      const normY = (nLambda - 1.45) / 0.25;
      const px = 40 + t * (w - 60);
      const py = h - 30 - Math.max(0, Math.min(1, normY)) * (h - 55);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Curve 2: Thin-Film Airy Interference Reflectance I(λ)
    ctx.beginPath();
    ctx.strokeStyle = '#FFB800';
    ctx.lineWidth = 2.0;
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const lambdaNm = 380 + t * (750 - 380);
      const opd =
        2 * physicsParams.filmRefractiveIndex * physicsParams.thinFilmThicknessNm + lambdaNm / 2;
      const refl = Math.pow(Math.cos((Math.PI * opd) / lambdaNm), 2);
      const px = 40 + t * (w - 60);
      const py = h - 30 - refl * (h - 55);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('380 nm (UV/Blue)', 40, h - 8);
    ctx.fillText('550 nm (Green)', w / 2 - 35, h - 8);
    ctx.fillText('750 nm (Near-IR)', w - 115, h - 8);

    ctx.fillStyle = '#00F0FF';
    ctx.fillText('— Cauchy Dispersion n(λ)', 50, 22);
    ctx.fillStyle = '#FFB800';
    ctx.fillText('— Airy Thin-Film Reflectance I(λ)', 230, 22);
  }, [isOpen, activeTab, physicsParams]);

  if (!isOpen) return null;

  const defaultSnapshot: StellarModelSnapshot = stellarSnapshot || {
    presetId: 'betelgeuse-supergiant',
    progenitorName: 'Alpha Orionis (Betelgeuse Progenitor)',
    massSolar: 18.5,
    metallicityZ: 0.02,
    rotationKms: 15,
    epochPct: 76,
    phaseName: 'Advanced Onion-Shell Burning (C → Ne/Mg → O → Si → Fe Core)',
    teffK: 3540,
    logTeff: 3.55,
    logL: 4.92,
    radiusSolar: 724.5,
    coreTempMK: 1840.0,
    coreDensityGcm3: 940000.0,
    cToORatio: 0.48,
    coordinatesRaDec: 'RA 05h 55m 10.3s · Dec +07° 24′ 25″',
    distanceLabel: '548 ly (168 pc)',
    targetClusterId: 'c-interstellar-chemistry',
    pubchemCid: 750,
    isotopicYields: [],
    capturedAtIso: new Date().toISOString()
  };

  const persistLocalWhitepaperFallback = (
    record: StellarWhitepaperVaultRecord,
    reasonLabel: string
  ) => {
    try {
      const existingRaw = window.localStorage.getItem(LOCAL_STORAGE_WHITEPAPER_KEY);
      const list: StellarWhitepaperVaultRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [record, ...list].slice(0, 25);
      window.localStorage.setItem(LOCAL_STORAGE_WHITEPAPER_KEY, JSON.stringify(updated));
      setSaveFeedback({
        mode: 'LOCAL',
        message: `Saved to Local Browser Storage (${reasonLabel}). Cloud Vault was not modified.`
      });
    } catch {
      setSaveFeedback({
        mode: 'LOCAL',
        message: `Local browser storage write failed (${reasonLabel}).`
      });
    }
  };

  const handleSaveWhitepaperToVault = async () => {
    setIsSavingRecord(true);
    setSaveFeedback(null);

    const record: StellarWhitepaperVaultRecord = {
      schemaVersion: '1.0.0',
      manuscriptId: 'graphiverse-stellar-nucleosynthesis-wp-2026-v1',
      manuscriptTitle: STELLAR_WHITEPAPER_TITLE,
      savedAtIso: new Date().toISOString(),
      persistenceMode: user ? 'CLOUD_FIRESTORE' : 'LOCAL_STORAGE_FALLBACK',
      renderingBackend: 'Three.js / WebGL 2.0 / GLSL (WebGPU proposed future backend only)',
      epistemicBoundaries: {
        stellarInteriorReference: 'MESA (Paxton et al. 2011-2019)',
        astrovisualizationComparator: 'OpenSpace (Bock et al. 2019)',
        atmosphericComparators:
          'ATMO (Tremblin et al. 2015) & Exo-REM (Baudino et al. 2015) — atmospheric comparators only, not stellar interior solvers',
        calibrationNote:
          'Unverified heuristic/softmax scores are never reported as calibrated biosignature or astrophysical probabilities.'
      },
      modelSnapshot: defaultSnapshot
    };

    if (!user) {
      persistLocalWhitepaperFallback(
        { ...record, persistenceMode: 'LOCAL_STORAGE_FALLBACK' },
        'Unauthenticated local fallback'
      );
      setIsSavingRecord(false);
      return;
    }

    try {
      // Map strictly to the existing StoredDiscovery schema in services/firebase.ts
      const provenanceNotes = JSON.stringify({
        schemaVersion: record.schemaVersion,
        manuscriptId: record.manuscriptId,
        savedAtIso: record.savedAtIso,
        renderingBackend: record.renderingBackend,
        epistemicBoundaries: record.epistemicBoundaries,
        snapshot: {
          progenitorName: defaultSnapshot.progenitorName,
          massSolar: defaultSnapshot.massSolar,
          metallicityZ: defaultSnapshot.metallicityZ,
          rotationKms: defaultSnapshot.rotationKms,
          epochPct: defaultSnapshot.epochPct,
          phaseName: defaultSnapshot.phaseName,
          teffK: defaultSnapshot.teffK,
          logL: defaultSnapshot.logL,
          coreTempMK: defaultSnapshot.coreTempMK,
          cToORatio: defaultSnapshot.cToORatio
        }
      }).slice(0, 3900);

      const docId = await saveCelestialDiscovery({
        label: `Whitepaper Dossier: ${defaultSnapshot.progenitorName.slice(0, 90)} [${defaultSnapshot.massSolar} M☉ · v1.0.0]`,
        scaleRegime: 'STELLAR_WHITEPAPER_DOSSIER',
        clusterId: defaultSnapshot.targetClusterId || 'c-interstellar-chemistry',
        coordinatesRaDec: defaultSnapshot.coordinatesRaDec,
        distanceLabel: defaultSnapshot.distanceLabel,
        biosignatureNotes: provenanceNotes,
        pubchemCid: defaultSnapshot.pubchemCid || 750,
        confidence: 0.95,
        isPublic: true
      });

      // Also keep local browser mirror
      try {
        const existingRaw = window.localStorage.getItem(LOCAL_STORAGE_WHITEPAPER_KEY);
        const list: StellarWhitepaperVaultRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
        window.localStorage.setItem(
          LOCAL_STORAGE_WHITEPAPER_KEY,
          JSON.stringify([record, ...list].slice(0, 25))
        );
      } catch {
        // Ignore local mirror quota errors when cloud succeeds
      }

      setSaveFeedback({
        mode: 'CLOUD',
        message: `Saved to Cloud Observatory Vault (Firestore celestialDiscoveries/${docId}).`
      });
    } catch (err: unknown) {
      const reason =
        err instanceof Error ? `Cloud error fallback: ${err.message.slice(0, 80)}` : 'Cloud unavailable';
      persistLocalWhitepaperFallback(
        { ...record, persistenceMode: 'LOCAL_STORAGE_FALLBACK' },
        reason
      );
    } finally {
      setIsSavingRecord(false);
    }
  };

  const handlePrintPdf = () => {
    if (activeTab !== 'STELLAR_WHITEPAPER') {
      setActiveTab('STELLAR_WHITEPAPER');
      setTimeout(() => {
        window.print();
      }, 120);
    } else {
      window.print();
    }
  };

  const handleSearchLiterature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!litQuery.trim() || isSearchingLit) return;
    setIsSearchingLit(true);
    try {
      const items = await searchAstrobiologyLiterature(litQuery.trim());
      setLitResults(items);
    } catch (err) {
      console.warn('Literature search warning:', err);
    } finally {
      setIsSearchingLit(false);
    }
  };

  const handleDownloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZipBundle = async () => {
    const zip = new JSZip();
    const tex = generateLaTeXManuscript(citations, physicsParams, graphData);
    const bib = generateBibTeXFile(citations);
    const md = generateMarkdownWhitepaper(citations, physicsParams, graphData);
    const telemetryJson = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        manuscriptTitle: WHITEPAPER_MANUSCRIPT_TITLE,
        stellarWhitepaperTitle: STELLAR_WHITEPAPER_TITLE,
        opticalPhysicsParameters: physicsParams,
        stellarSnapshot: defaultSnapshot,
        empiricalBenchmarks: EMPIRICAL_BENCHMARK_TABLE,
        atlasSummary: {
          clusters: graphData.clusters.length,
          nodes: graphData.nodes.length,
          links: graphData.links.length
        }
      },
      null,
      2
    );

    zip.file('main.tex', tex);
    zip.file('references.bib', bib);
    zip.file('whitepaper.md', md);
    zip.file('reproducibility_telemetry.json', telemetryJson);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `known-universe-academic-publication-bundle-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewText =
    exportPreviewMode === 'LATEX'
      ? generateLaTeXManuscript(citations, physicsParams, graphData)
      : exportPreviewMode === 'BIBTEX'
      ? generateBibTeXFile(citations)
      : generateMarkdownWhitepaper(citations, physicsParams, graphData);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="academic-whitepaper-modal-title"
      ref={modalDialogRef}
      tabIndex={-1}
      className="whitepaper-print-root fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 outline-none"
    >
      <div className="whitepaper-print-container hud-panel w-full max-w-6xl h-[92vh] rounded-lg flex flex-col overflow-hidden">
        {/* Header (Hidden on Print via .no-print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-white/10 bg-[#0A0E17]">
          <div className="flex items-center gap-3 min-w-0">
            <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-mono text-sky-400">
                IEEE TVCG / Nature Astronomy Format · Reproducible Documentation &amp; Whitepaper Suite
              </div>
              <h2
                id="academic-whitepaper-modal-title"
                className="text-sm sm:text-base font-display font-semibold text-slate-100 truncate"
              >
                {activeTab === 'STELLAR_WHITEPAPER'
                  ? STELLAR_WHITEPAPER_TITLE
                  : WHITEPAPER_MANUSCRIPT_TITLE}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSaveWhitepaperToVault}
              disabled={isSavingRecord}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-white/15 hover:border-sky-400/60 text-slate-100 text-xs font-medium transition cursor-pointer disabled:opacity-50"
              title="Save Versioned Whitepaper Record & Model Snapshot to Observatory Vault (with Local Fallback)"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>{isSavingRecord ? 'Saving...' : 'Save to Vault'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-400 transition cursor-pointer"
              title="Print or Export Complete Whitepaper as PDF via Browser Print Dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadZipBundle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-500 text-slate-950 text-xs font-semibold hover:bg-sky-400 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .ZIP</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Academic Whitepaper Modal (Escape)"
              className="p-1.5 rounded text-slate-400 hover:text-white border border-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Persistence Status Banner (Hidden on Print) */}
        {saveFeedback && (
          <div
            role="status"
            className={`no-print px-5 py-2 text-xs font-mono flex items-center justify-between border-b ${
              saveFeedback.mode === 'CLOUD'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {saveFeedback.mode === 'CLOUD' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <HardDrive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span>{saveFeedback.message}</span>
            </div>
            <span className="text-[11px] uppercase">
              {saveFeedback.mode === 'CLOUD' ? 'Remote Firestore Verified' : 'Local Browser Fallback'}
            </span>
          </div>
        )}

        {/* Navigation Sub-Bar (Hidden on Print via .no-print) */}
        <div className="no-print flex items-center justify-between px-5 py-2 border-b border-white/10 bg-[#0B0F19]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(
              [
                {
                  id: 'STELLAR_WHITEPAPER',
                  label: 'Stellar Evolution & Nucleosynthesis Whitepaper',
                  icon: Flame
                },
                { id: 'MANUSCRIPT', label: 'Optical Atlas Manuscript', icon: BookOpen },
                { id: 'EQUATIONS', label: 'Optical Shader Physics', icon: Sliders },
                {
                  id: 'BIBLIOGRAPHY',
                  label: `Citations & Literature (${citations.length})`,
                  icon: Library
                },
                { id: 'EXPORT', label: 'LaTeX / BibTeX / Markdown', icon: FileCode }
              ] as { id: WhitepaperTab; label: string; icon: any }[]
            ).map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/35'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden xl:flex items-center gap-2 text-xs font-mono text-slate-400 tabular-nums">
            <span>Esc to Close</span>
            <span>·</span>
            <span>Native MathML</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="whitepaper-scroll-pane flex-1 overflow-y-auto p-5 sm:p-6">
          {/* TAB 0: STELLAR EVOLUTION & NUCLEOSYNTHESIS WHITEPAPER (Always rendered in print mode too) */}
          {activeTab === 'STELLAR_WHITEPAPER' && (
            <StellarEvolutionWhitepaper snapshot={defaultSnapshot} />
          )}

          {/* TAB 1: INTERACTIVE MANUSCRIPT READER */}
          {activeTab === 'MANUSCRIPT' && (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Manuscript Title Block */}
              <div className="p-6 rounded bg-[#070E1B] border border-[#00F0FF]/30 text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[11px] font-mono text-[#00F0FF]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>REPRODUCIBLE COMPUTATIONAL ASTROPHYSICS &amp; ASTROBIOLOGY MANUSCRIPT</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-white leading-snug">
                  {WHITEPAPER_MANUSCRIPT_TITLE}
                </h1>
                <p className="text-xs font-mono text-[#94A3B8]">{WHITEPAPER_AUTHORS}</p>
              </div>

              {/* Sections */}
              {WHITEPAPER_SECTIONS.map(sec => (
                <article
                  key={sec.id}
                  className="p-5 sm:p-6 rounded bg-[#070D19] border border-white/10 space-y-4"
                >
                  <div className="border-b border-white/10 pb-3">
                    <div className="text-xs font-mono text-[#00F0FF] uppercase tracking-wider">
                      SECTION {sec.number}
                    </div>
                    <h3 className="text-lg font-display font-bold text-white mt-0.5">
                      {sec.title}
                    </h3>
                    <div className="text-xs font-mono text-[#94A3B8] mt-0.5">{sec.subtitle}</div>
                  </div>

                  <div className="space-y-3 text-sm text-slate-200 leading-relaxed">
                    {sec.paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>

                  {/* Equations */}
                  {sec.latexEquations && sec.latexEquations.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      {sec.latexEquations.map(eq => (
                        <div
                          key={eq.id}
                          className="p-3.5 rounded bg-[#040811] border border-[#00F0FF]/30 font-mono"
                        >
                          <div className="flex items-center justify-between text-[11px] text-[#00F0FF] mb-1">
                            <span className="font-bold">{eq.label}</span>
                            <span className="text-[#94A3B8]">ANALYTICAL FORMULATION</span>
                          </div>
                          <div className="text-xs sm:text-sm text-[#00FF9D] py-1.5 overflow-x-auto">
                            {eq.formula}
                          </div>
                          <div className="text-[11px] text-[#94A3B8]">{eq.description}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interactive Live Figure */}
                  {sec.figure && onJumpToFigureTarget && (
                    <div className="p-4 rounded bg-[#091326] border border-[#FFB800]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40 text-[10px] font-mono font-bold">
                            {sec.figure.figureNumber} — LIVE WEBGL FIGURE
                          </span>
                          <span className="text-[11px] font-mono text-[#00F0FF] tabular-nums">
                            {sec.figure.metricSummary}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {sec.figure.caption}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onJumpToFigureTarget(
                            sec.figure!.targetClusterId,
                            sec.figure!.targetNodeId
                          );
                          onClose();
                        }}
                        className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#00F0FF] text-[#030508] font-mono text-xs font-bold uppercase hover:bg-[#33f3ff] transition cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Inspect in 3D Atlas</span>
                      </button>
                    </div>
                  )}
                </article>
              ))}

              {/* Empirical Evaluation Table */}
              <div className="p-5 sm:p-6 rounded bg-[#070D19] border border-[#00F0FF]/30 space-y-4">
                <div>
                  <div className="text-xs font-mono text-[#00F0FF] uppercase">
                    TABLE I — EMPIRICAL PERFORMANCE &amp; BIOINFORMATICS COHERENCE BENCHMARKS
                  </div>
                  <h3 className="text-base font-display font-bold text-white mt-0.5">
                    Multi-Scale Rendering, Federated API Latency, and Audio-Visual Coherence (C_AV)
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                    <thead>
                      <tr className="border-b border-white/15 text-[#00F0FF]">
                        <th className="py-2 pr-3">Cosmic Scale Sector</th>
                        <th className="py-2 px-3">Spatial Regime</th>
                        <th className="py-2 px-3">Frame Time</th>
                        <th className="py-2 px-3">Draw Calls</th>
                        <th className="py-2 px-3">Bio-API Latency</th>
                        <th className="py-2 px-3">C_AV Score</th>
                        <th className="py-2 pl-3">Mean Conf.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {EMPIRICAL_BENCHMARK_TABLE.map(row => (
                        <tr key={row.sector} className="hover:bg-white/5">
                          <td className="py-2.5 pr-3 text-white font-medium">{row.sector}</td>
                          <td className="py-2.5 px-3 text-[#94A3B8]">{row.scaleOrder}</td>
                          <td className="py-2.5 px-3 text-[#00FF9D]">{row.meanFrameTimeMs} ms</td>
                          <td className="py-2.5 px-3 text-slate-200">{row.drawCalls}</td>
                          <td className="py-2.5 px-3 text-[#00F0FF]">{row.bioApiLatencyMs} ms</td>
                          <td className="py-2.5 px-3 text-[#FFB800]">
                            {row.avCoherence.toFixed(2)}
                          </td>
                          <td className="py-2.5 pl-3 text-[#00FF9D]">{row.epistemicConfidence}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE REPRODUCIBLE EQUATIONS & SHADER PHYSICS INSPECTOR */}
          {activeTab === 'EQUATIONS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-4">
                <div className="p-4 rounded bg-[#070E1B] border border-[#00F0FF]/30 space-y-4">
                  <div className="text-xs font-mono uppercase text-[#00F0FF] font-bold">
                    LIVE OPTICAL &amp; RELATIVISTIC SHADER PARAMETER CONTROLS
                  </div>

                  {/* Cauchy A */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200">Cauchy Baseline Refractive Index (A)</span>
                      <span className="text-[#00F0FF] tabular-nums">
                        {physicsParams.cauchyA.toFixed(4)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1.35}
                      max={1.75}
                      step={0.005}
                      value={physicsParams.cauchyA}
                      onChange={e =>
                        onUpdatePhysicsParams?.({
                          ...physicsParams,
                          cauchyA: Number(e.target.value)
                        })
                      }
                      className="w-full accent-[#00F0FF] cursor-pointer"
                    />
                  </div>

                  {/* Cauchy B */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200">Cauchy Chromatic Dispersion (B [μm²])</span>
                      <span className="text-[#00F0FF] tabular-nums">
                        {physicsParams.cauchyB.toFixed(4)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.001}
                      max={0.018}
                      step={0.0005}
                      value={physicsParams.cauchyB}
                      onChange={e =>
                        onUpdatePhysicsParams?.({
                          ...physicsParams,
                          cauchyB: Number(e.target.value)
                        })
                      }
                      className="w-full accent-[#00F0FF] cursor-pointer"
                    />
                  </div>

                  {/* Thin Film Thickness */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200">
                        Thin-Film Airy Coating Thickness (d_film)
                      </span>
                      <span className="text-[#FFB800] tabular-nums">
                        {physicsParams.thinFilmThicknessNm} nm
                      </span>
                    </div>
                    <input
                      type="range"
                      min={120}
                      max={850}
                      step={10}
                      value={physicsParams.thinFilmThicknessNm}
                      onChange={e =>
                        onUpdatePhysicsParams?.({
                          ...physicsParams,
                          thinFilmThicknessNm: Number(e.target.value)
                        })
                      }
                      className="w-full accent-[#FFB800] cursor-pointer"
                    />
                  </div>

                  {/* Henyey-Greenstein Anisotropy g */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200">Henyey-Greenstein Mie Anisotropy (g)</span>
                      <span className="text-[#00FF9D] tabular-nums">
                        {physicsParams.mieAnisotropyG.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.95}
                      step={0.02}
                      value={physicsParams.mieAnisotropyG}
                      onChange={e =>
                        onUpdatePhysicsParams?.({
                          ...physicsParams,
                          mieAnisotropyG: Number(e.target.value)
                        })
                      }
                      className="w-full accent-[#00FF9D] cursor-pointer"
                    />
                  </div>

                  {/* Anamorphic Streak Gain */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-200">Anamorphic Optical Flare Gain</span>
                      <span className="text-[#B877FF] tabular-nums">
                        {physicsParams.anamorphicStreakGain.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={2.0}
                      step={0.05}
                      value={physicsParams.anamorphicStreakGain}
                      onChange={e =>
                        onUpdatePhysicsParams?.({
                          ...physicsParams,
                          anamorphicStreakGain: Number(e.target.value)
                        })
                      }
                      className="w-full accent-[#B877FF] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-4">
                <div className="p-4 rounded bg-[#070E1B] border border-white/15 space-y-3">
                  <div className="text-xs font-mono uppercase text-[#00F0FF] font-bold">
                    REAL-TIME SPECTRAL DISPERSION &amp; AIRY INTERFERENCE RESPONSE (380–750 nm)
                  </div>
                  <canvas
                    ref={opticsCanvasRef}
                    width={520}
                    height={230}
                    className="w-full rounded bg-[#03060C] border border-white/10"
                  />
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs tabular-nums">
                    <div className="p-2.5 rounded bg-[#040811] border border-white/10">
                      <div className="text-[10px] text-[#94A3B8]">n(λ_Blue = 460nm)</div>
                      <div className="text-sm font-bold text-[#00F0FF]">
                        {(physicsParams.cauchyA + physicsParams.cauchyB / (0.46 * 0.46)).toFixed(4)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-[#040811] border border-white/10">
                      <div className="text-[10px] text-[#94A3B8]">n(λ_Green = 532nm)</div>
                      <div className="text-sm font-bold text-[#00FF9D]">
                        {(
                          physicsParams.cauchyA +
                          physicsParams.cauchyB / (0.532 * 0.532)
                        ).toFixed(4)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-[#040811] border border-white/10">
                      <div className="text-[10px] text-[#94A3B8]">n(λ_Red = 650nm)</div>
                      <div className="text-sm font-bold text-[#FFB800]">
                        {(physicsParams.cauchyA + physicsParams.cauchyB / (0.65 * 0.65)).toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUTOMATED LITERATURE CITATION & GROUNDING BIBLIOGRAPHY */}
          {activeTab === 'BIBLIOGRAPHY' && (
            <div className="space-y-6">
              {/* Live Federated Literature Search */}
              <div className="p-4 rounded bg-[#070E1B] border border-[#00F0FF]/30 space-y-3">
                <div className="text-xs font-mono uppercase text-[#00F0FF] font-bold">
                  FEDERATED ASTROBIOLOGY &amp; ASTROPHYSICS LITERATURE SEARCH (EUROPE PMC + OPENALEX)
                </div>
                <form onSubmit={handleSearchLiterature} className="flex gap-2">
                  <input
                    type="text"
                    value={litQuery}
                    onChange={e => setLitQuery(e.target.value)}
                    placeholder="Search peer-reviewed papers (e.g., K2-18b dimethyl sulfide, tardigrade Dsup, Orion glycine)..."
                    className="flex-1 bg-[#03060C] border border-white/20 rounded px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#00F0FF]"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingLit}
                    className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#00F0FF] text-[#030508] font-mono text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{isSearchingLit ? 'Searching...' : 'Query Literature'}</span>
                  </button>
                </form>

                {litResults.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {litResults.map(item => {
                      const bibKey = `${
                        item.authors.split(/[,\s]+/)[0]?.toLowerCase() || 'ref'
                      }${item.year}`;
                      const alreadyCited = citations.some(c => c.title === item.title);
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded bg-[#040914] border border-white/10 flex flex-col justify-between gap-2"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF]">
                                {item.source} • {item.year}
                              </span>
                              <span className="text-[#00FF9D] tabular-nums">
                                {item.citationCount} Citations
                              </span>
                            </div>
                            <div className="text-xs font-bold text-white line-clamp-2">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-[#94A3B8] truncate">
                              {item.authors}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <a
                              href={item.doiOrUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono text-[#00F0FF] hover:underline flex items-center gap-1"
                            >
                              <span>DOI / Source</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              disabled={alreadyCited || !onAddCitation}
                              onClick={() =>
                                onAddCitation?.({
                                  id: `cit-${Date.now()}`,
                                  authors: item.authors,
                                  year: item.year,
                                  title: item.title,
                                  venue: item.venue,
                                  doiOrUrl: item.doiOrUrl,
                                  bibtexKey: `${bibKey}_${Math.floor(Math.random() * 90 + 10)}`,
                                  sourceDatabase: item.source
                                })
                              }
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#00FF9D]/20 text-[#00FF9D] border border-[#00FF9D]/40 text-[10px] font-mono font-bold uppercase disabled:opacity-40 cursor-pointer"
                            >
                              {alreadyCited ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Cited in Paper</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" />
                                  <span>Cite in Whitepaper</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Manuscript Bibliography */}
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase text-[#FFB800] font-bold">
                  ACTIVE MANUSCRIPT BIBLIOGRAPHY ({citations.length} GROUNDED REFERENCES)
                </div>
                <div className="space-y-2">
                  {citations.map((cit, idx) => (
                    <div
                      key={cit.id}
                      className="p-3.5 rounded bg-[#070D19] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-[#00F0FF] font-bold">[{idx + 1}]</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-white">
                            @{cit.bibtexKey}
                          </span>
                          <span className="text-[#00FF9D]">
                            {cit.sourceDatabase || 'FOUNDATIONAL'}
                          </span>
                        </div>
                        <div className="text-xs text-white font-medium">
                          {cit.authors} ({cit.year}). “{cit.title}.”{' '}
                          <span className="italic text-[#94A3B8]">{cit.venue}</span>.
                        </div>
                      </div>
                      <a
                        href={cit.doiOrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-2.5 py-1 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 text-[10px] font-mono flex items-center gap-1 hover:bg-[#00F0FF]/25"
                      >
                        <span>Verify Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PUBLICATION BUNDLE EXPORT */}
          {activeTab === 'EXPORT' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(['LATEX', 'BIBTEX', 'MARKDOWN'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setExportPreviewMode(mode)}
                      className={`px-3 py-1.5 rounded text-xs font-mono uppercase cursor-pointer ${
                        exportPreviewMode === mode
                          ? 'bg-[#00F0FF] text-[#030508] font-bold'
                          : 'bg-[#08101E] text-[#94A3B8] border border-white/15'
                      }`}
                    >
                      {mode === 'LATEX'
                        ? 'main.tex (IEEE LaTeX)'
                        : mode === 'BIBTEX'
                        ? 'references.bib (BibTeX)'
                        : 'whitepaper.md (Markdown)'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(previewText);
                      setCopiedFlag(true);
                      setTimeout(() => setCopiedFlag(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded bg-[#08101E] border border-[#00F0FF]/40 text-[#00F0FF] font-mono text-xs cursor-pointer"
                  >
                    {copiedFlag ? 'COPIED TO CLIPBOARD' : 'COPY SOURCE'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadFile(
                        exportPreviewMode === 'LATEX'
                          ? 'main.tex'
                          : exportPreviewMode === 'BIBTEX'
                          ? 'references.bib'
                          : 'whitepaper.md',
                        previewText,
                        'text/plain'
                      )
                    }
                    className="px-3 py-1.5 rounded bg-[#00F0FF]/20 border border-[#00F0FF] text-white font-mono text-xs font-bold cursor-pointer"
                  >
                    Download Current File
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded bg-[#03060C] border border-white/15 text-xs font-mono text-slate-200 overflow-x-auto max-h-[60vh] leading-relaxed select-text">
                {previewText}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademicWhitepaperModal;
