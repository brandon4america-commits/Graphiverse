import { AINavigatorState, NavigatorPhase, NavigatorStepInfo, DockTab, ViewLens, SpaceWeather, Node, Cluster } from '../types';

export interface NavigatorCallbacks {
  onSelectClusterIdx: (idx: number) => void;
  onSelectNode: (node: Node) => void;
  onLensChange: (lens: ViewLens) => void;
  onChangeSpaceWeather: (weather: SpaceWeather) => void;
  onRunEvolutionRounds: (rounds: number) => void;
  onSynthesizeDialecticalResolution: (nodeA: Node, nodeB: Node) => Promise<void>;
  onTriggerNanoprobePatrol: () => void;
  onSetTemporalPlaybackGen: (gen: number | null) => void;
  onToggleSidebar: () => void;
}

export const INITIAL_STEP_INFO: NavigatorStepInfo = {
  phase: 'SECTOR_INSPECTION',
  stepNumber: 1,
  totalSteps: 8,
  phaseTitle: 'Phase 1: 3D Sector Exploration',
  actionBadge: 'INSPECT 3D ANOMALY',
  rationaleSubtitle: 'Navigating to high-tension epistemic cluster in 3D coordinate space.',
  targetDescription: 'Sector Cluster Anomaly'
};

export const INITIAL_NAVIGATOR_STATE: AINavigatorState = {
  isActive: false,
  isPaused: false,
  isHumanInterrupted: false,
  speedMultiplier: 1,
  currentStep: INITIAL_STEP_INFO,
  cursorPos: { x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400 },
  targetPos: { x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400 },
  isClicking: false,
  cycleCount: 1
};

export const NAVIGATOR_STEPS_FLOW: {
  phase: NavigatorPhase;
  stepNumber: number;
  phaseTitle: string;
  actionBadge: string;
  targetDescription: string;
  rationaleSubtitle: string;
  selector?: string;
  fallbackPos?: (w: number, h: number) => { x: number; y: number };
}[] = [
  {
    phase: 'SECTOR_INSPECTION',
    stepNumber: 1,
    phaseTitle: 'Phase 1: 3D Sector Exploration',
    actionBadge: 'INSPECT 3D ANOMALY',
    targetDescription: 'Sector 3D Cluster',
    rationaleSubtitle: 'AI Operator targeting contested knowledge anomaly to inspect relational topology and confidence vectors.',
    fallbackPos: (w, h) => ({ x: w * 0.48, y: h * 0.45 })
  },
  {
    phase: 'DIALECTICAL_TENSION',
    stepNumber: 2,
    phaseTitle: 'Phase 2: Dialectical Analysis',
    actionBadge: 'OPEN DIALECTIC DOCK',
    targetDescription: 'Dialectical View Tab',
    rationaleSubtitle: 'Activating dialectical tension matrix to expose unresolved contradictions and opposing theses.',
    selector: '[data-tour="dock-tab-dialectic"]',
    fallbackPos: (w, h) => ({ x: w * 0.42, y: h * 0.92 })
  },
  {
    phase: 'DIALECTICAL_SYNTHESIS',
    stepNumber: 3,
    phaseTitle: 'Phase 3: Epistemic Synthesis',
    actionBadge: 'SYNTHESIZE TENSION',
    targetDescription: 'Synthesize Dialectical Bridge',
    rationaleSubtitle: 'Initiating server-side dialectical synthesis to reconcile epistemic divergence with new empirical links.',
    selector: '[data-tour="btn-synthesize-tension"]',
    fallbackPos: (w, h) => ({ x: w * 0.82, y: h * 0.88 })
  },
  {
    phase: 'WEATHER_MODULATION',
    stepNumber: 4,
    phaseTitle: 'Phase 4: Space Weather Storm',
    actionBadge: 'MODULATE WEATHER',
    targetDescription: 'Relativistic Weather Engine',
    rationaleSubtitle: 'Modulating relativistic space weather: Initiating solar flare storm to stress-test topological stability.',
    selector: '[data-tour="weather-cycle"]',
    fallbackPos: (w, h) => ({ x: w * 0.28, y: 32 })
  },
  {
    phase: 'NANOPROBE_SWARM',
    stepNumber: 5,
    phaseTitle: 'Phase 5: Autonomous Probes',
    actionBadge: 'DEPLOY PROBE SCAN',
    targetDescription: 'Nanoprobe Swarm Scanner',
    rationaleSubtitle: 'Dispatching 12 autonomous nanoprobes along active link paths to collect telemetry dispatches.',
    selector: '[data-tour="dock-tab-agents"]',
    fallbackPos: (w, h) => ({ x: w * 0.52, y: h * 0.92 })
  },
  {
    phase: 'TEMPORAL_LINEAGE',
    stepNumber: 6,
    phaseTitle: 'Phase 6: Lineage & Time-Lapse',
    actionBadge: 'INSPECT LINEAGE DAG',
    targetDescription: 'Lineage Tree & Epochs',
    rationaleSubtitle: 'Accessing non-destructive temporal lineage DAG to audit historic provenance from GEN-0.',
    selector: '[data-tour="dock-tab-lineage"]',
    fallbackPos: (w, h) => ({ x: w * 0.32, y: h * 0.92 })
  },
  {
    phase: 'TOPOLOGY_EVOLUTION',
    stepNumber: 7,
    phaseTitle: 'Phase 7: Recursive Evolution',
    actionBadge: 'EVOLVE TOPOLOGY',
    targetDescription: 'Evolution Engine Tab',
    rationaleSubtitle: 'Executing multi-round recursive graph evolution to synthesize second-order child nodes.',
    selector: '[data-tour="btn-3x-evolve"]',
    fallbackPos: (w, h) => ({ x: w * 0.76, y: 32 })
  },
  {
    phase: 'DOSSIER_AUDIT',
    stepNumber: 8,
    phaseTitle: 'Phase 8: Evidentiary Audit',
    actionBadge: 'INSPECT DOSSIER',
    targetDescription: 'Unclipped Node Inspector',
    rationaleSubtitle: 'Opening zero-truncation evidentiary dossier: Validating unclipped citations and confidence ratings.',
    selector: '[data-tour="btn-inspector"]',
    fallbackPos: (w, h) => ({ x: w * 0.92, y: 32 })
  }
];

export function getElementCenter(selector?: string): { x: number; y: number } | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  return {
    x: Math.round(rect.left + rect.width / 2),
    y: Math.round(rect.top + rect.height / 2)
  };
}
