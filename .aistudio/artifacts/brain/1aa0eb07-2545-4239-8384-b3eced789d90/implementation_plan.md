# Graphiverse Academic Whitepaper Integration Kit — Implementation Plan

## 1. Architectural Overview & Scope
Integrate the complete **Stellar Evolution & Nucleosynthesis Time-Domain Simulator Academic Whitepaper** (`components/StellarEvolutionWhitepaper.tsx`) into the application's documentation and modal layer (`components/AcademicWhitepaperModal.tsx`), launchable directly from `components/StellarNucleosynthesisWorkbench.tsx` as well as accessible from the top-level `AcademicWhitepaperModal`. All existing optical-atlas manuscript tabs, equation sliders, literature search, and `.ZIP` export features in `AcademicWhitepaperModal.tsx` are preserved intact.

---

## 2. Detailed Design & File-by-File Plan

### A. `components/StellarEvolutionWhitepaper.tsx` *(New)*
- **Complete Scientific Whitepaper Content & Epistemic Boundaries**:
  - **Section 1 — Executive Abstract & Scope Boundaries**: Clearly defines the Stellar Evolution & Nucleosynthesis Time-Domain Simulator within the Known Universe Observatory. Explicitly distinguishes **MESA** (*Modules for Experiments in Stellar Astrophysics*, Paxton et al. 2011–2019) as the 1D implicit hydrodynamical stellar-evolution reference solver, **OpenSpace** (Bock et al. 2019) as the multi-scale astrovisualization comparator, and **ATMO** (Tremblin et al. 2015) / **Exo-REM** (Baudino et al. 2015) as 1D radiative-convective exoplanet atmospheric comparators (not stellar interior solvers). Explicitly states that this interactive WebGL/GLSL workbench is a real-time parametric & educational visualization instrument, not a full replacement for MESA hydrostatic/nuclear network integration.
  - **Section 2 — Epistemic Taxonomy of Mathematical & Computational Artifacts**:
    - Explicitly classifies every formula and output into five strict categories:
      1. *Reference Equations* (canonical physical governing laws for stellar interiors, hydrostatic equilibrium, nuclear energy generation, and radiative/convective transport).
      2. *Implemented Calculations* (the exact piecewise analytic scaling relations, Stefan-Boltzmann radius $R/R_\odot = \sqrt{L/L_\odot}(T_{\text{eff},\odot}/T_{\text{eff}})^2$, and parametric isotopic yield laws computed in `StellarNucleosynthesisWorkbench.tsx`).
      3. *Imported / Reference Model Outputs* (B2FH / Woosley & Heger 2002 / MESA reference benchmarks).
      4. *AI-Generated Explanations* (Gemini 3.8 Flash structured narrative synthesis and heuristic anomaly alerts).
      5. *Unverified Targets & Calibration Constraints* (explicitly noting that heuristic/softmax scores or uncalibrated confidence weights are never presented as calibrated Bayesian biosignature probabilities without empirical instrument noise and prior calibration).
  - **Section 3 — Governing Equations in Native MathML (`<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">`)**:
    - Renders equations using zero-CDN native HTML5 `<math>` elements with explicit status tags (`[Reference Equation]` vs. `[Implemented Calculation]`):
      - **Eq. (1)** Hydrostatic Equilibrium & Mass Continuity ($\frac{dP}{dr} = -\frac{G M_r \rho}{r^2}$, $\frac{dM_r}{dr} = 4\pi r^2 \rho$) — *Reference Equation (MESA 1D structure baseline)*.
      - **Eq. (2)** Radiative & Convective Energy Transport ($\frac{dT}{dr} = -\frac{3 \kappa \rho L_r}{16 \pi a c r^2 T^3}$ and Schwarzschild criterion $\nabla_{\text{rad}} > \nabla_{\text{ad}}$) — *Reference Equation*.
      - **Eq. (3)** Parametric ZAMS Mass-Luminosity & Stefan-Boltzmann Photospheric Radius ($R/R_\odot = \sqrt{L/L_\odot}\,(5778\,\text{K} / T_{\text{eff}})^2$) — *Implemented Calculation*.
      - **Eq. (4)** Triple-Alpha & Alpha-Capture Reaction Rate Scaling ($\epsilon_{3\alpha} \propto \rho^2 Y^3 T_8^{-3} \exp(-44.027 / T_8)$) and C/O Number Ratio ($\text{C/O} = \frac{X(^{12}\text{C})/12}{X(^{16}\text{O})/16}$) — *Reference & Implemented Calculation*.
      - **Eq. (5)** GLSL Concentric Onion-Shell Cutaway & Turbulent Displacement Field ($\mathbf{x}' = \mathbf{x} + \mathbf{n}\,A_{\text{turb}}\sin(6x + 2.2t)\cos(6y - 1.8t)\sin(6z + 1.5t)$) — *Implemented Calculation (Three.js / WebGL 2.0 GLSL; WebGPU noted strictly as a future compute-shader backend proposal)*.
  - **Section 4 — Comparative Architecture Matrix (MESA, OpenSpace, ATMO, Exo-REM, Graphiverse Stellar Lab)**:
    - Structured comparison table contrasting solver domain, spatial dimensionality, nuclear network treatment, runtime environment, and verification status.
  - **Section 5 — Empirical Benchmark & Telemetry Ledger (`Not measured` Integrity)**:
    - Preserves strict scientific honesty: all repeatable runtime, FPS, GPU frame-time, API latency, transition speed, and physical residual rows are explicitly marked **`Not measured`** until instrumented repeatable benchmark runs are executed, preventing fabricated performance claims.
  - **Section 6 — Provenance, Reproducibility & Grounded References**:
    - Full peer-reviewed bibliography (Burbidge, Burbidge, Fowler & Hoyle 1957; Paxton et al. 2011/2019 MESA; Woosley & Heger 2002; Bock et al. 2019 OpenSpace; Tremblin et al. 2015 ATMO; Baudino et al. 2015 Exo-REM; Madhusudhan et al. 2023) plus live provenance snapshot inspector of the current Stellar Workbench state (with zero API credentials included).

### B. `components/AcademicWhitepaperModal.tsx` *(Reconciled & Enhanced)*
- **Backward-Compatible Props & Dedicated Stellar Whitepaper Mode**:
  - Preserves all existing props (`isOpen`, `onClose`, `graphData`, `citations`, `onAddCitation`, `physicsParams`, `onUpdatePhysicsParams`, `onJumpToFigureTarget`) so `App.tsx` works without breaking changes, and adds optional props for Stellar Workbench integration:
    - `initialTab?: WhitepaperTab` (supporting `'STELLAR_WHITEPAPER' | 'MANUSCRIPT' | 'EQUATIONS' | 'BIBLIOGRAPHY' | 'EXPORT'`)
    - `user?: User | null`
    - `stellarSnapshot?: StellarModelSnapshot` (progenitor preset, mass, metallicity, rotation, epoch, $T_{\text{eff}}$, $\log(L/L_\odot)$, core $T$, C/O ratio, isotopic yields)
- **Navigable Table of Contents (TOC) & Keyboard Accessibility**:
  - Interactive sidebar Table of Contents for jumping directly to each section (`#sec-stellar-1` through `#sec-stellar-6`), with active section highlighting.
  - Full keyboard accessibility: `Escape` key closes the modal, focus management on open, `aria-modal="true"`, `role="dialog"`, and keyboard-focusable TOC links and controls.
- **Observatory Vault Persistence & Local-Browser Fallback**:
  - Connects the **"Save Whitepaper Record to Vault"** action to `saveCelestialDiscovery` in `services/firebase.ts` mapped strictly to the existing `StoredDiscovery` schema (`label`, `scaleRegime: 'STELLAR_WHITEPAPER_DOSSIER'`, `clusterId`, `coordinatesRaDec`, `distanceLabel`, `biosignatureNotes` containing the versioned whitepaper provenance & model snapshot JSON without any API keys, `pubchemCid`, `confidence`, `isPublic`).
  - If the user is unauthenticated or if Firestore returns an error/offline state, automatically persists the versioned whitepaper record to `localStorage` (`graphiverse_stellar_whitepaper_vault_v1`) and displays an explicit, unambiguous status badge distinguishing **`Saved to Local Browser Storage (Offline / Unauthenticated Fallback)`** from **`Saved to Cloud Observatory Vault (Firestore)`**.
- **Full-Document PDF Print / Export (`window.print()`)**:
  - Adds a **"Print / Export PDF"** button in the modal header that switches into print-ready layout and invokes `window.print()`, printing the entire whitepaper (all sections, native MathML equations, comparative tables, benchmark ledger, and references) without modal chrome, scrollbars, or toolbars.

### C. `index.css` *(Print Stylesheet & MathML / High-Contrast Glassmorphism Rules)*
- Adds `@media print` rules so that when printing while the whitepaper modal is open:
  - Hides the 3D canvas, HUD bars, modal toolbars, navigation tabs, and TOC sidebar (`.no-print`).
  - Expands `.whitepaper-print-root` and `.whitepaper-print-content` to full page width, `overflow: visible !important`, `height: auto !important`, crisp black-on-white typography, bordered tables, and page-break-inside guards on equations, tables, and references.
- Adds clean styling for native `<math>` blocks (`.mathml-block`) to ensure high legibility in both dark observatory view and print output.

### D. `components/StellarNucleosynthesisWorkbench.tsx` *(Launcher & Local-First Fallback)*
- **Academic Whitepaper / Documentation Action**:
  - Adds a prominent **"Academic Whitepaper"** button in the top header ribbon of `StellarNucleosynthesisWorkbench.tsx` and renders one `<AcademicWhitepaperModal />` instance at the workbench root configured with `initialTab="STELLAR_WHITEPAPER"`, `user={user}`, and the live `stellarSnapshot`.
- **Resilient Local Fallback on Quota (`429`)**:
  - Updates `handleRunGeminiSynthesis` so that if `/api/gemini/stellar-nucleosynthesis` returns HTTP `429` (or network/quota exhaustion), it preserves the local deterministic nucleosynthesis calculation, displays a clear notice that Gemini quota was reached, and provides a clearly labeled deterministic local physical summary rather than failing silently or claiming unverified AI output.

### E. `server.ts` *(Upstream 429 Error Handling & Bounded Retry)*
- Updates Gemini route error handling (specifically `/api/gemini/stellar-nucleosynthesis`, `/api/gemini/biosignature-scan`, and `/api/gemini/chat` via a shared helper `extractUpstreamHttpStatus(error)` and bounded retry helper `callGeminiWithBoundedRetry`) so that:
  - Transient upstream `429` / `503` errors are retried with bounded exponential backoff (max 2 retries).
  - If upstream quota `429` (`RESOURCE_EXHAUSTED`) persists, the Express route responds with HTTP `429` (not a generic `500`) and a structured `{ error, code: 'RESOURCE_EXHAUSTED', status: 429, fallbackAvailable: true }` payload.
