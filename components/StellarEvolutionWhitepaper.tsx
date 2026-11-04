import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Scale,
  Database,
  ExternalLink,
  Cpu,
  FileText
} from 'lucide-react';
import { IsotopeYieldDatum } from './StellarNucleosynthesisWorkbench';

export interface StellarModelSnapshot {
  presetId: string;
  progenitorName: string;
  massSolar: number;
  metallicityZ: number;
  rotationKms: number;
  epochPct: number;
  phaseName: string;
  teffK: number;
  logTeff: number;
  logL: number;
  radiusSolar: number;
  coreTempMK: number;
  coreDensityGcm3: number;
  cToORatio: number;
  coordinatesRaDec: string;
  distanceLabel: string;
  targetClusterId: string;
  pubchemCid: number;
  isotopicYields: IsotopeYieldDatum[];
  capturedAtIso: string;
}

export interface StellarWhitepaperVaultRecord {
  schemaVersion: '1.0.0';
  manuscriptId: 'graphiverse-stellar-nucleosynthesis-wp-2026-v1';
  manuscriptTitle: string;
  savedAtIso: string;
  persistenceMode: 'CLOUD_FIRESTORE' | 'LOCAL_STORAGE_FALLBACK';
  renderingBackend: 'Three.js / WebGL 2.0 / GLSL (WebGPU proposed future backend only)';
  epistemicBoundaries: {
    stellarInteriorReference: 'MESA (Paxton et al. 2011-2019)';
    astrovisualizationComparator: 'OpenSpace (Bock et al. 2019)';
    atmosphericComparators: 'ATMO (Tremblin et al. 2015) & Exo-REM (Baudino et al. 2015) — atmospheric comparators only, not stellar interior solvers';
    calibrationNote: 'Unverified heuristic/softmax scores are never reported as calibrated biosignature or astrophysical probabilities.';
  };
  modelSnapshot: StellarModelSnapshot;
}

export interface WhitepaperTocItem {
  id: string;
  number: string;
  title: string;
  shortLabel: string;
}

export const STELLAR_WHITEPAPER_TITLE =
  'Time-Domain Stellar Evolution, Concentric Hydrostatic Nucleosynthesis, and Prebiotic Interstellar Seeding: Epistemic Architecture and Reference Verification in the Known Universe Observatory';

export const STELLAR_WHITEPAPER_AUTHORS =
  'Graphiverse Stellar Astrophysics & Astrobiology Working Group · Known Universe Observatory Documentation Suite';

export const STELLAR_WHITEPAPER_TOC: WhitepaperTocItem[] = [
  {
    id: 'sec-stellar-1-abstract',
    number: '1',
    title: 'Abstract & Scientific Scope Boundaries',
    shortLabel: '1. Abstract & Scope'
  },
  {
    id: 'sec-stellar-2-epistemic',
    number: '2',
    title: 'Epistemic Distinction of Equations, Models & AI Explanations',
    shortLabel: '2. Epistemic Taxonomy'
  },
  {
    id: 'sec-stellar-3-equations',
    number: '3',
    title: 'Governing Equations & Parametric Laws (Native MathML)',
    shortLabel: '3. MathML Equations'
  },
  {
    id: 'sec-stellar-4-comparators',
    number: '4',
    title: 'Comparator Systems: MESA, OpenSpace, ATMO & Exo-REM',
    shortLabel: '4. System Comparators'
  },
  {
    id: 'sec-stellar-5-benchmarks',
    number: '5',
    title: 'Empirical Benchmark & Telemetry Ledger (Unmeasured Baseline)',
    shortLabel: '5. Benchmark Ledger'
  },
  {
    id: 'sec-stellar-6-provenance',
    number: '6',
    title: 'Model Provenance Snapshot & Peer-Reviewed References',
    shortLabel: '6. Provenance & Refs'
  }
];

export interface ComparatorSystemRow {
  system: string;
  primaryRole: string;
  physicalDomain: string;
  numericalFormulation: string;
  relationshipToWorkbench: string;
}

