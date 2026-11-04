import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Square,
  SkipForward,
  Sliders,
  Sparkles,
  Compass,
  Upload,
  PanelRightOpen,
  Volume2,
  VolumeX,
  Users,
  User,
  Send,
  Plus,
  Download,
  ChevronDown,
  ChevronUp,
  Layers,
  Eye,
  EyeOff,
  Radio,
  Flame,
  RefreshCw,
  Zap,
  GitPullRequest,
  Scale,
  FileText,
  Bot,
  Activity,
  BookOpen,
  Atom,
  MessageSquare,
  Mic,
  Music,
  Database,
  Crosshair,
  Orbit,
  Globe
} from 'lucide-react';
import {
  SceneManifest,
  ClusterStability,
  ViewLens,
  AppSettings,
  Cluster,
  CustomSceneKeyframe,
  DockTab,
  ExpansionType,
  EvolutionFocus,
  EvolutionRoundResult,
  Node,
  NodeType,
  SpaceWeather,
  ResearcherDispatch,
  GenerationSnapshot,
  HeatmapSettings,
  HeatmapHotspot,
  HeatmapPalette
} from '../types';
import { getAudioSpectrum } from '../services/audio';
import { getPaletteColorRamps, DEFAULT_HEATMAP_SETTINGS } from '../services/heatmapEngine';

interface ChatEntry {
  id: string;
  role: 'user' | 'model';
  text: string;
  followUps?: string[];
  highlightNodeIds?: string[];
}

interface DirectorUIProps {
  activeScene?: SceneManifest;
  isTouring: boolean;
  isLoading: boolean;
  onToggleTour: () => void;
  onNext: () => void;
  currentLens: ViewLens;
  onLensChange: (lens: ViewLens) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenIngestionModal: () => void;
  audioDuration: number;
  clusters: Cluster[];
  currentClusterIdx: number;
  onSelectClusterIdx: (idx: number) => void;
  chatHistory: ChatEntry[];
  onSendQuery: (query: string) => void;
  isQueryLoading: boolean;
  customScenes: CustomSceneKeyframe[];
  onCaptureKeyframe: () => void;
  onPlayCustomScene: (kf: CustomSceneKeyframe) => void;
  onDeleteCustomScene: (id: string) => void;
  onExportManifest: () => void;
  onExportMarkdown: () => void;
  onExportPresentationHtml?: () => void;
  evolutionHistory: EvolutionRoundResult[];
  isEvolving: boolean;
  currentEvolutionRound: number;
  totalEvolutionRounds: number;
  evolutionFocus: EvolutionFocus;
  onChangeEvolutionFocus: (focus: EvolutionFocus) => void;
  onRunEvolutionRounds: (rounds: number) => void;
  nodes: Node[];
  onSelectNode: (node: Node) => void;
  onSynthesizeDialecticalResolution: (nodeA: Node, nodeB: Node) => Promise<void>;
  isDialecticalLoading: boolean;
  spaceWeather: SpaceWeather;
  onChangeSpaceWeather: (weather: SpaceWeather) => void;
  generationSnapshots: GenerationSnapshot[];
  temporalPlaybackGen: number | null;
  onSetTemporalPlaybackGen: (gen: number | null) => void;
  isPlayingTemporal: boolean;
  onTogglePlayTemporal: () => void;
  temporalSpeed: number;
  onChangeTemporalSpeed: (speed: number) => void;
  researcherDispatches: ResearcherDispatch[];
  isPatrolling: boolean;
  onTriggerNanoprobePatrol: () => void;
  isNavigatorActive?: boolean;
  onToggleNavigator?: () => void;
  onOpenWhitepaper?: () => void;
  onOpenBioscience?: () => void;
  onOpenExoplanetSim?: () => void;
  onOpenStellarSim?: () => void;
  onOpenMergerSim?: () => void;
  onOpenChatbot?: () => void;
  onOpenLiveVoice?: () => void;
  onOpenLyriaStudio?: () => void;
  onOpenVault?: () => void;
  isAuthenticated?: boolean;
  heatmapSettings?: HeatmapSettings;
  onUpdateHeatmapSettings?: (settings: HeatmapSettings) => void;
  detectedHotspots?: HeatmapHotspot[];
  onFocusHotspot?: (hotspot: HeatmapHotspot) => void;
  selectedHotspotId?: string | null;
  onAgentCommand?: (command: string) => void;
  onWormholeTraverse?: () => void;
}

const WEATHER_CONFIG: Record<SpaceWeather, { label: string; dotColor: string }> = {
  QUIET_SPACE: {
    label: 'Quiet Space',
    dotColor: '#38BDF8'
  },
  SOLAR_FLARE: {
    label: 'Solar Flare',
    dotColor: '#F59E0B'
  },
  COSMIC_RAY_STORM: {
    label: 'Cosmic Ray Storm',
    dotColor: '#F43F5E'
  },
  GRAVITATIONAL_SURGE: {
    label: 'Gravitational Surge',
    dotColor: '#A855F7'
  }
};

