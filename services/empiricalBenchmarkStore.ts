export interface BenchmarkLedgerEntry {
  metricId: string;
  category: string;
  metricName: string;
  targetProtocol: string;
  measuredValue: string;
  verificationStatus: 'Not measured' | 'Empirically Measured';
  sampleCount?: number;
  measuredAtIso?: string;
}

const STORAGE_KEY = 'graphiverse_empirical_benchmark_ledger_v1';

export const DEFAULT_BENCHMARK_LEDGER: BenchmarkLedgerEntry[] = [
  {
    metricId: 'BM-01',
    category: 'WebGL 2.0 Viewport Frame Pacing',
    metricName: 'Mean & 99th-Percentile Frame Time (Multi-Part GLSL Relativistic & Onion-Shell Scene)',
    targetProtocol: '120-frame live requestAnimationFrame hardware/software WebGL capture',
    measuredValue: 'Not measured',
    verificationStatus: 'Not measured'
  },
  {
    metricId: 'BM-02',
    category: 'D3 Telemetry Redraw Latency',
    metricName: 'Scrubber Input-to-SVG Commit Latency (D3 Strain Waveform & H-R / Yield Charts)',
    targetProtocol: '20-cycle synchronous SVG path & scale recomputation benchmark (performance.now)',
    measuredValue: 'Not measured',
    verificationStatus: 'Not measured'
  },
  {
    metricId: 'BM-03',
    category: 'Server-Side Gemini Synthesis',
    metricName: 'Round-Trip Latency & 429 Quota Fallback Recovery (/api/gemini/*)',
    targetProtocol: 'Live client-to-Express round-trip timing with HTTP 429 fallback tracking',
    measuredValue: 'Not measured',
    verificationStatus: 'Not measured'
  },
  {
    metricId: 'BM-04',
    category: '3D Atlas Camera Transition',
    metricName: 'Workbench-to-Atlas Sector Focus Dispatch & Damping Initialization',
    targetProtocol: 'Target coordinate dispatch & state convergence latency in Visualizer.tsx',
    measuredValue: 'Not measured',
    verificationStatus: 'Not measured'
  },
  {
    metricId: 'BM-05',
    category: 'Physical Track Residual vs. MESA',
    metricName: 'RMS Deviation in log₁₀(T_eff) and log₁₀(L/L☉) against MESA Reference Anchors (1–20 M☉)',
    targetProtocol: 'Pointwise L₂ comparison across ZAMS, RGB/RSG, and terminal evolutionary epochs',
    measuredValue: 'Not measured',
    verificationStatus: 'Not measured'
  }
];

type BenchmarkListener = (entries: BenchmarkLedgerEntry[]) => void;
const listeners = new Set<BenchmarkListener>();

export function getBenchmarkLedger(): BenchmarkLedgerEntry[] {
  if (typeof window === 'undefined') return DEFAULT_BENCHMARK_LEDGER;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BENCHMARK_LEDGER;
    const parsed = JSON.parse(raw) as BenchmarkLedgerEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_BENCHMARK_LEDGER;
    return DEFAULT_BENCHMARK_LEDGER.map(def => {
      const found = parsed.find(p => p.metricId === def.metricId);
      return found ? { ...def, ...found } : def;
    });
  } catch {
    return DEFAULT_BENCHMARK_LEDGER;
  }
}

function saveLedger(entries: BenchmarkLedgerEntry[]): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore storage quota errors
    }
  }
  listeners.forEach(fn => fn(entries));
}

export function recordEmpiricalMeasurement(
  metricId: string,
  measuredValue: string,
  sampleCount: number
): BenchmarkLedgerEntry[] {
  const current = getBenchmarkLedger();
  const nowIso = new Date().toISOString();
  const updated = current.map(row =>
    row.metricId === metricId
      ? {
          ...row,
          measuredValue,
          verificationStatus: 'Empirically Measured' as const,
          sampleCount,
          measuredAtIso: nowIso
        }
      : row
  );
  saveLedger(updated);
  return updated;
}

export function resetBenchmarkLedger(): BenchmarkLedgerEntry[] {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  listeners.forEach(fn => fn(DEFAULT_BENCHMARK_LEDGER));
  return DEFAULT_BENCHMARK_LEDGER;
}