export const STELLAR_COMPARATIVE_MATRIX: ComparatorSystemRow[] = [
  {
    system: 'MESA (Paxton et al. 2011–2019)',
    primaryRole: 'Numerical Stellar-Evolution Reference Solver',
    physicalDomain: '1D spherically symmetric stellar interiors, hydrostatic/hydrodynamic structure & full nuclear reaction networks',
    numericalFormulation: 'Implicit Newton-Raphson relaxation of coupled differential-algebraic structure & burn equations',
    relationshipToWorkbench:
      'Primary physical reference for H-R tracks, core temperature-density regimes, and concentric shell boundaries. This web application is NOT a full MESA replacement.'
  },
  {
    system: 'OpenSpace (Bock et al. 2019)',
    primaryRole: 'Multi-Scale Astrovisualization Comparator',
    physicalDomain: 'Interactive 3D astrometric planetarium and multi-scale astrophysical visualization',
    numericalFormulation: 'Logarithmic/multi-frame scene-graph coordinate transformations and GPU rendering',
    relationshipToWorkbench:
      'Comparator for coupling local 3D astrophysical simulations to parsec-scale cosmic atlas sectors and camera trajectories.'
  },
  {
    system: 'ATMO (Tremblin et al. 2015)',
    primaryRole: 'Exoplanet / Brown Dwarf Atmospheric Comparator',
    physicalDomain: '1D radiative-convective equilibrium & disequilibrium chemistry in substellar/exoplanet atmospheres',
    numericalFormulation: 'Correlated-k radiative transfer with C-H-O-N chemical kinetics',
    relationshipToWorkbench:
      'Atmospheric-model comparator for downstream planetary C/O volatile chemistry; strictly NOT a stellar interior or nucleosynthesis solver.'
  },
  {
    system: 'Exo-REM (Baudino et al. 2015)',
    primaryRole: 'Radiative-Equilibrium Exoplanet Atmospheric Comparator',
    physicalDomain: 'Self-consistent radiative-convective cloud & disequilibrium spectroscopy for gas/ice giants and Hycean worlds',
    numericalFormulation: 'Line-by-line / k-distribution atmospheric retrieval and forward modeling',
    relationshipToWorkbench:
      'Atmospheric-model comparator for interpreting how stellar C/O and S/P enrichment shapes planetary transmission spectra; NOT a stellar interior solver.'
  },
  {
    system: 'Graphiverse Stellar Lab (This Module)',
    primaryRole: 'Interactive Parametric Time-Domain Workbench',
    physicalDomain: 'Real-time 3D onion-shell cutaway visualization, parametric H-R & CHNOPS yield curves, and Gemini scientific synthesis',
    numericalFormulation: 'Deterministic piecewise analytic scaling laws in TypeScript + Three.js WebGL 2.0 / GLSL shaders (WebGPU proposed as future backend only)',
    relationshipToWorkbench:
      'Active interactive client-server module in Known Universe Observatory with local-first fallback and Firestore Vault persistence.'
  }
];

export interface UnmeasuredBenchmarkRow {
  metricId: string;
  category: string;
  metricName: string;
  targetProtocol: string;
  measuredValue: string;
  verificationStatus: 'Not measured';
}

export const STELLAR_BENCHMARK_LEDGER: UnmeasuredBenchmarkRow[] = [
  {
    metricId: 'BM-01',
    category: 'WebGL 2.0 Viewport Frame Pacing',
    metricName: 'Mean & 99th-Percentile Frame Time (7-Part Onion-Shell GLSL Scene)',
    targetProtocol: '1,000-frame automated requestAnimationFrame hardware/software WebGL capture at 1440×900',
    measuredValue: 'Not measured',
    verificationStatus: 'Not measured'
  },
  {
    metricId: 'BM-02',
    category: 'D3 Telemetry Redraw Latency',
    metricName: 'Epoch Scrubber Input-to-SVG Commit Latency (H-R + 11-Isotope Yield Charts)',
    targetProtocol: 'PerformanceObserver measure across continuous 0%–100% epoch sweep',
    measuredValue: 'Not measured',
    verificationStatus: 'Not measured'
  },
  {
    metricId: 'BM-03',
    category: 'Server-Side Gemini Synthesis',
    metricName: 'Round-Trip Latency & 429 Quota Fallback Recovery (/api/gemini/stellar-nucleosynthesis)',
    targetProtocol: 'n = 50 trials across cold/warm Express routes and simulated HTTP 429 upstream responses',
    measuredValue: 'Not measured',
    verificationStatus: 'Not measured'
  },
  {
    metricId: 'BM-04',
    category: '3D Atlas Camera Transition',
    metricName: 'Stellar Workbench Sector Jump Settling Time',
    targetProtocol: 'Exponential damping convergence to ||x_cam - x_target|| < 10⁻³ in Visualizer.tsx',
    measuredValue: 'Not measured',
    verificationStatus: 'Not measured'
  },
  {
    metricId: 'BM-05',
    category: 'Physical Track Residual vs. MESA',
    metricName: 'RMS Deviation in log₁₀(T_eff) and log₁₀(L/L☉) against MESA r24.03.1 Grid (0.09–36 M☉)',
    targetProtocol: 'Pointwise L₂ comparison across ZAMS, RGB/RSG, and pre-supernova / WD evolutionary epochs',
    measuredValue: 'Not measured',
    verificationStatus: 'Not measured'
  }
];

export interface StellarReferenceItem {
  id: string;
  authors: string;
  year: number;
  title: string;
  venue: string;
  doiOrUrl: string;
  roleBadge: string;
}