const STABILITY_LABEL: Record<ClusterStability, { label: string; colorClass: string }> = {
  [ClusterStability.SETTLED]: {
    label: 'Settled Consensus',
    colorClass: 'text-sky-400'
  },
  [ClusterStability.EMERGING]: {
    label: 'Emerging Synthesis',
    colorClass: 'text-amber-400'
  },
  [ClusterStability.CONTESTED]: {
    label: 'Contested Frontier',
    colorClass: 'text-rose-400'
  }
};

const FOCUS_OPTIONS: { id: EvolutionFocus; label: string; desc: string }[] = [
  {
    id: 'FULL_EXPANSION',
    label: 'Full Epistemic Expansion',
    desc: 'Synthesize second-order claims, empirical evidence, and cross-domain bridges'
  },
  {
    id: 'RESOLVE_CONTRADICTIONS',
    label: 'Dialectical Resolution',
    desc: 'Target contested anomalies and generate reconciling empirical bridges'
  },
  {
    id: 'CROSS_CLUSTER_BRIDGES',
    label: 'Cross-Cluster Bridges',
    desc: 'Discover non-obvious structural links between distant knowledge clusters'
  },
  {
    id: 'ADVERSARIAL_STRESS_TEST',
    label: 'Adversarial Stress-Test',
    desc: 'Inject rigorous falsification probes and boundary counter-hypotheses'
  }
];