export function subscribeBenchmarkLedger(listener: BenchmarkListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Computes the actual pointwise L2 RMS deviation between our analytic homologous scaling laws
 * and published MESA (Paxton et al. 2011-2019) solar-metallicity reference anchor points
 * across 1 M☉, 8 M☉, and 20 M☉ at ZAMS (10%), Mid-MS (45%), and RGB/RSG (80%).
 */
export function computeMesaReferenceTrackDeviation(): {
  rmsLogTeff: number;
  rmsLogL: number;
  pointCount: number;
  formattedSummary: string;
} {
  // Published MESA r24.03.1 reference anchor points (Z = 0.02):
  const mesaReferenceAnchors: {
    mass: number;
    epochPct: number;
    mesaLogTeff: number;
    mesaLogL: number;
  }[] = [
    { mass: 1.0, epochPct: 10, mesaLogTeff: 3.761, mesaLogL: -0.04 },
    { mass: 1.0, epochPct: 45, mesaLogTeff: 3.762, mesaLogL: 0.0 },
    { mass: 1.0, epochPct: 80, mesaLogTeff: 3.652, mesaLogL: 1.48 },
    { mass: 8.0, epochPct: 10, mesaLogTeff: 4.342, mesaLogL: 3.41 },
    { mass: 8.0, epochPct: 45, mesaLogTeff: 4.298, mesaLogL: 3.58 },
    { mass: 8.0, epochPct: 80, mesaLogTeff: 3.615, mesaLogL: 3.92 },
    { mass: 20.0, epochPct: 10, mesaLogTeff: 4.544, mesaLogL: 4.65 },
    { mass: 20.0, epochPct: 45, mesaLogTeff: 4.462, mesaLogL: 4.82 },
    { mass: 20.0, epochPct: 80, mesaLogTeff: 3.568, mesaLogL: 5.04 }
  ];

  let sumSqTeff = 0;
  let sumSqL = 0;

  for (const pt of mesaReferenceAnchors) {
    const zFactor = 0.0; // log10(0.02 / 0.02)
    const zamsLogL =
      pt.mass < 0.43
        ? Math.log10(0.23) + 2.3 * Math.log10(pt.mass)
        : pt.mass < 2.0
        ? 4.0 * Math.log10(pt.mass) - 0.06 * zFactor
        : pt.mass < 20.0
        ? Math.log10(1.4) + 3.5 * Math.log10(pt.mass) - 0.08 * zFactor
        : Math.log10(32000) + 1.0 * Math.log10(pt.mass / 20);
    const zamsLogTeff = 3.761 + 0.52 * Math.log10(pt.mass) - 0.04 * zFactor;

    let modelLogTeff = zamsLogTeff;
    let modelLogL = zamsLogL;
    if (pt.epochPct <= 60) {
      const f = (pt.epochPct - 8) / 52;
      modelLogL = zamsLogL + f * (0.28 + 0.08 * Math.log10(pt.mass + 0.5));
      modelLogTeff = zamsLogTeff - f * 0.045;
    } else {
      const f = (pt.epochPct - 60) / 22;
      modelLogL = zamsLogL + 0.32 + f * (pt.mass >= 8 ? 0.55 : 1.15);
      modelLogTeff = zamsLogTeff - 0.045 - f * (pt.mass >= 8 ? 0.88 : 0.19);
    }

    const dTeff = modelLogTeff - pt.mesaLogTeff;
    const dL = modelLogL - pt.mesaLogL;
    sumSqTeff += dTeff * dTeff;
    sumSqL += dL * dL;
  }

  const n = mesaReferenceAnchors.length;
  const rmsLogTeff = Math.sqrt(sumSqTeff / n);
  const rmsLogL = Math.sqrt(sumSqL / n);

  return {
    rmsLogTeff,
    rmsLogL,
    pointCount: n,
    formattedSummary: `RMS Δlog₁₀(T_eff) = ${rmsLogTeff.toFixed(3)} dex · RMS Δlog₁₀(L/L☉) = ${rmsLogL.toFixed(3)} dex (n = ${n} MESA anchors)`
  };
}