export const STELLAR_WHITEPAPER_REFERENCES: StellarReferenceItem[] = [
  {
    id: 'ref-b2fh-1957',
    authors: 'E. M. Burbidge, G. R. Burbidge, W. A. Fowler, F. Hoyle',
    year: 1957,
    title: 'Synthesis of the Elements in Stars',
    venue: 'Reviews of Modern Physics, 29(4), 547–650',
    doiOrUrl: 'https://doi.org/10.1103/RevModPhys.29.547',
    roleBadge: 'Foundational Nucleosynthesis (B²FH)'
  },
  {
    id: 'ref-paxton-2011',
    authors: 'B. Paxton, L. Bildsten, A. Dotter, F. Herwig, P. Lesaffre, F. Timmes',
    year: 2011,
    title: 'Modules for Experiments in Stellar Astrophysics (MESA)',
    venue: 'The Astrophysical Journal Supplement Series, 192(1), 3',
    doiOrUrl: 'https://doi.org/10.1088/0067-0049/192/1/3',
    roleBadge: 'Numerical Stellar-Evolution Reference'
  },
  {
    id: 'ref-paxton-2019',
    authors: 'B. Paxton, R. Smolec, J. Schwab, A. Gautschy, L. Bildsten et al.',
    year: 2019,
    title: 'Modules for Experiments in Stellar Astrophysics (MESA): Pulsating Variable Stars, Rotation, Convective Boundaries, and Energy Conservation',
    venue: 'The Astrophysical Journal Supplement Series, 243(1), 10',
    doiOrUrl: 'https://doi.org/10.3847/1538-4365/ab2241',
    roleBadge: 'MESA Hydrodynamic & Shell Reference'
  },
  {
    id: 'ref-woosley-heger-2002',
    authors: 'S. E. Woosley, A. Heger, T. A. Weaver',
    year: 2002,
    title: 'The evolution and explosion of massive stars',
    venue: 'Reviews of Modern Physics, 74(4), 1015–1071',
    doiOrUrl: 'https://doi.org/10.1103/RevModPhys.74.1015',
    roleBadge: 'Massive Star Onion-Shell & Yield Reference'
  },
  {
    id: 'ref-bock-openspace-2019',
    authors: 'A. Bock, E. Axelsson, J. Costa, G. Payne, M. Acinapura, V. Trakinski, C. Emmart, C. Silva',
    year: 2019,
    title: 'OpenSpace: A System for Astrographics',
    venue: 'IEEE Transactions on Visualization and Computer Graphics, 26(1), 633–642',
    doiOrUrl: 'https://doi.org/10.1109/TVCG.2019.2934259',
    roleBadge: 'Astrovisualization Comparator'
  },
  {
    id: 'ref-tremblin-atmo-2015',
    authors: 'P. Tremblin, D. S. Amundsen, P. Mourier, I. Baraffe, G. Chabrier et al.',
    year: 2015,
    title: 'Fingering Convection and Cloudless Models for Cool Brown Dwarf Atmospheres (ATMO)',
    venue: 'The Astrophysical Journal Letters, 804(1), L17',
    doiOrUrl: 'https://doi.org/10.1088/2041-8205/804/1/L17',
    roleBadge: 'Atmospheric-Model Comparator (ATMO)'
  },
  {
    id: 'ref-baudino-exorem-2015',
    authors: 'J.-L. Baudino, B. Bézard, A. Boccaletti, M. Bonnefoy, G. Chauvin, R. Galicher',
    year: 2015,
    title: 'Interpreting the photometry and spectroscopy of directly imaged planets with a new atmospheric model (Exo-REM)',
    venue: 'Astronomy & Astrophysics, 582, A83',
    doiOrUrl: 'https://doi.org/10.1051/0004-6361/201526332',
    roleBadge: 'Atmospheric-Model Comparator (Exo-REM)'
  }
];

interface StellarEvolutionWhitepaperProps {
  snapshot?: StellarModelSnapshot;
  activeSectionId?: string;
  onSelectSection?: (sectionId: string) => void;
}