const DirectorUI: React.FC<DirectorUIProps> = ({
  activeScene,
  isTouring,
  isLoading,
  onToggleTour,
  onNext,
  currentLens,
  onLensChange,
  onToggleSidebar,
  isSidebarOpen,
  settings,
  onUpdateSettings,
  onOpenIngestionModal,
  clusters,
  currentClusterIdx,
  onSelectClusterIdx,
  chatHistory,
  onSendQuery,
  isQueryLoading,
  customScenes,
  onCaptureKeyframe,
  onPlayCustomScene,
  onDeleteCustomScene,
  onExportManifest,
  onExportMarkdown,
  onExportPresentationHtml,
  evolutionHistory,
  isEvolving,
  currentEvolutionRound,
  totalEvolutionRounds,
  evolutionFocus,
  onChangeEvolutionFocus,
  onRunEvolutionRounds,
  nodes,
  onSelectNode,
  onSynthesizeDialecticalResolution,
  isDialecticalLoading,
  spaceWeather,
  onChangeSpaceWeather,
  generationSnapshots,
  temporalPlaybackGen,
  onSetTemporalPlaybackGen,
  isPlayingTemporal,
  onTogglePlayTemporal,
  temporalSpeed,
  onChangeTemporalSpeed,
  researcherDispatches,
  isPatrolling,
  onTriggerNanoprobePatrol,
  isNavigatorActive = false,
  onToggleNavigator,
  onOpenWhitepaper,
  onOpenBioscience,
  onOpenExoplanetSim,
  onOpenStellarSim,
  onOpenMergerSim,
  onOpenChatbot,
  onOpenLiveVoice,
  onOpenLyriaStudio,
  onOpenVault,
  isAuthenticated,
  heatmapSettings = DEFAULT_HEATMAP_SETTINGS,
  onUpdateHeatmapSettings,
  detectedHotspots = [],
  onFocusHotspot,
  selectedHotspotId,
  onAgentCommand,
  onWormholeTraverse
}) => {
  const [activeTab, setActiveTab] = useState<DockTab>('TOUR');
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [hudHidden, setHudHidden] = useState(false);
  const [queryInput, setQueryInput] = useState('');
  const [selectedNodeAId, setSelectedNodeAId] = useState<string>('');
  const [selectedNodeBId, setSelectedNodeBId] = useState<string>('');

  // Integrated Tourguide Agent state (consolidated from floating widget)
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentOutput, setAgentOutput] = useState('Autonomous tourguide operator ready.');
  const [isAgentLoading, setIsAgentLoading] = useState(false);

  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'h') {
        setHudHidden(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (!selectedNodeAId && nodes.length > 0) {
      const claim = nodes.find(n => n.type === NodeType.CLAIM) || nodes[0];
      setSelectedNodeAId(claim.id);
    }
    if (!selectedNodeBId && nodes.length > 1) {
      const contra = nodes.find(n => n.type === NodeType.CONTRADICTION) || nodes[1];
      setSelectedNodeBId(contra.id);
    }
  }, [nodes, selectedNodeAId, selectedNodeBId]);

  useEffect(() => {
    let rafId = 0;
    const renderSpectrum = () => {
      const canvas = spectrumCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const spec = getAudioSpectrum();
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          const bars = 20;
          const barW = Math.floor((w - (bars - 1) * 2) / bars);
          for (let i = 0; i < bars; i++) {
            const val = spec[i] / 255;
            const barH = Math.max(2, val * h);
            ctx.fillStyle = i < 8 ? '#38BDF8' : i < 14 ? '#10B981' : '#F59E0B';
            ctx.fillRect(i * (barW + 2), h - barH, barW, barH);
          }
        }
      }
      rafId = requestAnimationFrame(renderSpectrum);
    };
    rafId = requestAnimationFrame(renderSpectrum);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim() || isQueryLoading) return;
    onSendQuery(queryInput.trim());
    setQueryInput('');
  };

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentPrompt.trim() || isAgentLoading) return;
    setIsAgentLoading(true);
    try {
      const response = await fetch('/api/agent/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: agentPrompt.trim() })
      });
      const data = await response.json();
      const text = data.output || 'Command processed.';
      setAgentOutput(text);
      onAgentCommand?.(text);
      setAgentPrompt('');
    } catch {
      setAgentOutput('Unable to reach autonomous tourguide endpoint.');
    } finally {
      setIsAgentLoading(false);
    }
  };

  const toggleClusterActive = (clusterId: string) => {
    const current = settings.clusterFilter.activeClusters[clusterId] ?? true;
    onUpdateSettings({
      ...settings,
      clusterFilter: {
        ...settings.clusterFilter,
        activeClusters: {
          ...settings.clusterFilter.activeClusters,
          [clusterId]: !current
        }
      }
    });
  };

  const updateHeatmap = <K extends keyof HeatmapSettings>(
    key: K,
    val: HeatmapSettings[K]
  ) => {
    if (!onUpdateHeatmapSettings) return;
    onUpdateHeatmapSettings({
      ...heatmapSettings,
      [key]: val
    });
  };

  if (hudHidden) {
    return (
      <button
        onClick={() => setHudHidden(false)}
        className="fixed top-3 right-4 z-40 hud-panel px-3 py-1.5 rounded-md text-xs font-mono text-sky-400 flex items-center gap-2 hover:bg-slate-800/80 transition cursor-pointer"
        title="Restore Observatory HUD (H)"
      >
        <Eye className="w-3.5 h-3.5" />
        <span>Show HUD [H]</span>
      </button>
    );
  }

  const activeCluster = clusters[currentClusterIdx];
  const rawStability = activeScene
    ? activeScene.stability
    : activeCluster
    ? activeCluster.stability
    : ClusterStability.SETTLED;
  const stabilityInfo =
    STABILITY_LABEL[rawStability] || STABILITY_LABEL[ClusterStability.SETTLED];

  const nodeA = nodes.find(n => n.id === selectedNodeAId);
  const nodeB = nodes.find(n => n.id === selectedNodeBId);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-2.5 sm:p-3.5">
      {/* 1. MINIMAL TOP BAR (3-Zone Calibrated Observatory Header) */}
      <header className="pointer-events-auto hud-panel min-h-11 px-3.5 py-1.5 rounded-lg flex flex-wrap items-center justify-between gap-3">
        {/* Left Zone: Brand & Inline Unboxed Telemetry */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
          <span className="font-display font-semibold tracking-tight text-sm text-slate-100 whitespace-nowrap">
            Known Universe
          </span>

          <span className="hidden xl:inline text-slate-600">·</span>
          <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-slate-400 tabular-nums whitespace-nowrap">
            <span>{nodes.length} Nodes</span>
            <span className="text-slate-600">·</span>
            <span>{clusters.length} Sectors</span>
            <span className="text-slate-600">·</span>
            <span className={stabilityInfo.colorClass}>{stabilityInfo.label}</span>
          </div>

          <button
            data-tour="weather-cycle"
            onClick={() => {
              const list: SpaceWeather[] = [
                'QUIET_SPACE',
                'SOLAR_FLARE',
                'COSMIC_RAY_STORM',
                'GRAVITATIONAL_SURGE'
              ];
              const nextIdx = (list.indexOf(spaceWeather) + 1) % list.length;
              onChangeSpaceWeather(list[nextIdx]);
            }}
            className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono text-slate-300 hover:text-white rounded bg-slate-900/80 border border-white/10 hover:border-white/20 transition cursor-pointer"
            title="Cycle Space Weather Regime"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: WEATHER_CONFIG[spaceWeather]?.dotColor || '#38BDF8' }}
            />
            <span>{WEATHER_CONFIG[spaceWeather]?.label}</span>
          </button>
        </div>

        {/* Center Zone: Segmented 4-Lens Switcher */}
        <nav className="flex items-center gap-0.5 bg-[#07090E]/90 p-0.5 rounded-md border border-white/10">
          {(['ORBIT', 'NEBULA', 'MATRIX', 'AUDIT'] as ViewLens[]).map(lens => {
            const active = currentLens === lens;
            return (
              <button
                key={lens}
                data-tour={`lens-${lens.toLowerCase()}`}
                onClick={() => onLensChange(lens)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono tracking-wide uppercase transition cursor-pointer ${
                  active
                    ? 'bg-sky-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {lens}
              </button>
            );
          })}
        </nav>

        {/* Right Zone: Cohesive Instrument & Workbench Triggers */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Primary Action: Whitepaper */}
          <button
            onClick={onOpenWhitepaper}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-sky-500 text-slate-950 hover:bg-sky-400 transition cursor-pointer"
            title="Open Interactive Academic Whitepaper & LaTeX Suite"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Whitepaper</span>
          </button>

          {/* Secondary Observatory Instruments (Uniform Slate Styling) */}
          <button
            onClick={onOpenBioscience}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-900/90 text-slate-200 border border-white/10 hover:border-sky-400/50 hover:text-white transition cursor-pointer"
            title="Open Federated Astrobiology & Molecular Bioinformatics Lab"
          >
            <Atom className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Bio-Lab</span>
          </button>

          <button
            onClick={onOpenExoplanetSim}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-900/90 text-slate-200 border border-white/10 hover:border-sky-400/50 hover:text-white transition cursor-pointer"
            title="Open Advanced Astrobiology Exoplanet Simulation Workbench"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Exo-Sim</span>
          </button>

          <button
            onClick={onOpenStellarSim}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-900/90 text-slate-200 border border-white/10 hover:border-amber-400/50 hover:text-white transition cursor-pointer"
            title="Open Stellar Evolution & Nucleosynthesis Time-Domain Simulator"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Stellar Lab</span>
          </button>

          <button
            onClick={onOpenMergerSim}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-900/90 text-slate-200 border border-white/10 hover:border-cyan-400/50 hover:text-white transition cursor-pointer"
            title="Open Relativistic Black Hole & Gravitational-Wave Merger Lab"
          >
            <Orbit className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">GW Lab</span>
          </button>

          <button
            onClick={onOpenChatbot}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-900/90 text-slate-200 border border-white/10 hover:border-sky-400/50 hover:text-white transition cursor-pointer"
            title="Open Multi-Turn Gemini Research Console"
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Research AI</span>
          </button>

          <button
            onClick={onOpenLiveVoice}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-900/90 text-slate-200 border border-white/10 hover:border-sky-400/50 hover:text-white transition cursor-pointer"
            title="Open Gemini Live Real-Time Voice Mission Comms"
          >
            <Mic className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden lg:inline">Voice</span>
          </button>

          <button
            onClick={onOpenLyriaStudio}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-900/90 text-slate-200 border border-white/10 hover:border-sky-400/50 hover:text-white transition cursor-pointer"
            title="Open Lyria 3 Generative Cosmic Soundtrack Studio"
          >
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Lyria</span>
          </button>

          <button
            onClick={onOpenVault}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition cursor-pointer ${
              isAuthenticated
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-900/90 text-slate-200 border-white/10 hover:border-sky-400/50'
            }`}
            title="Open Firebase Firestore Observatory Vault"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">{isAuthenticated ? 'Vault' : 'Sign In'}</span>
          </button>

          <button
            data-tour="btn-demo"
            onClick={onToggleNavigator}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition cursor-pointer ${
              isNavigatorActive
                ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                : 'bg-slate-900/90 text-slate-200 border-white/10 hover:border-sky-400/50'
            }`}
            title="Launch Autonomous AI-Pointer Demonstration"
          >
            <Bot className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden xl:inline">{isNavigatorActive ? 'Pilot On' : 'AI Pilot'}</span>
          </button>

          <button
            onClick={onOpenIngestionModal}
            className="p-1.5 rounded bg-slate-900/90 text-slate-300 hover:text-white border border-white/10 hover:border-sky-400/50 transition cursor-pointer"
            title="Ingest External Dataset"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <button
            data-tour="btn-inspector"
            onClick={onToggleSidebar}
            className={`p-1.5 rounded border transition cursor-pointer ${
              isSidebarOpen
                ? 'bg-sky-500 text-slate-950 border-sky-400'
                : 'bg-slate-900/90 text-slate-300 border-white/10 hover:border-sky-400/50 hover:text-white'
            }`}
            title="Toggle Node Inspector Drawer"
          >
            <PanelRightOpen className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setHudHidden(true)}
            className="p-1.5 rounded text-slate-400 hover:text-white border border-transparent hover:border-white/10 transition cursor-pointer"
            title="Hide HUD [H]"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* TEMPORAL PLAYBACK SCRUBBER (When multiple generations exist) */}
      {generationSnapshots.length > 1 && (
        <div className="pointer-events-auto mx-auto w-full max-w-4xl my-1.5 hud-panel px-3.5 py-2 rounded-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onTogglePlayTemporal}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isPlayingTemporal
                    ? 'bg-rose-500 text-white'
                    : 'bg-sky-500 text-slate-950'
                }`}
              >
                {isPlayingTemporal ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Time-Lapse</span>
                  </>
                )}
              </button>

              <div className="flex items-center bg-slate-950 rounded border border-white/10 p-0.5">
                {([0.5, 1, 2, 4] as const).map(spd => (
                  <button
                    key={spd}
                    onClick={() => onChangeTemporalSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                      temporalSpeed === spd
                        ? 'bg-sky-500/20 text-sky-400 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            <span className="text-[11px] font-mono text-sky-400 tabular-nums whitespace-nowrap">
              {temporalPlaybackGen !== null
                ? `Gen-${temporalPlaybackGen} of ${generationSnapshots.length - 1}`
                : `Present (Gen-${generationSnapshots.length - 1})`}
            </span>
          </div>

          <div className="flex-1 flex items-center gap-3 mx-0 md:mx-2">
            <input
              data-tour="temporal-slider"
              type="range"
              min={0}
              max={Math.max(0, generationSnapshots.length - 1)}
              value={temporalPlaybackGen ?? generationSnapshots.length - 1}
              onChange={e => onSetTemporalPlaybackGen(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>

          {temporalPlaybackGen !== null && (
            <button
              data-tour="btn-jump-present"
              onClick={() => onSetTemporalPlaybackGen(null)}
              className="px-2.5 py-1 rounded text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition cursor-pointer whitespace-nowrap"
            >
              Present
            </button>
          )}
        </div>
      )}

      {/* FLOATING SUBTITLE BANNER (Active Narration or Evolution Progress) */}
      {(activeScene || isLoading || isEvolving) && (
        <div className="pointer-events-none mx-auto max-w-2xl w-full mb-1.5 text-center">
          <div className="inline-block hud-panel px-4 py-2 rounded-lg">
            {isEvolving ? (
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>
                  Evolution Pass {currentEvolutionRound} of {totalEvolutionRounds} · Synthesizing Topology...
                </span>
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-xs font-mono text-sky-400">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Observatory Manifest & Acoustic Score...</span>
              </div>
            ) : activeScene ? (
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono text-sky-400">
                  {activeScene.title} · {activeScene.audioCue.key} · {activeScene.audioCue.tempo} BPM
                </div>
                <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
                  “{activeScene.intelligence.lyrics.join(' ')}”
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 2. COLLAPSIBLE BOTTOM DOCK (Unified Control Center) */}
      <section className="pointer-events-auto mx-auto w-full max-w-5xl hud-panel rounded-lg overflow-hidden transition-all">
        {/* Dock Header Strip */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-[#0A0E17]/90">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'TOUR', label: 'Expedition & Sectors', icon: Compass },
                { id: 'EVOLVE', label: 'Evolution', icon: Flame },
                { id: 'LINEAGE', label: 'Lineage', icon: GitPullRequest },
                { id: 'DIALECTIC', label: 'Dialectic', icon: Scale },
                { id: 'AGENTS', label: 'Agents & Swarm', icon: Bot },
                { id: 'COPILOT', label: 'Co-Pilot', icon: Sparkles },
                { id: 'PHYSICS', label: 'Optics & Heatmap', icon: Sliders },
                { id: 'SCENES', label: 'Keyframes & Export', icon: Layers }
              ] as { id: DockTab; label: string; icon: React.ComponentType<{ className?: string }> }[]
            ).map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id && !isDockCollapsed;
              return (
                <button
                  key={tab.id}
                  data-tour={`dock-tab-${tab.id.toLowerCase()}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsDockCollapsed(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5 pl-2 shrink-0">
            {/* Quick Heatmap Pill in Dock Header */}
            <button
              onClick={() => updateHeatmap('enabled', !heatmapSettings.enabled)}
              className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border transition cursor-pointer ${
                heatmapSettings.enabled
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                  : 'bg-slate-900 text-slate-400 border-white/10 hover:text-slate-200'
              }`}
              title="Toggle 3D Volumetric Heatmap [M]"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  heatmapSettings.enabled ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
              <span>Heatmap {heatmapSettings.enabled ? heatmapSettings.mode : 'Off'}</span>
            </button>

            <canvas
              ref={spectrumCanvasRef}
              width={96}
              height={18}
              className="hidden md:block opacity-80"
            />

            <button
              onClick={() => setIsDockCollapsed(prev => !prev)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              title={isDockCollapsed ? 'Expand Control Dock' : 'Collapse Control Dock'}
            >
              {isDockCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dock Body */}
        {!isDockCollapsed && (
          <div className="p-3 sm:p-3.5 bg-[#0B0F19]/95">
            {/* TAB 1: EXPEDITION TOUR & SECTORS */}
            {activeTab === 'TOUR' && (
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={onToggleTour}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                      isTouring
                        ? 'bg-rose-500 text-white'
                        : 'bg-sky-500 text-slate-950 font-semibold hover:bg-sky-400'
                    }`}
                  >
                    {isTouring ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop Tour</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Launch Tour</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={onNext}
                    disabled={!isTouring || isLoading}
                    className="p-1.5 rounded bg-slate-900 border border-white/10 text-slate-200 hover:border-sky-400/50 disabled:opacity-40 transition cursor-pointer"
                    title="Next Cosmic Sector"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        audio: {
                          ...settings.audio,
                          voiceMode:
                            settings.audio.voiceMode === 'SINGLE' ? 'DUAL_HOST' : 'SINGLE'
                        }
                      })
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 border border-white/10 text-xs text-slate-200 hover:border-sky-400/50 transition cursor-pointer"
                  >
                    {settings.audio.voiceMode === 'DUAL_HOST' ? (
                      <>
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>Dual Host</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5 text-sky-400" />
                        <span>Single Narrator</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        audio: {
                          ...settings.audio,
                          musicEnabled: !settings.audio.musicEnabled,
                          narrationEnabled: !settings.audio.narrationEnabled
                        }
                      })
                    }
                    className="p-1.5 rounded bg-slate-900 border border-white/10 text-slate-200 hover:border-sky-400/50 transition cursor-pointer"
                    title="Toggle Audio Mute"
                  >
                    {settings.audio.musicEnabled ? (
                      <Volume2 className="w-4 h-4 text-sky-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    )}
                  </button>

                  {onWormholeTraverse && (
                    <button
                      onClick={onWormholeTraverse}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 border border-white/10 text-xs text-slate-300 hover:text-white hover:border-sky-400/50 transition cursor-pointer"
                      title="Traverse Polar Wormhole Gateway"
                    >
                      <Orbit className="w-3.5 h-3.5 text-violet-400" />
                      <span className="hidden sm:inline">Polar Warp</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                  {clusters.map((cluster, idx) => {
                    const isCurrent = idx === currentClusterIdx;
                    return (
                      <button
                        key={cluster.id}
                        onClick={() => onSelectClusterIdx(idx)}
                        className={`flex-1 min-w-[130px] px-2.5 py-1.5 rounded text-left border transition cursor-pointer ${
                          isCurrent
                            ? 'bg-sky-500/15 border-sky-400/60 text-white'
                            : 'bg-slate-900/70 border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-sky-400">0{idx + 1}</span>
                          <span className="text-slate-500">{cluster.stability}</span>
                        </div>
                        <div className="text-xs font-medium text-slate-100 truncate">
                          {cluster.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: EVOLUTION */}
            {activeTab === 'EVOLVE' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-5 space-y-2.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    {FOCUS_OPTIONS.map(opt => {
                      const active = evolutionFocus === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => onChangeEvolutionFocus(opt.id)}
                          className={`p-2 rounded text-left border transition cursor-pointer ${
                            active
                              ? 'bg-amber-500/15 border-amber-400/60 text-white'
                              : 'bg-slate-900/80 border-white/10 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          <div className="text-xs font-medium text-slate-100 truncate">
                            {opt.label}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {opt.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRunEvolutionRounds(1)}
                      disabled={isEvolving}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-sky-500/40 text-sky-400 text-xs font-medium hover:bg-sky-500/10 disabled:opacity-40 transition cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Run 1 Pass</span>
                    </button>

                    <button
                      onClick={() => onRunEvolutionRounds(3)}
                      disabled={isEvolving}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-400 disabled:opacity-40 transition cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isEvolving ? 'animate-spin' : ''}`} />
                      <span>
                        {isEvolving
                          ? `Evolving R${currentEvolutionRound}/${totalEvolutionRounds}...`
                          : '3-Round Synthesis'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7 max-h-36 overflow-y-auto space-y-2 pr-1">
                  {evolutionHistory.length === 0 ? (
                    <div className="p-3.5 rounded bg-slate-900/60 border border-white/10 text-xs text-slate-400">
                      No recursive evolution passes executed yet. Run a pass to synthesize
                      second-order hypotheses, empirical evidence, and cross-cluster bridges.
                    </div>
                  ) : (
                    evolutionHistory.map(item => (
                      <div
                        key={`${item.round}-${item.timestamp}`}
                        className="p-2.5 rounded bg-slate-900/80 border border-white/10 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="text-amber-400 font-semibold">
                            Round 0{item.round} · {item.roundTitle}
                          </span>
                          <span className="text-emerald-400">
                            +{item.newNodes.length} Nodes · +{item.newLinks.length} Bridges · {item.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-snug">
                          {item.synthesisSummary}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: LINEAGE */}
            {activeTab === 'LINEAGE' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200 flex items-center gap-1.5">
                    <GitPullRequest className="w-3.5 h-3.5 text-sky-400" />
                    <span>Evolutionary Lineage DAG (Gen-0 to Gen-N)</span>
                  </span>
                  <span className="font-mono text-slate-400 tabular-nums">
                    {nodes.filter(n => (n.generation || 0) > 0).length} Evolved Nodes
                  </span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {nodes.map(n => {
                    const gen = n.generation || 0;
                    return (
                      <div
                        key={n.id}
                        onClick={() => onSelectNode(n)}
                        className="p-2 rounded bg-slate-900/80 border border-white/10 hover:border-sky-400/50 flex items-center justify-between gap-3 text-xs cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] text-slate-400">
                            Gen-{gen} · {n.type}
                          </span>
                          <span className="text-slate-100 font-medium truncate">{n.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 shrink-0 tabular-nums">
                          {n.parentId && <span className="hidden sm:inline">Parent: {n.parentId}</span>}
                          <span className="text-emerald-400">{Math.round(n.confidence * 100)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: DIALECTIC */}
            {activeTab === 'DIALECTIC' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded bg-slate-900/80 border border-white/10 space-y-1.5">
                    <div className="text-[10px] font-mono uppercase text-sky-400">
                      Thesis / Claim Node (A)
                    </div>
                    <select
                      value={selectedNodeAId}
                      onChange={e => setSelectedNodeAId(e.target.value)}
                      className="w-full bg-[#07090E] border border-white/15 rounded p-1.5 text-xs text-slate-100 outline-none font-mono"
                    >
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>
                          [{n.type}] {n.label}
                        </option>
                      ))}
                    </select>
                    {nodeA && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {nodeA.description}
                      </p>
                    )}
                  </div>

                  <div className="p-2.5 rounded bg-slate-900/80 border border-white/10 space-y-1.5">
                    <div className="text-[10px] font-mono uppercase text-rose-400">
                      Antithesis / Contradiction Node (B)
                    </div>
                    <select
                      value={selectedNodeBId}
                      onChange={e => setSelectedNodeBId(e.target.value)}
                      className="w-full bg-[#07090E] border border-white/15 rounded p-1.5 text-xs text-slate-100 outline-none font-mono"
                    >
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>
                          [{n.type}] {n.label}
                        </option>
                      ))}
                    </select>
                    {nodeB && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {nodeB.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    data-tour="btn-synthesize-tension"
                    onClick={() => {
                      if (nodeA && nodeB) {
                        onSynthesizeDialecticalResolution(nodeA, nodeB);
                      }
                    }}
                    disabled={isDialecticalLoading || !nodeA || !nodeB}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-emerald-500 text-slate-950 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>
                      {isDialecticalLoading
                        ? 'Synthesizing Bridge...'
                        : 'Synthesize Dialectical Bridge'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: AGENTS & NANOPROBE SWARM (Consolidated with Tourguide Agent) */}
            {activeTab === 'AGENTS' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Left: Autonomous Tourguide Operator */}
                <div className="lg:col-span-5 p-3 rounded bg-slate-900/80 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-sky-400" />
                      <span>Autonomous Tourguide Operator</span>
                    </span>
                    <button
                      data-tour="btn-patrol-sweep"
                      onClick={onTriggerNanoprobePatrol}
                      disabled={isPatrolling}
                      className="px-2.5 py-1 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-mono flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isPatrolling ? 'animate-spin' : ''}`} />
                      <span>{isPatrolling ? 'Scanning...' : 'Swarm Sweep'}</span>
                    </button>
                  </div>

                  <div className="p-2 rounded bg-[#07090E] border border-white/10 text-xs text-slate-300 font-mono min-h-[44px] max-h-20 overflow-y-auto">
                    {isAgentLoading ? 'Processing operator instruction...' : agentOutput}
                  </div>

                  <form onSubmit={handleAgentSubmit} className="flex gap-1.5">
                    <input
                      type="text"
                      value={agentPrompt}
                      onChange={e => setAgentPrompt(e.target.value)}
                      placeholder="Command tourguide (e.g. 'Fly to K2-18b')..."
                      className="flex-1 bg-[#07090E] border border-white/15 focus:border-sky-400 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isAgentLoading || !agentPrompt.trim()}
                      className="px-3 py-1.5 rounded bg-sky-500 text-slate-950 text-xs font-semibold hover:bg-sky-400 disabled:opacity-40 cursor-pointer"
                    >
                      Guide
                    </button>
                  </form>
                </div>

                {/* Right: Nanoprobe Swarm Dispatch Stream */}
                <div className="lg:col-span-7 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>12 Active Nanoprobes · 100% Topological Coverage</span>
                    <span className="text-amber-400">
                      {researcherDispatches.reduce((acc, d) => acc + (d.anomaliesDetected || 0), 0)}{' '}
                      Anomalies Flagged
                    </span>
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                    {researcherDispatches.map(disp => (
                      <div
                        key={disp.id}
                        className="p-2 rounded bg-slate-900/80 border border-white/10 text-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="text-sky-400">
                            {disp.probeId} · {disp.targetClusterName}
                          </span>
                          <span>
                            {disp.observedStability} · {disp.telemetrySignal} · {disp.timestamp}
                          </span>
                        </div>
                        <p className="text-slate-200 leading-snug">{disp.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: AI CO-PILOT */}
            {activeTab === 'COPILOT' && (
              <div className="space-y-2.5">
                <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                  {chatHistory.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded text-xs ${
                        msg.role === 'user'
                          ? 'bg-sky-500/15 border border-sky-500/30 text-white ml-8'
                          : 'bg-slate-900/80 border border-white/10 text-slate-200 mr-4'
                      }`}
                    >
                      <div className="text-[10px] font-mono text-sky-400 mb-0.5">
                        {msg.role === 'user' ? 'Operator' : 'Observatory Co-Pilot'}
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {msg.followUps.map((q, i) => (
                            <button
                              key={i}
                              onClick={() => onSendQuery(q)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-white/10 text-[10px] font-mono transition cursor-pointer"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleQuerySubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={queryInput}
                    onChange={e => setQueryInput(e.target.value)}
                    placeholder="Query the full knowledge graph topology..."
                    className="flex-1 bg-[#07090E] border border-white/15 focus:border-sky-400 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isQueryLoading || !queryInput.trim()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-sky-500 text-slate-950 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isQueryLoading ? 'Scanning...' : 'Ask'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 7: OPTICS, PHYSICS & VOLUMETRIC HEATMAP (Consolidated) */}
            {activeTab === 'PHYSICS' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Column 1: Force Layout & Confidence */}
                <div className="lg:col-span-4 space-y-2.5">
                  <div className="text-[11px] font-mono uppercase text-slate-400">
                    Force Topology & Layout
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Repulsion</span>
                      <span className="text-sky-400 tabular-nums">{settings.physics.repulsionStrength}</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={250}
                      value={settings.physics.repulsionStrength}
                      onChange={e =>
                        onUpdateSettings({
                          ...settings,
                          physics: {
                            ...settings.physics,
                            repulsionStrength: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-sky-400 cursor-pointer"
                    />

                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Link Distance</span>
                      <span className="text-sky-400 tabular-nums">{settings.physics.linkDistance}</span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={160}
                      value={settings.physics.linkDistance}
                      onChange={e =>
                        onUpdateSettings({
                          ...settings,
                          physics: {
                            ...settings.physics,
                            linkDistance: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-1 pt-1">
                    {(
                      [
                        ExpansionType.STABLE,
                        ExpansionType.EXPLOSIVE,
                        ExpansionType.CRYSTALLINE
                      ] as ExpansionType[]
                    ).map(mode => (
                      <button
                        key={mode}
                        onClick={() =>
                          onUpdateSettings({
                            ...settings,
                            visuals: { ...settings.visuals, expansionType: mode }
                          })
                        }
                        className={`flex-1 py-1 rounded text-[10px] font-mono border transition cursor-pointer ${
                          settings.visuals.expansionType === mode
                            ? 'bg-sky-500/15 border-sky-400 text-sky-300'
                            : 'bg-slate-900 border-white/10 text-slate-400'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 2: Volumetric Epistemic Heatmap Calibration */}
                <div className="lg:col-span-4 space-y-2.5 border-t lg:border-t-0 lg:border-l border-white/10 pt-2 lg:pt-0 lg:pl-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-slate-400">
                      Volumetric Heatmap Field
                    </span>
                    <button
                      onClick={() => updateHeatmap('enabled', !heatmapSettings.enabled)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                        heatmapSettings.enabled
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border-white/10'
                      }`}
                    >
                      {heatmapSettings.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    {(['FRICTION', 'ACTIVITY', 'COMPOSITE'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => updateHeatmap('mode', m)}
                        className={`py-1 rounded text-[10px] font-mono border cursor-pointer ${
                          heatmapSettings.mode === m
                            ? 'bg-sky-500/15 border-sky-400 text-sky-300'
                            : 'bg-slate-900 border-white/10 text-slate-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Field Gain</span>
                      <span className="text-sky-400 tabular-nums">{heatmapSettings.intensity.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="2.8"
                      step="0.05"
                      value={heatmapSettings.intensity}
                      onChange={e => updateHeatmap('intensity', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded appearance-none accent-sky-400 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    {(['SPECTRAL_FRICTION', 'THERMAL_ENERGY', 'CHRONO_NEON'] as HeatmapPalette[]).map(
                      p => {
                        const ramp = getPaletteColorRamps(p);
                        return (
                          <button
                            key={p}
                            onClick={() => updateHeatmap('palette', p)}
                            className={`p-1 rounded border cursor-pointer ${
                              heatmapSettings.palette === p
                                ? 'border-sky-400 bg-slate-800'
                                : 'border-white/10 bg-slate-900'
                            }`}
                          >
                            <div className="flex h-1.5 rounded overflow-hidden">
                              {ramp.hexStrings.map(hex => (
                                <div key={hex} className="flex-1 h-full" style={{ backgroundColor: hex }} />
                              ))}
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Column 3: Sector Filters & Detected Hotspots */}
                <div className="lg:col-span-4 space-y-2 border-t lg:border-t-0 lg:border-l border-white/10 pt-2 lg:pt-0 lg:pl-4">
                  <div className="text-[11px] font-mono uppercase text-slate-400">
                    Sectors & Heatmap Epicenters ({detectedHotspots.length})
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {clusters.map(c => {
                      const active = settings.clusterFilter.activeClusters[c.id] ?? true;
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleClusterActive(c.id)}
                          className={`px-2 py-1 rounded text-[11px] truncate border text-left transition cursor-pointer ${
                            active
                              ? 'bg-slate-900 border-white/20 text-slate-200'
                              : 'bg-slate-950 border-white/5 text-slate-600 line-through'
                          }`}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>

                  {detectedHotspots.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
                      {detectedHotspots.slice(0, 3).map(spot => (
                        <button
                          key={spot.id}
                          onClick={() => onFocusHotspot?.(spot)}
                          className={`px-2 py-1 rounded text-[10px] font-mono border whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                            selectedHotspotId === spot.id
                              ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                              : 'bg-slate-900 border-white/10 text-slate-300 hover:border-white/25'
                          }`}
                        >
                          <Crosshair className="w-2.5 h-2.5 text-rose-400" />
                          <span>{spot.label.slice(0, 18)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 8: KEYFRAMES & EXPORT SUITE */}
            {activeTab === 'SCENES' && (
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={onCaptureKeyframe}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-500 text-slate-950 text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Capture Keyframe</span>
                  </button>

                  <button
                    onClick={onExportPresentationHtml}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-white/15 text-slate-200 text-xs font-medium hover:border-sky-400/50 transition cursor-pointer"
                  >
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WebGL Player (.HTML)</span>
                  </button>

                  <button
                    onClick={onExportMarkdown}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-white/15 text-slate-200 text-xs font-medium hover:border-sky-400/50 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dossier (.MD)</span>
                  </button>

                  <button
                    onClick={onExportManifest}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-white/15 text-slate-200 text-xs font-medium hover:border-sky-400/50 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    <span>JSON Schema</span>
                  </button>
                </div>

                <div className="flex-1 flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
                  {customScenes.map(kf => (
                    <div
                      key={kf.id}
                      className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-white/10 text-xs text-slate-200 whitespace-nowrap"
                    >
                      <button
                        onClick={() => onPlayCustomScene(kf)}
                        className="hover:text-sky-400 transition cursor-pointer"
                      >
                        ▶ {kf.title} ({kf.lens})
                      </button>
                      <button
                        onClick={() => onDeleteCustomScene(kf.id)}
                        className="text-slate-500 hover:text-rose-400 ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default DirectorUI;
