export enum NodeType {
  CLAIM = 'CLAIM',
  EVIDENCE = 'EVIDENCE',
  CONTRADICTION = 'CONTRADICTION',
  QUESTION = 'QUESTION',
  IDEA = 'IDEA',
  SOURCE = 'SOURCE',
  DEFINITION = 'DEFINITION'
}

export enum ClusterStability {
  SETTLED = 'SETTLED',
  EMERGING = 'EMERGING',
  CONTESTED = 'CONTESTED'
}

export enum ExpansionType {
  STABLE = 'STABLE',
  EXPLOSIVE = 'EXPLOSIVE',
  CRYSTALLINE = 'CRYSTALLINE'
}

export enum PilotMode {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL'
}

export type CosmicScaleRegime =
  | 'SOLAR_SYSTEM'
  | 'EXOPLANETARY'
  | 'PREBIOTIC_NURSERY'
  | 'GALACTIC_CORE'
  | 'LOCAL_GROUP'
  | 'SUPERCLUSTER';

export type ViewLens = 'ORBIT' | 'NEBULA' | 'MATRIX' | 'AUDIT';

export type VoiceMode = 'SINGLE' | 'DUAL_HOST';

export type DockTab =
  | 'TOUR'
  | 'EVOLVE'
  | 'LINEAGE'
  | 'DIALECTIC'
  | 'COPILOT'
  | 'PHYSICS'
  | 'SCENES'
  | 'AGENTS';

export type EvolutionFocus =
  | 'FULL_EXPANSION'
  | 'RESOLVE_CONTRADICTIONS'
  | 'CROSS_CLUSTER_BRIDGES'
  | 'ADVERSARIAL_STRESS_TEST';

export type SpaceWeather =
  | 'QUIET_SPACE'
  | 'SOLAR_FLARE'
  | 'COSMIC_RAY_STORM'
  | 'GRAVITATIONAL_SURGE';

export interface Node {
  id: string;
  label: string;
  type: NodeType;
  clusterId: string;
  val: number;
  confidence: number;
  source?: string;
  description?: string;
  citations?: string[];
  aiAnalysis?: string;
  x?: number;
  y?: number;
  z?: number;
  generation?: number;
  parentClusterId?: string;
  subClusterId?: string;
  parentId?: string;
  // Known Universe Multi-Scale & Astrobiology Metadata
  scaleRegime?: CosmicScaleRegime;
  distanceLabel?: string;
  coordinatesRaDec?: string;
  spectralClass?: string;
  effectiveTempK?: number;
  pubchemCid?: number;
  compoundName?: string;
  uniprotId?: string;
  pdbId?: string;
  organismName?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  strength?: number;
  relation?: 'SUPPORTS' | 'CONTRADICTS' | 'DERIVES' | 'BRIDGE';
}

export interface Cluster {
  id: string;
  name: string;
  stability: ClusterStability;
  center: { x: number; y: number; z: number };
  parentClusterId?: string;
  subClusterIds?: string[];
  level?: number;
  description?: string;
  scaleRegime?: CosmicScaleRegime;
  distanceRange?: string;
}

export interface GraphData {
  nodes: Node[];
  links: GraphLink[];
  clusters: Cluster[];
}

export interface SceneManifest {
  sceneId: string;
  clusterId: string;
  title: string;
  stability: ClusterStability;
  camera: {
    target: { x: number; y: number; z: number };
    fov: number;
    duration: number;
  };
  audioCue: {
    tempo: number;
    key: string;
    instrumentation: string[];
    mood: string;
  };
  intelligence: {
    lyrics: string[];
    citations: string[];
    highlightNodes: string[];
  };
  musicData?: string;
  narrationData?: string;
}

export interface CustomSceneKeyframe {
  id: string;
  title: string;
  clusterId: string;
  cameraTarget: { x: number; y: number; z: number };
  lens: ViewLens;
  voiceMode: VoiceMode;
  notes: string;
}

export interface VisualSettings {
  bloomIntensity: number;
  particleDensity: number;
  rotationSpeed: number;
  expansionType: ExpansionType;
  dispersionCauchyB?: number;
  thinFilmThicknessNm?: number;
  mieAnisotropyG?: number;
  anamorphicFlareIntensity?: number;
}

export interface PhysicsSettings {
  repulsionStrength: number;
  linkDistance: number;
  clusterGravity: number;
  freezeLayout: boolean;
}

export interface ClusterFilterState {
  activeClusters: Record<string, boolean>;
  minConfidence: number;
  stabilityFilter: Record<ClusterStability, boolean>;
}

export interface AudioSettings {
  masterVolume: number;
  musicEnabled: boolean;
  narrationEnabled: boolean;
  voiceMode: VoiceMode;
}

export type HeatmapMetricMode = 'FRICTION' | 'ACTIVITY' | 'COMPOSITE';
export type HeatmapPalette = 'SPECTRAL_FRICTION' | 'THERMAL_ENERGY' | 'CHRONO_NEON';

export interface HeatmapSettings {
  enabled: boolean;
  mode: HeatmapMetricMode;
  intensity: number;
  radius: number;
  threshold: number;
  particleCount: number;
  palette: HeatmapPalette;
  showHotspots: boolean;
  showIsoContours: boolean;
  pulseWithAudio: boolean;
}