export const StellarEvolutionWhitepaper: React.FC<StellarEvolutionWhitepaperProps> = ({
  snapshot,
  activeSectionId: controlledSectionId,
  onSelectSection
}) => {
  const [internalSectionId, setInternalSectionId] = useState<string>(STELLAR_WHITEPAPER_TOC[0].id);
  const currentSectionId = controlledSectionId || internalSectionId;

  const handleJumpToSection = (id: string) => {
    setInternalSectionId(id);
    onSelectSection?.(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="whitepaper-print-body grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Navigable Table of Contents (Hidden in Print via .no-print) */}
      <nav
        aria-label="Stellar Evolution Whitepaper Table of Contents"
        className="no-print lg:col-span-3 sticky top-0 p-4 rounded-lg bg-[#080D18]/90 border border-white/10 space-y-3"
      >
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>Table of Contents</span>
        </div>

        <ul className="space-y-1">
          {STELLAR_WHITEPAPER_TOC.map(item => {
            const isActive = currentSectionId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleJumpToSection(item.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400 ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-400/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {item.shortLabel}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="pt-3 border-t border-white/10 space-y-1.5 text-[11px] font-mono text-slate-400">
          <div className="text-slate-200 font-semibold">Runtime Verification</div>
          <div>3D Engine: Three.js / WebGL 2.0</div>
          <div>Shaders: Custom GLSL 1.0/3.0</div>
          <div>Equations: Native HTML5 MathML</div>
          <div>WebGPU Status: Future Proposal Only</div>
        </div>
      </nav>

      {/* Main Whitepaper Reading Pane (Full Width on Print) */}
      <div className="lg:col-span-9 space-y-8 text-slate-200">
        {/* Title Banner */}
        <header className="p-6 rounded-lg bg-[#080D18] border border-white/10 space-y-3">
          <div className="text-xs font-mono text-amber-400">
            Graphiverse Scientific Documentation · Version 1.0.0 · Target: Stellar Evolution & Nucleosynthesis Simulator
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-100 leading-snug">
            {STELLAR_WHITEPAPER_TITLE}
          </h1>
          <div className="text-xs font-mono text-slate-400">{STELLAR_WHITEPAPER_AUTHORS}</div>
        </header>

        {/* SECTION 1: ABSTRACT & SCIENTIFIC BOUNDARIES */}
        <section
          id="sec-stellar-1-abstract"
          className="p-6 rounded-lg bg-[#080D18]/90 border border-white/10 space-y-4 scroll-mt-4"
        >
          <div className="border-b border-white/10 pb-3">
            <div className="text-xs font-mono text-sky-400">Section 01</div>
            <h2 className="text-lg font-display font-semibold text-slate-100 mt-0.5">
              Abstract & Scientific Scope Boundaries
            </h2>
          </div>

          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              The <strong>Stellar Evolution &amp; Nucleosynthesis Time-Domain Simulator</strong> is an
              interactive astrophysical and astrobiological module within the Known Universe
              Observatory. It enables researchers and students to inspect how stellar progenitors
              spanning ultra-cool fully convective M-dwarfs (0.08–0.45 M☉), intermediate-mass
              main-sequence and Asymptotic Giant Branch (AGB) stars (0.8–8.0 M☉), and massive
              core-collapse or Wolf-Rayet progenitors (8.0–40.0 M☉) evolve across the
              Hertzsprung-Russell (H-R) diagram and enrich the interstellar medium (ISM) with
              bio-essential CHNOPS and refractory core-forming isotopes.
            </p>
            <p>
              <strong>Explicit Scientific &amp; Numerical Scope Boundaries:</strong> To maintain
              rigorous scientific integrity, this documentation establishes strict boundaries
              between canonical numerical solvers, interactive parametric approximations, and
              downstream atmospheric models:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>
                <strong>MESA as Stellar-Evolution Reference:</strong>{' '}
                <em>Modules for Experiments in Stellar Astrophysics</em> (MESA; Paxton et al. 2011,
                2019) serves as our authoritative 1D numerical stellar-evolution reference. The
                Graphiverse Stellar Workbench evaluates fast, deterministic piecewise analytic
                scaling laws for real-time interactive WebGL visualization and is{' '}
                <strong>not a full MESA hydrodynamical or implicit nuclear-network replacement</strong>.
              </li>
              <li>
                <strong>OpenSpace as Astrovisualization Comparator:</strong> OpenSpace (Bock et al.
                2019) serves as our multi-scale astrovisualization comparator for linking local
                stellar remnants and nucleosynthesis ejecta to parsec- and kiloparsec-scale sectors
                in the 3D Cosmic Atlas.
              </li>
              <li>
                <strong>ATMO &amp; Exo-REM as Atmospheric Comparators Only:</strong> ATMO (Tremblin
                et al. 2015) and Exo-REM (Baudino et al. 2015) are 1D radiative-convective
                substellar and exoplanetary atmospheric models referenced solely when evaluating how
                stellar C/O ratios and heavy-element yields constrain secondary planetary
                atmospheres. Neither ATMO nor Exo-REM is a stellar interior or nucleosynthesis
                solver.
              </li>
              <li>
                <strong>WebGL / GLSL Runtime vs. WebGPU Proposal:</strong> The current 3D
                concentrically layered onion-shell cutaway, convective plasma displacement, and
                bipolar relativistic jet viewport is implemented strictly in{' '}
                <strong>Three.js, WebGL 2.0, and custom GLSL vertex/fragment shaders</strong>.
                WebGPU compute-shader reaction-diffusion networks remain a future architectural
                proposal and are not claimed as active runtime code.
              </li>
            </ul>
          </div>
        </section>

        {/* SECTION 2: EPISTEMIC DISTINCTION OF ARTIFACTS */}
        <section
          id="sec-stellar-2-epistemic"
          className="p-6 rounded-lg bg-[#080D18]/90 border border-white/10 space-y-4 scroll-mt-4"
        >
          <div className="border-b border-white/10 pb-3">
            <div className="text-xs font-mono text-sky-400">Section 02</div>
            <h2 className="text-lg font-display font-semibold text-slate-100 mt-0.5">
              Epistemic Distinction: Reference Equations, Implemented Calculations, Model Outputs &amp; AI Explanations
            </h2>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Every mathematical relation, chart series, and textual synthesis in the workbench is
            partitioned into five mutually exclusive epistemic classes so users never conflate first-principles
            differential equations with fast parametric interpolations or generative language model
            explanations:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded bg-slate-900/90 border border-white/10 space-y-1">
              <div className="font-mono font-semibold text-sky-400">
                1. Reference Equations (Canonical Physics)
              </div>
              <p className="text-slate-300 leading-relaxed">
                Differential equations of 1D hydrostatic stellar structure, radiative/convective
                transport, and Gamow-peak thermonuclear reaction rates solved in offline codes like
                MESA. Displayed for theoretical grounding.
              </p>
            </div>

            <div className="p-3.5 rounded bg-slate-900/90 border border-white/10 space-y-1">
              <div className="font-mono font-semibold text-emerald-400">
                2. Implemented Calculations (Client TypeScript &amp; GLSL)
              </div>
              <p className="text-slate-300 leading-relaxed">
                Closed-form piecewise analytic mass-luminosity relations, Stefan-Boltzmann radius
                evaluation, parametric log₁₀(X_i) isotopic mass-fraction curves, and C/O number
                ratios computed deterministically in <code>StellarNucleosynthesisWorkbench.tsx</code>.
              </p>
            </div>

            <div className="p-3.5 rounded bg-slate-900/90 border border-white/10 space-y-1">
              <div className="font-mono font-semibold text-amber-400">
                3. Imported Reference Model Outputs
              </div>
              <p className="text-slate-300 leading-relaxed">
                Curated progenitor boundary conditions (Betelgeuse 18.5 M☉, Sol-analog 1.8 M☉, WR
                102 36 M☉, TRAPPIST-1 0.09 M☉) and nucleosynthetic pathway classifications anchored
                to Burbidge et al. (1957) and Woosley &amp; Heger (2002).
              </p>
            </div>

            <div className="p-3.5 rounded bg-slate-900/90 border border-white/10 space-y-1">
              <div className="font-mono font-semibold text-purple-300">
                4. AI-Generated Explanation &amp; 5. Unverified Targets
              </div>
              <p className="text-slate-300 leading-relaxed">
                Narrative synthesis generated via <code>gemini-3.8-flash</code> is strictly
                explanatory. Heuristic confidence weights or softmax scores are{' '}
                <strong>never presented as calibrated Bayesian biosignature probabilities</strong>{' '}
                in the absence of empirical instrument calibration.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 3: NATIVE MATHML EQUATIONS */}
        <section
          id="sec-stellar-3-equations"
          className="p-6 rounded-lg bg-[#080D18]/90 border border-white/10 space-y-5 scroll-mt-4"
        >
          <div className="border-b border-white/10 pb-3">
            <div className="text-xs font-mono text-sky-400">Section 03</div>
            <h2 className="text-lg font-display font-semibold text-slate-100 mt-0.5">
              Governing Equations &amp; Implemented Parametric Formulations (Native MathML)
            </h2>
          </div>

          {/* Equation 1: Hydrostatic Equilibrium & Mass Continuity */}
          <div className="mathml-equation p-4 rounded bg-slate-950/90 border border-white/10 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-slate-100 font-semibold">
                Eq. (1) — 1D Spherical Hydrostatic Equilibrium &amp; Mass Continuity
              </span>
              <span className="text-sky-400">
                Classification: Reference Equation (MESA Stellar Structure Baseline)
              </span>
            </div>
            <div className="py-2 overflow-x-auto text-slate-100">
              <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
                <mrow>
                  <mfrac>
                    <mrow>
                      <mi>d</mi>
                      <mi>P</mi>
                    </mrow>
                    <mrow>
                      <mi>d</mi>
                      <mi>r</mi>
                    </mrow>
                  </mfrac>
                  <mo>=</mo>
                  <mo>−</mo>
                  <mfrac>
                    <mrow>
                      <mi>G</mi>
                      <msub>
                        <mi>M</mi>
                        <mi>r</mi>
                      </msub>
                      <mi>ρ</mi>
                      <mo>(</mo>
                      <mi>r</mi>
                      <mo>)</mo>
                    </mrow>
                    <msup>
                      <mi>r</mi>
                      <mn>2</mn>
                    </msup>
                  </mfrac>
                  <mtext>,&nbsp;&nbsp;&nbsp;</mtext>
                  <mfrac>
                    <mrow>
                      <mi>d</mi>
                      <msub>
                        <mi>M</mi>
                        <mi>r</mi>
                      </msub>
                    </mrow>
                    <mrow>
                      <mi>d</mi>
                      <mi>r</mi>
                    </mrow>
                  </mfrac>
                  <mo>=</mo>
                  <mn>4</mn>
                  <mi>π</mi>
                  <msup>
                    <mi>r</mi>
                    <mn>2</mn>
                  </msup>
                  <mi>ρ</mi>
                  <mo>(</mo>
                  <mi>r</mi>
                  <mo>)</mo>
                </mrow>
              </math>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Couples local radial pressure gradient <em>dP/dr</em> to enclosed gravitational mass{' '}
              <em>M_r</em> and mass density <em>ρ(r)</em>. In full 1D solvers (MESA), this is solved
              simultaneously with the Helmholtz/OPAL equation of state across Lagrangian mass shells.
            </p>
          </div>

          {/* Equation 2: Energy Conservation & Radiative Transport */}
          <div className="mathml-equation p-4 rounded bg-slate-950/90 border border-white/10 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-slate-100 font-semibold">
                Eq. (2) — Nuclear Energy Generation, Neutrino Loss &amp; Radiative Gradient
              </span>
              <span className="text-sky-400">
                Classification: Reference Equation (Stellar Interior Transport)
              </span>
            </div>
            <div className="py-2 overflow-x-auto text-slate-100">
              <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
                <mrow>
                  <mfrac>
                    <mrow>
                      <mi>d</mi>
                      <msub>
                        <mi>L</mi>
                        <mi>r</mi>
                      </msub>
                    </mrow>
                    <mrow>
                      <mi>d</mi>
                      <msub>
                        <mi>M</mi>
                        <mi>r</mi>
                      </msub>
                    </mrow>
                  </mfrac>
                  <mo>=</mo>
                  <msub>
                    <mi>ϵ</mi>
                    <mtext>nuc</mtext>
                  </msub>
                  <mo>−</mo>
                  <msub>
                    <mi>ϵ</mi>
                    <mi>ν</mi>
                  </msub>
                  <mo>+</mo>
                  <msub>
                    <mi>ϵ</mi>
                    <mtext>grav</mtext>
                  </msub>
                  <mtext>,&nbsp;&nbsp;&nbsp;</mtext>
                  <mfrac>
                    <mrow>
                      <mi>d</mi>
                      <mi>T</mi>
                    </mrow>
                    <mrow>
                      <mi>d</mi>
                      <mi>r</mi>
                    </mrow>
                  </mfrac>
                  <mo>=</mo>
                  <mo>−</mo>
                  <mfrac>
                    <mrow>
                      <mn>3</mn>
                      <mi>κ</mi>
                      <mi>ρ</mi>
                      <msub>
                        <mi>L</mi>
                        <mi>r</mi>
                      </msub>
                    </mrow>
                    <mrow>
                      <mn>16</mn>
                      <mi>π</mi>
                      <mi>a</mi>
                      <mi>c</mi>
                      <msup>
                        <mi>r</mi>
                        <mn>2</mn>
                      </msup>
                      <msup>
                        <mi>T</mi>
                        <mn>3</mn>
                      </msup>
                    </mrow>
                  </mfrac>
                </mrow>
              </math>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Relates net shell luminosity <em>L_r</em> to specific nuclear energy generation{' '}
              <em>ϵ_nuc</em>, thermal neutrino losses <em>ϵ_ν</em> (dominant during C, Ne, O, and Si
              burning at <em>T_core &gt; 500 MK</em>), and gravothermal contraction <em>ϵ_grav</em>.
            </p>
          </div>

          {/* Equation 3: Implemented Stefan-Boltzmann & Piecewise ZAMS Scaling */}
          <div className="mathml-equation p-4 rounded bg-slate-950/90 border border-white/10 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-slate-100 font-semibold">
                Eq. (3) — Photospheric Radius &amp; Piecewise ZAMS Mass-Luminosity Law
              </span>
              <span className="text-emerald-400">
                Classification: Implemented Calculation (computeEvolutionTrack)
              </span>
            </div>
            <div className="py-2 overflow-x-auto text-slate-100">
              <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
                <mrow>
                  <mfrac>
                    <mi>R</mi>
                    <msub>
                      <mi>R</mi>
                      <mo>⊙</mo>
                    </msub>
                  </mfrac>
                  <mo>=</mo>
                  <msqrt>
                    <mfrac>
                      <mi>L</mi>
                      <msub>
                        <mi>L</mi>
                        <mo>⊙</mo>
                      </msub>
                    </mfrac>
                  </msqrt>
                  <msup>
                    <mrow>
                      <mo>(</mo>
                      <mfrac>
                        <mrow>
                          <mn>5778</mn>
                          <mtext>&nbsp;K</mtext>
                        </mrow>
                        <msub>
                          <mi>T</mi>
                          <mtext>eff</mtext>
                        </msub>
                      </mfrac>
                      <mo>)</mo>
                    </mrow>
                    <mn>2</mn>
                  </msup>
                  <mtext>,&nbsp;&nbsp;&nbsp;</mtext>
                  <mfrac>
                    <msub>
                      <mi>L</mi>
                      <mtext>ZAMS</mtext>
                    </msub>
                    <msub>
                      <mi>L</mi>
                      <mo>⊙</mo>
                    </msub>
                  </mfrac>
                  <mo>∝</mo>
                  <msup>
                    <mrow>
                      <mo>(</mo>
                      <mfrac>
                        <mi>M</mi>
                        <msub>
                          <mi>M</mi>
                          <mo>⊙</mo>
                        </msub>
                      </mfrac>
                      <mo>)</mo>
                    </mrow>
                    <mi>α</mi>
                  </msup>
                  <mo>(</mo>
                  <mn>1</mn>
                  <mo>+</mo>
                  <mn>0.12</mn>
                  <mfrac>
                    <msub>
                      <mi>v</mi>
                      <mtext>rot</mtext>
                    </msub>
                    <mrow>
                      <mn>300</mn>
                      <mtext>&nbsp;km/s</mtext>
                    </mrow>
                  </mfrac>
                  <mo>)</mo>
                </mrow>
              </math>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluated in real time inside <code>computeEvolutionTrack()</code> with piecewise
              mass exponents (<em>α = 2.3</em> for <em>M &lt; 0.43 M☉</em>, <em>α = 4.0</em> for{' '}
              <em>0.43 ≤ M &lt; 2 M☉</em>, <em>α = 3.5</em> for <em>2 ≤ M &lt; 20 M☉</em>, and
              Eddington-approaching linear scaling <em>L ∝ M</em> above <em>20 M☉</em>).
            </p>
          </div>

          {/* Equation 4: Implemented Carbon-to-Oxygen Number Ratio & Ejected Yield */}
          <div className="mathml-equation p-4 rounded bg-slate-950/90 border border-white/10 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-slate-100 font-semibold">
                Eq. (4) — Envelope Carbon-to-Oxygen (C/O) Number Ratio &amp; Ejected Solar-Mass Yield
              </span>
              <span className="text-emerald-400">
                Classification: Implemented Calculation (computeIsotopeYields)
              </span>
            </div>
            <div className="py-2 overflow-x-auto text-slate-100">
              <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
                <mrow>
                  <mtext>C/O</mtext>
                  <mo>=</mo>
                  <mfrac>
                    <mrow>
                      <mi>X</mi>
                      <mo>(</mo>
                      <mmultiscripts>
                        <mtext>C</mtext>
                        <mprescripts />
                        <none />
                        <mn>12</mn>
                      </mmultiscripts>
                      <mo>)</mo>
                      <mo>/</mo>
                      <mn>12</mn>
                    </mrow>
                    <mrow>
                      <mi>X</mi>
                      <mo>(</mo>
                      <mmultiscripts>
                        <mtext>O</mtext>
                        <mprescripts />
                        <none />
                        <mn>16</mn>
                      </mmultiscripts>
                      <mo>)</mo>
                      <mo>/</mo>
                      <mn>16</mn>
                    </mrow>
                  </mfrac>
                  <mtext>,&nbsp;&nbsp;&nbsp;</mtext>
                  <msub>
                    <mi>M</mi>
                    <mrow>
                      <mtext>ej</mtext>
                      <mo>,</mo>
                      <mi>i</mi>
                    </mrow>
                  </msub>
                  <mo>=</mo>
                  <msup>
                    <mn>10</mn>
                    <mrow>
                      <msub>
                        <mi>log</mi>
                        <mn>10</mn>
                      </msub>
                      <msub>
                        <mi>X</mi>
                        <mi>i</mi>
                      </msub>
                    </mrow>
                  </msup>
                  <mo>⋅</mo>
                  <mi>M</mi>
                  <mo>⋅</mo>
                  <mo>(</mo>
                  <mn>0.18</mn>
                  <mo>+</mo>
                  <mn>0.65</mn>
                  <mi>τ</mi>
                  <mo>)</mo>
                </mrow>
              </math>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Determines whether circumstellar dust condensation follows a silicate-dominated
              pathway (<em>C/O &lt; 0.8</em>, favoring terrestrial olivine/pyroxene mantles) or a
              carbon-rich carbide/graphite pathway (<em>C/O ≥ 1.0</em>, typical of third-dredge-up
              AGB carbon stars).
            </p>
          </div>

          {/* Equation 5: GLSL Onion-Shell Cutaway & Convective Vertex Displacement */}
          <div className="mathml-equation p-4 rounded bg-slate-950/90 border border-white/10 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-slate-100 font-semibold">
                Eq. (5) — WebGL 2.0 GLSL Concentric Shell Displacement &amp; Wedge Cutaway Condition
              </span>
              <span className="text-emerald-400">
                Classification: Implemented Calculation (Three.js ShaderMaterial)
              </span>
            </div>
            <div className="py-2 overflow-x-auto text-slate-100">
              <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
                <mrow>
                  <msup>
                    <mi mathvariant="bold">p</mi>
                    <mo>′</mo>
                  </msup>
                  <mo>=</mo>
                  <mi mathvariant="bold">p</mi>
                  <mo>+</mo>
                  <mover>
                    <mi mathvariant="bold">n</mi>
                    <mo>^</mo>
                  </mover>
                  <msub>
                    <mi>u</mi>
                    <mtext>turb</mtext>
                  </msub>
                  <mi>sin</mi>
                  <mo>(</mo>
                  <mn>6</mn>
                  <msub>
                    <mi>p</mi>
                    <mi>x</mi>
                  </msub>
                  <mo>+</mo>
                  <mn>2.2</mn>
                  <mi>t</mi>
                  <mo>)</mo>
                  <mi>cos</mi>
                  <mo>(</mo>
                  <mn>6</mn>
                  <msub>
                    <mi>p</mi>
                    <mi>y</mi>
                  </msub>
                  <mo>−</mo>
                  <mn>1.8</mn>
                  <mi>t</mi>
                  <mo>)</mo>
                  <mi>sin</mi>
                  <mo>(</mo>
                  <mn>6</mn>
                  <msub>
                    <mi>p</mi>
                    <mi>z</mi>
                  </msub>
                  <mo>+</mo>
                  <mn>1.5</mn>
                  <mi>t</mi>
                  <mo>)</mo>
                  <mtext>,&nbsp;&nbsp;&nbsp;</mtext>
                  <mtext>discard if&nbsp;</mtext>
                  <msup>
                    <mi>tan</mi>
                    <mrow>
                      <mo>−</mo>
                      <mn>1</mn>
                    </mrow>
                  </msup>
                  <mo>(</mo>
                  <msub>
                    <mi>p</mi>
                    <mi>z</mi>
                  </msub>
                  <mo>/</mo>
                  <msub>
                    <mi>p</mi>
                    <mi>x</mi>
                  </msub>
                  <mo>)</mo>
                  <mo>&lt;</mo>
                  <mfrac>
                    <msub>
                      <mi>θ</mi>
                      <mtext>cut</mtext>
                    </msub>
                    <mn>2</mn>
                  </mfrac>
                </mrow>
              </math>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Executed per vertex and fragment on the GPU in Three.js <code>ShaderMaterial</code>{' '}
              across five concentric burning shells (<code>H → He</code>, <code>He → C/O</code>,{' '}
              <code>C → Ne/Mg</code>, <code>O → Si/S/P</code>, and <code>Si → Fe/Ni</code> core).
            </p>
          </div>
        </section>

        {/* SECTION 4: COMPARATOR SYSTEMS TABLE */}
        <section
          id="sec-stellar-4-comparators"
          className="p-6 rounded-lg bg-[#080D18]/90 border border-white/10 space-y-4 scroll-mt-4"
        >
          <div className="border-b border-white/10 pb-3">
            <div className="text-xs font-mono text-sky-400">Section 04</div>
            <h2 className="text-lg font-display font-semibold text-slate-100 mt-0.5">
              Comparator Systems Architecture: MESA, OpenSpace, ATMO &amp; Exo-REM
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/15 font-mono text-sky-400">
                  <th className="py-2.5 pr-3">System / Code</th>
                  <th className="py-2.5 px-3">Comparator Role</th>
                  <th className="py-2.5 px-3">Physical Domain</th>
                  <th className="py-2.5 px-3">Numerical Method</th>
                  <th className="py-2.5 pl-3">Boundary &amp; Relationship</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {STELLAR_COMPARATIVE_MATRIX.map(row => (
                  <tr key={row.system} className="align-top">
                    <td className="py-2.5 pr-3 font-mono font-semibold text-slate-100 whitespace-nowrap">
                      {row.system}
                    </td>
                    <td className="py-2.5 px-3 text-amber-300 font-mono">{row.primaryRole}</td>
                    <td className="py-2.5 px-3">{row.physicalDomain}</td>
                    <td className="py-2.5 px-3">{row.numericalFormulation}</td>
                    <td className="py-2.5 pl-3 text-slate-300">{row.relationshipToWorkbench}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 5: EMPIRICAL BENCHMARK LEDGER (NOT MEASURED) */}
        <section
          id="sec-stellar-5-benchmarks"
          className="p-6 rounded-lg bg-[#080D18]/90 border border-white/10 space-y-4 scroll-mt-4"
        >
          <div className="border-b border-white/10 pb-3">
            <div className="text-xs font-mono text-sky-400">Section 05</div>
            <h2 className="text-lg font-display font-semibold text-slate-100 mt-0.5">
              Empirical Benchmark &amp; Telemetry Ledger
            </h2>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            In compliance with reproducible computational science standards, benchmark metrics for
            the newly integrated Stellar Evolution &amp; Nucleosynthesis Time-Domain Simulator are
            recorded as <code>Not measured</code> until automated, repeatable hardware/software
            telemetry harnesses complete across the target protocols below. No synthetic FPS, API
            latency, transition speed, or MESA L₂ accuracy numbers are fabricated.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead>
                <tr className="border-b border-white/15 text-sky-400">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 px-3">Subsystem Category</th>
                  <th className="py-2 px-3">Metric Specification</th>
                  <th className="py-2 px-3">Measurement Protocol</th>
                  <th className="py-2 pl-3">Measured Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-300">
                {STELLAR_BENCHMARK_LEDGER.map(row => (
                  <tr key={row.metricId} className="align-top">
                    <td className="py-2.5 pr-3 text-slate-400">{row.metricId}</td>
                    <td className="py-2.5 px-3 text-slate-100">{row.category}</td>
                    <td className="py-2.5 px-3 font-sans">{row.metricName}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">{row.targetProtocol}</td>
                    <td className="py-2.5 pl-3 text-amber-400 font-semibold whitespace-nowrap">
                      {row.measuredValue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 6: LIVE PROVENANCE SNAPSHOT & REFERENCES */}
        <section
          id="sec-stellar-6-provenance"
          className="p-6 rounded-lg bg-[#080D18]/90 border border-white/10 space-y-5 scroll-mt-4"
        >
          <div className="border-b border-white/10 pb-3">
            <div className="text-xs font-mono text-sky-400">Section 06</div>
            <h2 className="text-lg font-display font-semibold text-slate-100 mt-0.5">
              Active Model Provenance Snapshot &amp; Peer-Reviewed References
            </h2>
          </div>

          {snapshot ? (
            <div className="p-4 rounded bg-slate-950/90 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                <span>Active Stellar Workbench State (Sanitized — Zero Credentials)</span>
                <span>Captured: {snapshot.capturedAtIso}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono tabular-nums pt-1">
                <div className="p-2 rounded bg-slate-900 border border-white/10">
                  <div className="text-[10px] text-slate-400">Progenitor</div>
                  <div className="text-slate-100 truncate">{snapshot.progenitorName}</div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-white/10">
                  <div className="text-[10px] text-slate-400">Mass / Metallicity</div>
                  <div className="text-sky-400">
                    {snapshot.massSolar} M☉ · Z={snapshot.metallicityZ}
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-white/10">
                  <div className="text-[10px] text-slate-400">Epoch / T_eff</div>
                  <div className="text-amber-400">
                    {snapshot.epochPct}% · {snapshot.teffK} K
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-white/10">
                  <div className="text-[10px] text-slate-400">Core T / C:O</div>
                  <div className="text-emerald-400">
                    {snapshot.coreTempMK} MK · C/O {snapshot.cToORatio}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded bg-slate-950/80 border border-white/10 text-xs font-mono text-slate-400">
              Open this whitepaper from the Stellar Evolution &amp; Nucleosynthesis Simulator to
              attach a live numerical state snapshot to Vault records.
            </div>
          )}

          <div className="space-y-2.5">
            <div className="text-xs font-mono text-slate-300 font-semibold">
              Primary Peer-Reviewed Literature &amp; Comparator Citations
            </div>
            {STELLAR_WHITEPAPER_REFERENCES.map((ref, idx) => (
              <div
                key={ref.id}
                className="p-3.5 rounded bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5 text-xs">
                  <div className="font-mono text-[11px] text-sky-400">
                    [{idx + 1}] {ref.roleBadge} · {ref.year}
                  </div>
                  <div className="text-slate-100 font-medium">
                    {ref.authors} ({ref.year}). “{ref.title}.”{' '}
                    <span className="italic text-slate-400">{ref.venue}</span>.
                  </div>
                </div>
                <a
                  href={ref.doiOrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-print shrink-0 px-2.5 py-1 rounded bg-slate-950 border border-white/15 text-[11px] font-mono text-sky-400 hover:border-sky-400/50 flex items-center gap-1"
                >
                  <span>DOI</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StellarEvolutionWhitepaper;
