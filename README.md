<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1krQpxBFsfXl2Y2CrPaVJFMJvSVY8EAXi

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`# Graphiverse Cinematic Suite (v2.4.0)

**Time-Domain Stellar Evolution, Concentric Hydrostatic Nucleosynthesis, and Prebiotic Interstellar Seeding**

* **Version:** 2.4.0 ([`CITATION.cff`](./CITATION.cff))
* **License:** MIT ([`LICENSE`](./LICENSE))
* **Author:** Brandon Sypherd Gibbins

---

## Overview

**Graphiverse Cinematic Suite** is an interactive 3D WebGL astrovisualization and computational stellar workbench engineered with React, TypeScript, and Three.js. It models the complete lifecycle of stellar progenitors across logarithmic timescales, linking interior hydrostatic burning shells and supernova shock propagation to the synthesis and interstellar dispersal of prebiotic organic precursors.

Every telemetry readout, thermodynamic profile, and nucleosynthetic pathway is governed by an explicit **Epistemic Provenance Taxonomy** (`[OBSERVED]`, `[SIMULATED]`, `[THEORETICAL]`, `[SPECULATIVE]`), ensuring rigorous separation between empirical spectroscopic measurements, 1D/3D hydrodynamic stellar evolution codes, and theoretical astrobiological models.

---

## Core Architecture & Capabilities

* **3D WebGL Stellar Workbench:** Real-time volumetric and geometric rendering of stellar interiors, concentric hydrostatic burning shells (H -> He -> C -> Ne -> O -> Si -> Fe), convective envelopes, and circumstellar mass-loss remnants.
* **Multi-Epoch Progenitor Presets:**
  * **High-Mass Red Supergiant (18.5 Solar Masses — Betelgeuse / Alpha Orionis Analog):** Tracks rapid core contraction, onion-skin shell nucleosynthesis, iron-core photodisintegration, core-collapse supernova (r-process), and interstellar medium (ISM) enrichment.
  * **Ultra-Cool Red Dwarf (0.09 Solar Masses — TRAPPIST-1 Analog):** Models fully convective interior transport, slow proton-proton (pp-chain) fusion over 10^12 yr timescales, and magnetic flare activity without high-Z core stratification.
* **Epistemic Provenance Taxonomy:** Integrated 4-tier classification badges embedded across both the interactive telemetry HUD and the companion whitepaper modal.
* **Integrated Academic Whitepaper (`v2.4.0`):** Full in-app whitepaper reader (`AcademicWhitepaperModal.tsx` & `StellarEvolutionWhitepaper.tsx`) detailing mathematical formulations, Kippenhahn structural diagnostics, and literature benchmarks.

---

## Local Development & Execution

### Prerequisites
* **Node.js** (v18+ recommended) or **Bun**

### Installation

```bash
cd Graphiverse
npm install
```

### Environment Configuration
Copy `.env.example` to `.env.local` and configure any optional API keys if using AI-assisted telemetry querying:

```bash
cp .env.example .env.local
```

### Run Development Server

```bash
npm run dev
```

---

## Citation

If you use the **Graphiverse Cinematic Suite** or its epistemic whitepaper architecture in your research, please cite it using the metadata in [`CITATION.cff`](./CITATION.cff) or the following BibTeX entry:

```bibtex
@software{Gibbins_Graphiverse_2026,
  author       = {Gibbins, Brandon Sypherd},
  title        = {{Graphiverse Cinematic Suite: Time-Domain Stellar Evolution, Concentric Hydrostatic Nucleosynthesis, and Prebiotic Interstellar Seeding}},
  version      = {2.4.0},
  year         = {2026},
  month        = nov,
  license      = {MIT}
}
```

---

## License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full details.