export interface HeatmapHotspot {
  id: string;
  label: string;
  category: 'FRICTION_SHEAR' | 'ACTIVITY_SURGE' | 'DIALECTICAL_TENSION';
  score: number;
  frictionScore: number;
  activityScore: number;
  position: { x: number; y: number; z: number };
  clusterId: string;
  clusterName: string;
  diagnostic: string;
  associatedNodeIds: string[];
}

export interface AppSettings {
  visuals: VisualSettings;
  physics: PhysicsSettings;
  clusterFilter: ClusterFilterState;
  audio: AudioSettings;
  pilotMode: PilotMode;
  heatmap?: HeatmapSettings;
}

export interface GraphQueryResult {
  answer: string;
  highlightNodeIds: string[];
  targetClusterId?: string | null;
  suggestedFollowUps: string[];
}

export interface NodeInspectionResult {
  deepAnalysis: string;
  methodologyCritique: string;
  citations: string[];
  newChildNodes: {
    label: string;
    type: NodeType;
    description: string;
    confidence: number;
    source: string;
    val: number;
  }[];
}

export interface EvolutionRoundResult {
  round: number;
  focus: EvolutionFocus;
  roundTitle: string;
  synthesisSummary: string;
  newNodes: Node[];
  newLinks: GraphLink[];
  updatedClusterStabilities: {
    clusterId: string;
    stability: ClusterStability;
  }[];
  timestamp: string;
}

export interface ClusterDrillDownResult {
  parentClusterId: string;
  subClusters: Cluster[];
  subNodes: Node[];
  subLinks: GraphLink[];
  synthesisNote: string;
}

export interface DialecticalPair {
  claimNode: Node;
  counterNode: Node;
  tensionLevel: 'HIGH' | 'CRITICAL' | 'MODERATE';
  tensionDescription: string;
  reconcilingHypothesis?: string;
}

export interface ResearcherDispatch {
  id: string;
  probeId: string;
  targetClusterId: string;
  targetClusterName: string;
  timestamp: string;
  message: string;
  observedStability: ClusterStability;
  anomaliesDetected: number;
  telemetrySignal: 'STABLE' | 'DEGRADED' | 'ELEVATED';
}

export interface GenerationSnapshot {
  generation: number;
  label: string;
  timestamp: string;
  nodes: Node[];
  links: GraphLink[];
  clusters: Cluster[];
  summary?: string;
}

export type NavigatorPhase =
  | 'SECTOR_INSPECTION'
  | 'DIALECTICAL_TENSION'
  | 'DIALECTICAL_SYNTHESIS'
  | 'WEATHER_MODULATION'
  | 'NANOPROBE_SWARM'
  | 'TEMPORAL_LINEAGE'
  | 'TOPOLOGY_EVOLUTION'
  | 'DOSSIER_AUDIT'
  | 'LENS_TRANSFORMATION';

export interface NavigatorStepInfo {
  phase: NavigatorPhase;
  stepNumber: number;
  totalSteps: number;
  phaseTitle: string;
  actionBadge: string;
  rationaleSubtitle: string;
  targetDescription: string;
}

export interface AINavigatorState {
  isActive: boolean;
  isPaused: boolean;
  isHumanInterrupted: boolean;
  speedMultiplier: number;
  currentStep: NavigatorStepInfo;
  cursorPos: { x: number; y: number };
  targetPos: { x: number; y: number };
  isClicking: boolean;
  cycleCount: number;
}

// Multi-Turn Gemini Chatbot & Search Grounding
export type GeminiChatModel = 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';
export type ResearchPersona =
  | 'COSMOLOGIST'
  | 'ASTROBIOLOGIST'
  | 'EPISTEMIC_AUDITOR'
  | 'WHITEPAPER_COAUTHOR';

export interface GroundingCitation {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  model?: GeminiChatModel;
  citations?: GroundingCitation[];
  highlightNodeIds?: string[];
  targetClusterId?: string | null;
}

// Lyria Music Generation
export type LyriaModelId = 'lyria-3-clip-preview' | 'lyria-3-pro-preview';

export interface LyriaTrackRecord {
  id: string;
  title: string;
  clusterId: string;
  clusterName: string;
  model: LyriaModelId;
  prompt: string;
  audioDataUri: string;
  lyrics: string;
  coherenceScore: number;
  spectralCentroidHz: number;
  tempoBpm: number;
  createdAt: string;
}

// Academic Whitepaper & Live Equations
export interface AcademicCitation {
  id: string;
  authors: string;
  year: number;
  title: string;
  venue: string;
  doiOrUrl: string;
  bibtexKey: string;
  sourceDatabase?: 'FOUNDATIONAL' | 'EUROPE_PMC' | 'OPENALEX' | 'ARXIV' | 'WEB_GROUNDING';
}

export interface WhitepaperFigureSpec {
  id: string;
  figureNumber: string;
  caption: string;
  targetClusterId: string;
  targetNodeId?: string;
  metricSummary: string;
}

export interface WhitepaperSection {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  paragraphs: string[];
  latexEquations?: {
    id: string;
    label: string;
    formula: string;
    description: string;
  }[];
  figure?: WhitepaperFigureSpec;
  citationKeys: string[];
}

export interface LiveOpticalPhysicsParams {
  cauchyA: number;
  cauchyB: number;
  thinFilmThicknessNm: number;
  filmRefractiveIndex: number;
  mieAnisotropyG: number;
  logScaleBase: number;
  anamorphicStreakGain: number;
}
