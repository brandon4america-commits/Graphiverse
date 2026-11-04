import React, { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import Visualizer from './components/Visualizer';
import DirectorUI from './components/DirectorUI';
import Sidebar from './components/Sidebar';
import DataIngestionModal from './components/DataIngestionModal';
import AINavigatorOverlay from './components/AINavigatorOverlay';
import AcademicWhitepaperModal from './components/AcademicWhitepaperModal';
import BioscienceWorkbench from './components/BioscienceWorkbench';
import CosmicChatbot from './components/CosmicChatbot';
import LiveVoiceModal from './components/LiveVoiceModal';
import LyriaMusicStudio from './components/LyriaMusicStudio';
import ObservatoryVaultModal from './components/ObservatoryVaultModal';
import { ExoplanetSimulationWorkbench } from './components/ExoplanetSimulationWorkbench';
import { StellarNucleosynthesisWorkbench } from './components/StellarNucleosynthesisWorkbench';
import RelativisticMergerWorkbench from './components/RelativisticMergerWorkbench';
import { INITIAL_GRAPH_DATA, INITIAL_CUSTOM_SCENES } from './constants';
import {
  SceneManifest,
  ClusterStability,
  ViewLens,
  Node,
  NodeType,
  AppSettings,
  ExpansionType,
  PilotMode,
  GraphData,
  CustomSceneKeyframe,
  EvolutionFocus,
  EvolutionRoundResult,
  Cluster,
  SpaceWeather,
  ResearcherDispatch,
  GenerationSnapshot,
  AINavigatorState,
  NavigatorPhase,
  HeatmapSettings,
  HeatmapHotspot,
  AcademicCitation,
  LiveOpticalPhysicsParams
} from './types';
import {
  DEFAULT_OPTICAL_PHYSICS_PARAMS,
  INITIAL_WHITEPAPER_CITATIONS
} from './services/whitepaperData';
import {
  subscribeToAuth,
  subscribeUserObservatoryVault,
  StoredDiscovery,
  StoredExpedition,
  StoredChatSession,
  StoredSharedMap
} from './services/firebase';
import { User } from 'firebase/auth';
import { DEFAULT_HEATMAP_SETTINGS } from './services/heatmapEngine';
import { generatePresentationPlayerHtml } from './services/presentationExporter';
import {
  INITIAL_NAVIGATOR_STATE,
  NAVIGATOR_STEPS_FLOW,
  getElementCenter
} from './services/navigatorPilot';
import {
  generateSceneManifest,
  generateSceneAudio,
  generateMusicDrone,
  parseProjectToGraph,
  queryGraph,
  ingestGitHubRepository,
  ingestCsvToGraph,
  ingestJsonToGraph,
  runEvolutionRound,
  drillDownCluster,
  synthesizeDialecticalPair,
  generateComprehensiveDossierMarkdown,
  runResearcherPatrol
} from './services/gemini';
import {
  playNarration,
  playBackgroundScore,
  stopAllAudio,
  updateAudioSettings
} from './services/audio';

interface ChatEntry {
  id: string;
  role: 'user' | 'model';
  text: string;
  followUps?: string[];
  highlightNodeIds?: string[];
}

const App: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>(INITIAL_GRAPH_DATA);
  const graphDataRef = useRef<GraphData>(INITIAL_GRAPH_DATA);
  useEffect(() => {
    graphDataRef.current = graphData;
  }, [graphData]);

  const [activeScene, setActiveScene] = useState<SceneManifest | undefined>();
  const [nextScene, setNextScene] = useState<SceneManifest | undefined>();
  const [currentClusterIdx, setCurrentClusterIdx] = useState(0);
  const [isTouring, setIsTouring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewAngle, setViewAngle] = useState({ x: 15, y: 0 });
  const [lens, setLens] = useState<ViewLens>('ORBIT');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isIngestionModalOpen, setIsIngestionModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | undefined>();
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [cameraTargetOverride, setCameraTargetOverride] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);

  // Co-Pilot Chat
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Graphiverse Zero-Truncation Observatory online. Full-graph context is enabled across all queries, multi-file ingestion, and recursive evolution passes.',
      followUps: [
        'Where are the primary contradictions in this graph?',
        'Summarize the entire knowledge graph topology without clipping',
        'Which sector has the highest epistemic confidence?'
      ]
    }
  ]);
  const [isQueryLoading, setIsQueryLoading] = useState(false);

  // Custom Scenes
  const [customScenes, setCustomScenes] =
    useState<CustomSceneKeyframe[]>(INITIAL_CUSTOM_SCENES);

  // Recursive Evolution Engine State
  const [evolutionHistory, setEvolutionHistory] = useState<EvolutionRoundResult[]>([]);
  const [isEvolving, setIsEvolving] = useState(false);
  const [currentEvolutionRound, setCurrentEvolutionRound] = useState(0);
  const [totalEvolutionRounds, setTotalEvolutionRounds] = useState(0);
  const [evolutionFocus, setEvolutionFocus] = useState<EvolutionFocus>('FULL_EXPANSION');
  const [evolutionPulseCount, setEvolutionPulseCount] = useState(0);

  // Hierarchical Drill-Down State
  const [isDrillDownLoading, setIsDrillDownLoading] = useState(false);
  const [isDialecticalLoading, setIsDialecticalLoading] = useState(false);

  // Pillar 1: Space Weather State
  const [spaceWeather, setSpaceWeather] = useState<SpaceWeather>('QUIET_SPACE');

  // Pillar 2: Autonomous Researcher Nanoprobe Swarm
  const [researcherDispatches, setResearcherDispatches] = useState<ResearcherDispatch[]>([
    {
      id: 'disp-0',
      probeId: 'PROBE-04',
      targetClusterId: 'c-solar-system',
      targetClusterName: 'I. Solar System & Ocean Worlds',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: 'Active topology scan nominal across 6 cosmic scale sectors (Solar System to Laniakea Supercluster).',
      observedStability: ClusterStability.SETTLED,
      anomaliesDetected: 0,
      telemetrySignal: 'STABLE'
    }
  ]);
  const [isPatrolling, setIsPatrolling] = useState(false);

  // Known Universe Workbenches & Academic Whitepaper Modals
  const [isWhitepaperOpen, setIsWhitepaperOpen] = useState(false);
  const [isBioscienceOpen, setIsBioscienceOpen] = useState(false);
  const [isExoplanetSimOpen, setIsExoplanetSimOpen] = useState(false);
  const [isStellarSimOpen, setIsStellarSimOpen] = useState(false);
  const [isMergerSimOpen, setIsMergerSimOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isLyriaOpen, setIsLyriaOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  const [whitepaperCitations, setWhitepaperCitations] = useState<AcademicCitation[]>(
    INITIAL_WHITEPAPER_CITATIONS
  );
  const [opticalPhysicsParams, setOpticalPhysicsParams] = useState<LiveOpticalPhysicsParams>(
    DEFAULT_OPTICAL_PHYSICS_PARAMS
  );

  // Firebase Auth & Firestore Vault State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [vaultDiscoveries, setVaultDiscoveries] = useState<StoredDiscovery[]>([]);
  const [vaultExpeditions, setVaultExpeditions] = useState<StoredExpedition[]>([]);
  const [vaultChats, setVaultChats] = useState<StoredChatSession[]>([]);
  const [vaultSharedMaps, setVaultSharedMaps] = useState<StoredSharedMap[]>([]);

  useEffect(() => {
    let unsubVault: (() => void) | null = null;
    const unsubAuth = subscribeToAuth(user => {
      setFirebaseUser(user);
      if (unsubVault) {
        unsubVault();
        unsubVault = null;
      }
      if (user) {
        unsubVault = subscribeUserObservatoryVault(user.uid, {
          onDiscoveries: setVaultDiscoveries,
          onExpeditions: setVaultExpeditions,
          onChatSessions: setVaultChats,
          onSharedMaps: setVaultSharedMaps
        });
      } else {
        setVaultDiscoveries([]);
        setVaultExpeditions([]);
        setVaultChats([]);
      }
    });
    return () => {
      unsubAuth();
      if (unsubVault) unsubVault();
    };
  }, []);

  // Pillar 3: Temporal Playback & Lineage Snapshots
  const [generationSnapshots, setGenerationSnapshots] = useState<GenerationSnapshot[]>([
    {
      generation: 0,
      label: 'GEN-0: Foundational Baseline',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      nodes: INITIAL_GRAPH_DATA.nodes,
      links: INITIAL_GRAPH_DATA.links,
      clusters: INITIAL_GRAPH_DATA.clusters,
      summary: 'Initial untruncated epistemic baseline'
    }
  ]);
  const [temporalPlaybackGen, setTemporalPlaybackGen] = useState<number | null>(null);
  const [isPlayingTemporal, setIsPlayingTemporal] = useState(false);
  const [temporalSpeed, setTemporalSpeed] = useState<number>(1);

  // Temporal Time-Lapse Stepper Effect
  useEffect(() => {
    if (!isPlayingTemporal) return;
    const interval = setInterval(() => {
      setTemporalPlaybackGen(prev => {
        const cur = prev ?? 0;
        const nxt = cur + 1;
        if (nxt >= generationSnapshots.length) {
          setIsPlayingTemporal(false);
          return null;
        }
        return nxt;
      });
    }, Math.max(600, 2400 / temporalSpeed));

    return () => clearInterval(interval);
  }, [isPlayingTemporal, generationSnapshots.length, temporalSpeed]);

  // 3D Volumetric Epistemic Heatmap State
  const [heatmapSettings, setHeatmapSettings] = useState<HeatmapSettings>(DEFAULT_HEATMAP_SETTINGS);
  const [detectedHotspots, setDetectedHotspots] = useState<HeatmapHotspot[]>([]);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);

  const handleFocusHotspot = useCallback((hotspot: HeatmapHotspot) => {
    setSelectedHotspotId(hotspot.id);
    setCameraTargetOverride({
      x: hotspot.position.x,
      y: hotspot.position.y,
      z: hotspot.position.z
    });
    const nodeId = hotspot.id.replace('hotspot-', '');
    const foundNode = graphDataRef.current.nodes.find(n => n.id === nodeId);
    if (foundNode) {
      setSelectedNode(foundNode);
    }
  }, []);

  // Keyboard shortcut: Press 'M' to toggle Volumetric Epistemic Heatmap overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        setHeatmapSettings(prev => ({ ...prev, enabled: !prev.enabled }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [settings, setSettings] = useState<AppSettings>({
    visuals: {
      bloomIntensity: 7,
      particleDensity: 85,
      rotationSpeed: 0.38,
      expansionType: ExpansionType.STABLE
    },
    physics: {
      repulsionStrength: 110,
      linkDistance: 68,
      clusterGravity: 0.14,
      freezeLayout: false
    },
    clusterFilter: {
      activeClusters: {},
      minConfidence: 0.0,
      stabilityFilter: {
        [ClusterStability.SETTLED]: true,
        [ClusterStability.EMERGING]: true,
        [ClusterStability.CONTESTED]: true
      }
    },
    audio: {
      masterVolume: 0.85,
      musicEnabled: true,
      narrationEnabled: true,
      voiceMode: 'SINGLE'
    },
    pilotMode: PilotMode.AUTO
  });

  const handleNext = useCallback(() => {
    if (graphData.clusters.length === 0) return;
    setCurrentClusterIdx(prev => (prev + 1) % graphData.clusters.length);
  }, [graphData.clusters.length]);

  const preFetchNextScene = useCallback(
    async (idx: number, currentData: GraphData) => {
      if (currentData.clusters.length === 0) return;
      const nextIdx = (idx + 1) % currentData.clusters.length;
      const cluster = currentData.clusters[nextIdx];
      const nodes = currentData.nodes.filter(n => n.clusterId === cluster.id);

      try {
        const manifestUpdate = await generateSceneManifest(
          nodes,
          cluster.name,
          cluster.stability,
          settings.audio.voiceMode
        );
        const [droneData, narrationData] = await Promise.all([
          generateMusicDrone(manifestUpdate.musicPrompt, manifestUpdate.audioCue),
          generateSceneAudio(
            manifestUpdate.lyrics,
            manifestUpdate.audioCue.mood,
            manifestUpdate.audioCue.instrumentation,
            settings.audio.voiceMode
          )
        ]);

        const manifest: SceneManifest = {
          sceneId: `sc-${nextIdx}-${Date.now()}`,
          clusterId: cluster.id,
          title: manifestUpdate.title,
          stability: cluster.stability,
          camera: { target: cluster.center, fov: 50, duration: 14 },
          audioCue: manifestUpdate.audioCue,
          intelligence: {
            lyrics: manifestUpdate.lyrics,
            citations: Array.from(
              new Set(nodes.filter(n => n.source).map(n => n.source!))
            ),
            highlightNodes: nodes.map(n => n.id)
          },
          musicData: droneData,
          narrationData
        };
        setNextScene(manifest);
      } catch (e) {
        console.warn('Pre-fetch scene warning:', e);
      }
    },
    [settings.audio.voiceMode]
  );

  const loadScene = useCallback(
    async (idx: number) => {
      if (graphData.clusters.length === 0) return;
      const cluster = graphData.clusters[idx];
      if (!cluster) return;

      setCameraTargetOverride(cluster.center);

      if (nextScene && nextScene.clusterId === cluster.id) {
        setActiveScene(nextScene);
        setHighlightedNodeIds(nextScene.intelligence.highlightNodes);
        if (isTouring) {
          if (nextScene.musicData && settings.audio.musicEnabled) {
            await playBackgroundScore(nextScene.musicData);
          }
          if (nextScene.narrationData && settings.audio.narrationEnabled) {
            const duration = await playNarration(nextScene.narrationData, () => {
              if (settings.pilotMode === PilotMode.AUTO) {
                setTimeout(handleNext, 2500);
              }
            });
            setAudioDuration(duration);
          } else if (settings.pilotMode === PilotMode.AUTO) {
            setTimeout(handleNext, 7000);
          }
        }
        setNextScene(undefined);
        preFetchNextScene(idx, graphData);
        return;
      }

      setIsLoading(true);
      const nodes = graphData.nodes.filter(n => n.clusterId === cluster.id);

      try {
        const manifestUpdate = await generateSceneManifest(
          nodes,
          cluster.name,
          cluster.stability,
          settings.audio.voiceMode
        );
        const manifest: SceneManifest = {
          sceneId: `sc-${idx}-${Date.now()}`,
          clusterId: cluster.id,
          title: manifestUpdate.title || cluster.name,
          stability: cluster.stability,
          camera: { target: cluster.center, fov: 50, duration: 14 },
          audioCue: manifestUpdate.audioCue,
          intelligence: {
            lyrics: manifestUpdate.lyrics || [`Analyzing ${cluster.name}...`],
            citations: Array.from(
              new Set(nodes.filter(n => n.source).map(n => n.source!))
            ),
            highlightNodes: nodes.map(n => n.id)
          }
        };

        setActiveScene(manifest);
        setHighlightedNodeIds(manifest.intelligence.highlightNodes);

        if (isTouring) {
          const [droneData, narrationData] = await Promise.all([
            generateMusicDrone(manifestUpdate.musicPrompt, manifest.audioCue),
            generateSceneAudio(
              manifest.intelligence.lyrics,
              manifest.audioCue.mood,
              manifest.audioCue.instrumentation,
              settings.audio.voiceMode
            )
          ]);

          if (droneData && settings.audio.musicEnabled) {
            await playBackgroundScore(droneData);
          }
          if (narrationData && settings.audio.narrationEnabled) {
            const duration = await playNarration(narrationData, () => {
              if (settings.pilotMode === PilotMode.AUTO) {
                setTimeout(handleNext, 2500);
              }
            });
            setAudioDuration(duration);
          } else if (settings.pilotMode === PilotMode.AUTO) {
            setTimeout(handleNext, 9000);
          }
        }
        preFetchNextScene(idx, graphData);
      } catch (error) {
        if (isTouring && settings.pilotMode === PilotMode.AUTO) {
          setTimeout(handleNext, 8000);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      isTouring,
      handleNext,
      nextScene,
      preFetchNextScene,
      settings.audio,
      settings.pilotMode,
      graphData
    ]
  );

  useEffect(() => {
    if (isTouring) {
      loadScene(currentClusterIdx);
    }
  }, [isTouring, currentClusterIdx, loadScene]);

  useEffect(() => {
    updateAudioSettings(
      settings.audio.masterVolume,
      settings.audio.musicEnabled,
      settings.audio.narrationEnabled
    );
  }, [settings.audio]);

  const handleToggleTour = () => {
    const nextTourState = !isTouring;
    setIsTouring(nextTourState);
    if (nextTourState) {
      setCurrentClusterIdx(0);
      setLens('NEBULA');
    } else {
      stopAllAudio();
      setActiveScene(undefined);
      setNextScene(undefined);
      setHighlightedNodeIds([]);
    }
  };

  const handleSelectClusterIdx = (idx: number) => {
    setCurrentClusterIdx(idx);
    const cluster = graphData.clusters[idx];
    if (cluster) {
      setCameraTargetOverride(cluster.center);
      setHighlightedNodeIds(
        graphData.nodes.filter(n => n.clusterId === cluster.id).map(n => n.id)
      );
    }
    if (isTouring) {
      loadScene(idx);
    }
  };

  // Polar Wormhole Traverse (Warps camera to antipodal pole or distant sector)
  const handleWormholeTraverse = () => {
    const nextIdx = (currentClusterIdx + 2) % graphData.clusters.length;
    const targetCluster = graphData.clusters[nextIdx];
    if (targetCluster) {
      setCurrentClusterIdx(nextIdx);
      setCameraTargetOverride(targetCluster.center);
      setEvolutionPulseCount(prev => prev + 1);
    }
  };

  // Multi-Round Recursive Graph Evolution
  const executeEvolutionSequence = async (
    roundsToRun: number,
    focus: EvolutionFocus,
    targetNodeId?: string
  ) => {
    if (isEvolving) return;
    setIsEvolving(true);
    setTotalEvolutionRounds(roundsToRun);

    let workingGraph = graphDataRef.current;
    const baseRound = evolutionHistory.length;

    try {
      for (let i = 1; i <= roundsToRun; i++) {
        setCurrentEvolutionRound(i);
        const roundNum = baseRound + i;

        const result = await runEvolutionRound({
          graphData: workingGraph,
          roundNumber: roundNum,
          focus,
          targetNodeId
        });

        const updatedClusters = workingGraph.clusters.map(c => {
          const shift = result.updatedClusterStabilities.find(
            u => u.clusterId === c.id
          );
          return shift ? { ...c, stability: shift.stability } : c;
        });

        const newNodeIds = result.newNodes.map(n => n.id);
        workingGraph = {
          nodes: [...workingGraph.nodes, ...result.newNodes],
          links: [...workingGraph.links, ...result.newLinks],
          clusters: updatedClusters
        };

        setGraphData(workingGraph);
        setHighlightedNodeIds(newNodeIds);
        setEvolutionHistory(prev => [result, ...prev]);
        setEvolutionPulseCount(prev => prev + 1);

        // Snapshot evolutionary generation state for temporal playback
        const newSnapshot: GenerationSnapshot = {
          generation: roundNum,
          label: `GEN-${roundNum}: ${result.roundTitle}`,
          timestamp: result.timestamp,
          nodes: workingGraph.nodes,
          links: workingGraph.links,
          clusters: workingGraph.clusters,
          summary: result.synthesisSummary
        };
        setGenerationSnapshots(prev => [...prev, newSnapshot]);

        if (i < roundsToRun) {
          await new Promise(resolve => setTimeout(resolve, 850));
        }
      }
    } catch (error) {
      console.warn('Evolution sequence warning:', error);
    } finally {
      setIsEvolving(false);
      setCurrentEvolutionRound(0);
    }
  };

  const handleRunEvolutionRounds = (rounds: number) => {
    executeEvolutionSequence(rounds, evolutionFocus);
  };

  const handleEvolveNodeSubtree = (node: Node) => {
    executeEvolutionSequence(2, 'FULL_EXPANSION', node.id);
  };

  // Autonomous Nanoprobe Swarm Patrol Handler
  const handleTriggerNanoprobePatrol = useCallback(async () => {
    if (graphData.clusters.length === 0 || isPatrolling) return;
    setIsPatrolling(true);
    try {
      const randomCluster =
        graphData.clusters[Math.floor(Math.random() * graphData.clusters.length)];
      const clusterNodes = graphData.nodes.filter(n => n.clusterId === randomCluster.id);
      const probeNum = Math.floor(Math.random() * 12) + 1;
      const probeId = `PROBE-${probeNum < 10 ? '0' + probeNum : probeNum}`;
      const dispatch = await runResearcherPatrol(
        randomCluster,
        clusterNodes.slice(0, 8),
        probeId
      );
      setResearcherDispatches(prev => [dispatch, ...prev].slice(0, 30));
    } catch (e) {
      console.warn('Nanoprobe patrol dispatch error:', e);
    } finally {
      setIsPatrolling(false);
    }
  }, [graphData.clusters, graphData.nodes, isPatrolling]);

  // Periodic autonomous background patrol every 28 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isEvolving && !isLoading && graphData.clusters.length > 0) {
        handleTriggerNanoprobePatrol();
      }
    }, 28000);
    return () => clearInterval(timer);
  }, [handleTriggerNanoprobePatrol, isEvolving, isLoading, graphData.clusters.length]);

  // Hierarchical Cluster Drill-Down
  const handleDrillDownCluster = async (cluster: Cluster) => {
    setIsDrillDownLoading(true);
    try {
      const res = await drillDownCluster(cluster, graphData);
      setGraphData(prev => ({
        ...prev,
        clusters: [...prev.clusters, ...res.subClusters],
        nodes: [...prev.nodes, ...res.subNodes],
        links: [...prev.links, ...res.subLinks]
      }));
      setHighlightedNodeIds(res.subNodes.map(n => n.id));
      if (res.subClusters.length > 0) {
        setCameraTargetOverride(res.subClusters[0].center);
      }
      setEvolutionPulseCount(prev => prev + 1);
    } catch (error) {
      console.warn('Drill down error:', error);
    } finally {
      setIsDrillDownLoading(false);
    }
  };

  // Dialectical Resolution Synthesis
  const handleSynthesizeDialecticalResolution = async (nodeA: Node, nodeB: Node) => {
    setIsDialecticalLoading(true);
    try {
      const res = await synthesizeDialecticalPair(nodeA, nodeB);
      const resolvingNode: Node = {
        id: `res-${Date.now()}`,
        label: res.resolvingNode.label,
        type: res.resolvingNode.type as NodeType,
        clusterId: nodeA.clusterId,
        val: 20,
        confidence: res.resolvingNode.confidence || 0.9,
        source: res.resolvingNode.source || 'Dialectical Synthesis Engine',
        description: `${res.tensionDescription}\n\nReconciling Principle: ${res.reconcilingHypothesis}`,
        generation: Math.max(nodeA.generation || 0, nodeB.generation || 0) + 1
      };

      const resolvingLinks = [
        {
          source: resolvingNode.id,
          target: nodeA.id,
          strength: 0.88,
          relation: 'BRIDGE' as const
        },
        {
          source: resolvingNode.id,
          target: nodeB.id,
          strength: 0.88,
          relation: 'BRIDGE' as const
        }
      ];

      setGraphData(prev => ({
        ...prev,
        nodes: [...prev.nodes, resolvingNode],
        links: [...prev.links, ...resolvingLinks]
      }));
      setSelectedNode(resolvingNode);
      setHighlightedNodeIds([resolvingNode.id, nodeA.id, nodeB.id]);
      setEvolutionPulseCount(prev => prev + 1);
    } catch (error) {
      console.warn('Dialectical synthesis error:', error);
    } finally {
      setIsDialecticalLoading(false);
    }
  };

  // Pillar 4: Autonomous AI-UI-Navigator Intelligence Demonstration Mode
  const [navigatorState, setNavigatorState] = useState<AINavigatorState>(INITIAL_NAVIGATOR_STATE);
  const navigatorStepIdxRef = useRef<number>(0);
  const lastUserMousePosRef = useRef<{ x: number; y: number } | null>(null);

  const handleToggleNavigator = useCallback(() => {
    setNavigatorState(prev => {
      const willBeActive = !prev.isActive;
      navigatorStepIdxRef.current = 0;
      return {
        ...prev,
        isActive: willBeActive,
        isPaused: false,
        isHumanInterrupted: false,
        currentStep: NAVIGATOR_STEPS_FLOW[0]
      };
    });
  }, []);

  const handleStopNavigator = useCallback(() => {
    setNavigatorState(prev => ({
      ...prev,
      isActive: false,
      isHumanInterrupted: false
    }));
  }, []);

  const handleResumeNavigator = useCallback(() => {
    setNavigatorState(prev => ({
      ...prev,
      isActive: true,
      isPaused: false,
      isHumanInterrupted: false
    }));
  }, []);

  const handleToggleNavigatorPause = useCallback(() => {
    setNavigatorState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const handleCycleNavigatorSpeed = useCallback(() => {
    setNavigatorState(prev => {
      const nextSpeed = prev.speedMultiplier === 1 ? 1.5 : prev.speedMultiplier === 1.5 ? 2 : 1;
      return { ...prev, speedMultiplier: nextSpeed };
    });
  }, []);

  // Human Takeover & Shortcut Monitor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!navigatorState.isActive) {
        lastUserMousePosRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
      if (lastUserMousePosRef.current) {
        const dx = e.clientX - lastUserMousePosRef.current.x;
        const dy = e.clientY - lastUserMousePosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 38) {
          setNavigatorState(prev => ({
            ...prev,
            isActive: false,
            isHumanInterrupted: true
          }));
        }
      }
      lastUserMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNavigatorState(prev => {
          if (prev.isActive || prev.isHumanInterrupted) {
            return { ...prev, isActive: false, isHumanInterrupted: false };
          }
          return prev;
        });
      }
      if (e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        handleToggleNavigator();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigatorState.isActive, handleToggleNavigator]);

  // Actual Functional Execution of Navigator Demonstration Phases
  const executeNavigatorAction = useCallback((phase: NavigatorPhase) => {
    switch (phase) {
      case 'SECTOR_INSPECTION': {
        if (graphData.clusters.length > 0) {
          const nextIdx = (currentClusterIdx + 1) % graphData.clusters.length;
          handleSelectClusterIdx(nextIdx);
        }
        break;
      }
      case 'DIALECTICAL_TENSION': {
        const dialecticTab = document.querySelector('[data-tour="dock-tab-dialectic"]') as HTMLElement;
        if (dialecticTab) dialecticTab.click();
        break;
      }
      case 'DIALECTICAL_SYNTHESIS': {
        const synthBtn = document.querySelector('[data-tour="btn-synthesize-tension"]') as HTMLElement;
        if (synthBtn && !synthBtn.hasAttribute('disabled')) {
          synthBtn.click();
        } else {
          const claim = graphData.nodes.find(n => n.type === NodeType.CLAIM) || graphData.nodes[0];
          const contra = graphData.nodes.find(n => n.type === NodeType.CONTRADICTION) || graphData.nodes[1];
          if (claim && contra) {
            handleSynthesizeDialecticalResolution(claim, contra);
          }
        }
        break;
      }
      case 'WEATHER_MODULATION': {
        const weatherBtn = document.querySelector('[data-tour="weather-cycle"]') as HTMLElement;
        if (weatherBtn) {
          weatherBtn.click();
        } else {
          const weathers: SpaceWeather[] = ['QUIET_SPACE', 'SOLAR_FLARE', 'COSMIC_RAY_STORM', 'GRAVITATIONAL_SURGE'];
          const nxt = (weathers.indexOf(spaceWeather) + 1) % weathers.length;
          setSpaceWeather(weathers[nxt]);
        }
        break;
      }
      case 'NANOPROBE_SWARM': {
        const agentsTab = document.querySelector('[data-tour="dock-tab-agents"]') as HTMLElement;
        if (agentsTab) agentsTab.click();
        setTimeout(() => {
          const scanBtn = document.querySelector('[data-tour="btn-patrol-sweep"]') as HTMLElement;
          if (scanBtn) scanBtn.click();
          else handleTriggerNanoprobePatrol();
        }, 150);
        break;
      }
      case 'TEMPORAL_LINEAGE': {
        const lineageTab = document.querySelector('[data-tour="dock-tab-lineage"]') as HTMLElement;
        if (lineageTab) lineageTab.click();
        if (generationSnapshots.length > 1) {
          setTemporalPlaybackGen(0);
          setTimeout(() => {
            setTemporalPlaybackGen(null);
          }, 1500);
        }
        break;
      }
      case 'TOPOLOGY_EVOLUTION': {
        if (!isEvolving) {
          handleRunEvolutionRounds(1);
        }
        break;
      }
      case 'DOSSIER_AUDIT': {
        setIsSidebarOpen(true);
        if (graphData.nodes.length > 0) {
          const randomNode = graphData.nodes[Math.floor(Math.random() * Math.min(8, graphData.nodes.length))];
          setSelectedNode(randomNode);
        }
        break;
      }
    }
  }, [
    graphData.clusters,
    graphData.nodes,
    currentClusterIdx,
    handleSelectClusterIdx,
    handleSynthesizeDialecticalResolution,
    spaceWeather,
    handleTriggerNanoprobePatrol,
    generationSnapshots.length,
    isEvolving,
    handleRunEvolutionRounds
  ]);

  // Autonomous Kinematics and Step Sequencer
  useEffect(() => {
    if (!navigatorState.isActive || navigatorState.isPaused) return;

    let isCancelled = false;
    const speed = navigatorState.speedMultiplier;
    const currentStepConfig = NAVIGATOR_STEPS_FLOW[navigatorStepIdxRef.current];

    const targetCoord = getElementCenter(currentStepConfig.selector) ||
      (currentStepConfig.fallbackPos
        ? currentStepConfig.fallbackPos(window.innerWidth, window.innerHeight)
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 });

    const startTime = performance.now();
    const duration = Math.max(380, 850 / speed);
    const startX = navigatorState.cursorPos.x;
    const startY = navigatorState.cursorPos.y;

    const animateCursor = (currentTime: number) => {
      if (isCancelled) return;
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease in-out cubic
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const curX = startX + (targetCoord.x - startX) * ease;
      const curY = startY + (targetCoord.y - startY) * ease;

      setNavigatorState(prev => ({
        ...prev,
        cursorPos: { x: curX, y: curY },
        targetPos: targetCoord,
        currentStep: {
          ...currentStepConfig,
          totalSteps: NAVIGATOR_STEPS_FLOW.length
        }
      }));

      if (progress < 1) {
        requestAnimationFrame(animateCursor);
      } else {
        // Dwell at target, then click
        setTimeout(() => {
          if (isCancelled) return;
          setNavigatorState(prev => ({ ...prev, isClicking: true }));

          executeNavigatorAction(currentStepConfig.phase);

          setTimeout(() => {
            if (isCancelled) return;
            setNavigatorState(prev => ({ ...prev, isClicking: false }));

            // Dwell on completed state before advancing
            const dwellTime = Math.max(900, 2400 / speed);
            setTimeout(() => {
              if (isCancelled) return;
              const nextIdx = (navigatorStepIdxRef.current + 1) % NAVIGATOR_STEPS_FLOW.length;
              if (nextIdx === 0) {
                setNavigatorState(prev => ({ ...prev, cycleCount: prev.cycleCount + 1 }));
              }
              navigatorStepIdxRef.current = nextIdx;
              setNavigatorState(prev => ({
                ...prev,
                currentStep: {
                  ...NAVIGATOR_STEPS_FLOW[nextIdx],
                  totalSteps: NAVIGATOR_STEPS_FLOW.length
                }
              }));
            }, dwellTime);
          }, 240);
        }, Math.max(160, 420 / speed));
      }
    };

    const animId = requestAnimationFrame(animateCursor);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animId);
    };
  }, [
    navigatorState.isActive,
    navigatorState.isPaused,
    navigatorState.speedMultiplier,
    navigatorState.cycleCount,
    executeNavigatorAction
  ]);

  // Co-Pilot Query
  const handleSendQuery = async (query: string) => {
    const userMsg: ChatEntry = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: query
    };
    setChatHistory(prev => [...prev, userMsg]);
    setIsQueryLoading(true);

    try {
      const historyPayload = chatHistory.map(m => ({
        role: m.role,
        text: m.text
      }));
      const res = await queryGraph(query, graphData, historyPayload);

      const aiMsg: ChatEntry = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: res.answer,
        followUps: res.suggestedFollowUps,
        highlightNodeIds: res.highlightNodeIds
      };
      setChatHistory(prev => [...prev, aiMsg]);

      if (res.highlightNodeIds && res.highlightNodeIds.length > 0) {
        setHighlightedNodeIds(res.highlightNodeIds);
      }

      if (res.targetClusterId) {
        const targetCluster = graphData.clusters.find(
          c => c.id === res.targetClusterId
        );
        if (targetCluster) {
          setCameraTargetOverride(targetCluster.center);
        }
      }
    } catch (error) {
      setChatHistory(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: 'Telemetry query encountered a transient link anomaly. Please try again.'
        }
      ]);
    } finally {
      setIsQueryLoading(false);
    }
  };

  // Ingestion Handlers
  const applyNewGraph = (newGraph: GraphData) => {
    if (newGraph.nodes.length > 0 && newGraph.clusters.length > 0) {
      stopAllAudio();
      setIsTouring(false);
      setGraphData(newGraph);
      setSelectedNode(undefined);
      setCurrentClusterIdx(0);
      setCameraTargetOverride(newGraph.clusters[0].center);
      setHighlightedNodeIds([]);
      setEvolutionPulseCount(prev => prev + 1);

      setGenerationSnapshots(prev => [
        ...prev,
        {
          generation: prev.length,
          label: `GEN-${prev.length}: Ingestion Inflow`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          nodes: newGraph.nodes,
          links: newGraph.links,
          clusters: newGraph.clusters,
          summary: `Direct ingestion of ${newGraph.nodes.length} untruncated nodes across ${newGraph.clusters.length} sectors`
        }
      ]);
    }
  };

  const handleIngestZip = async (file: File) => {
    setIsLoading(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const fileList: string[] = [];
      const snippets: string[] = [];
      const textExtensions = [
        '.json',
        '.ts',
        '.tsx',
        '.js',
        '.md',
        '.txt',
        '.py',
        '.csv',
        '.yaml',
        '.yml'
      ];

      for (const filename of Object.keys(zip.files)) {
        const fileObj = zip.files[filename];
        if (!fileObj.dir) {
          fileList.push(filename);
          const isText = textExtensions.some(ext =>
            filename.toLowerCase().endsWith(ext)
          );
          if (isText && snippets.length < 24) {
            const content = await fileObj.async('string');
            snippets.push(`FILE: ${filename}\nCONTENT: ${content.slice(0, 2500)}`);
          }
        }
      }
      const newGraph = await parseProjectToGraph(fileList, snippets);
      applyNewGraph(newGraph);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngestGitHub = async (repoUrl: string) => {
    setIsLoading(true);
    try {
      const newGraph = await ingestGitHubRepository(repoUrl);
      applyNewGraph(newGraph);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngestCsv = async (csvText: string) => {
    setIsLoading(true);
    try {
      const newGraph = await ingestCsvToGraph(csvText);
      applyNewGraph(newGraph);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIngestJson = async (jsonText: string) => {
    setIsLoading(true);
    try {
      const newGraph = await ingestJsonToGraph(jsonText);
      applyNewGraph(newGraph);
    } finally {
      setIsLoading(false);
    }
  };

  // Node Selection & Updates
  const handleSelectNode = (node: Node) => {
    setSelectedNode(node);
    setIsSidebarOpen(true);
    const cluster = graphData.clusters.find(c => c.id === node.clusterId);
    if (node.x !== undefined && node.y !== undefined && node.z !== undefined) {
      setCameraTargetOverride({ x: node.x, y: node.y, z: node.z });
    } else if (cluster) {
      setCameraTargetOverride(cluster.center);
    }
  };

  const handleAgentCommand = (command: string) => {
    const nodes = graphDataRef.current.nodes;
    const targetNode = nodes.find(n => command.toLowerCase().includes(n.label.toLowerCase()));
    if (targetNode) {
      handleSelectNode(targetNode);
    }
  };

  const handleUpdateNode = (updatedNode: Node) => {
    setGraphData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => (n.id === updatedNode.id ? updatedNode : n))
    }));
    setSelectedNode(updatedNode);
  };


  const handleGraftChildNodes = (
    parentNode: Node,
    children: {
      label: string;
      type: NodeType;
      description: string;
      confidence: number;
      source: string;
      val: number;
    }[]
  ) => {
    const createdNodes: Node[] = children.map((child, idx) => ({
      id: `graft-${Date.now()}-${idx}`,
      label: child.label,
      type: child.type,
      clusterId: parentNode.clusterId,
      val: child.val || 14,
      confidence: child.confidence || 0.85,
      source: child.source || parentNode.source || 'AI Deep-Dive Synthesis',
      description: child.description,
      generation: (parentNode.generation || 0) + 1,
      parentId: parentNode.id
    }));

    const createdLinks = createdNodes.map(cn => ({
      source: parentNode.id,
      target: cn.id,
      strength: 0.85,
      relation:
        cn.type === NodeType.CONTRADICTION
          ? ('CONTRADICTS' as const)
          : ('SUPPORTS' as const)
    }));

    setGraphData(prev => ({
      ...prev,
      nodes: [...prev.nodes, ...createdNodes],
      links: [...prev.links, ...createdLinks]
    }));
    setHighlightedNodeIds(createdNodes.map(n => n.id));
    setEvolutionPulseCount(prev => prev + 1);
  };

  // Custom Scenes & Exports
  const handleCaptureKeyframe = () => {
    const cluster = graphData.clusters[currentClusterIdx] || graphData.clusters[0];
    const newKf: CustomSceneKeyframe = {
      id: `kf-${Date.now()}`,
      title: `${cluster?.name || 'Sector'} Snapshot #${customScenes.length + 1}`,
      clusterId: cluster?.id || 'c-orbital-mesh',
      cameraTarget: cameraTargetOverride || cluster?.center || { x: 0, y: 0, z: 0 },
      lens,
      voiceMode: settings.audio.voiceMode,
      notes: `Captured with ${graphData.nodes.length} nodes active.`
    };
    setCustomScenes(prev => [...prev, newKf]);
  };

  const handlePlayCustomScene = (kf: CustomSceneKeyframe) => {
    setLens(kf.lens);
    setCameraTargetOverride(kf.cameraTarget);
    const idx = graphData.clusters.findIndex(c => c.id === kf.clusterId);
    if (idx >= 0) setCurrentClusterIdx(idx);
  };

  const handleDeleteCustomScene = (id: string) => {
    setCustomScenes(prev => prev.filter(s => s.id !== id));
  };

  const handleExportManifest = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      graphSummary: {
        nodeCount: graphData.nodes.length,
        linkCount: graphData.links.length,
        clusterCount: graphData.clusters.length,
        evolutionGenerations: evolutionHistory.length
      },
      customScenes,
      evolutionHistory,
      graphData
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphiverse-manifest-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const mdContent = generateComprehensiveDossierMarkdown(graphData, evolutionHistory);
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphiverse-epistemic-dossier-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPresentationHtml = () => {
    const htmlContent = generatePresentationPlayerHtml(
      graphData,
      customScenes,
      'Graphiverse Cinematic Interactive Presentation'
    );
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphiverse-standalone-presentation-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Radar Metrics for AUDIT Lens
  const avgConfidence =
    graphData.nodes.reduce((acc, n) => acc + n.confidence, 0) /
    Math.max(1, graphData.nodes.length);
  const evidenceRatio =
    graphData.nodes.filter(n => n.type === NodeType.EVIDENCE).length /
    Math.max(1, graphData.nodes.length);
  const bridgeDensity =
    graphData.links.filter(l => l.relation === 'BRIDGE').length /
    Math.max(1, graphData.links.length);
  const contradictionTension =
    graphData.nodes.filter(n => n.type === NodeType.CONTRADICTION).length /
    Math.max(1, graphData.nodes.length);
  const settledRatio =
    graphData.clusters.filter(c => c.stability === ClusterStability.SETTLED).length /
    Math.max(1, graphData.clusters.length);
  const evolutionDepth = Math.min(1, evolutionHistory.length / 4);

  const radarAxes = [
    { label: 'CONFIDENCE', value: Math.max(0.25, avgConfidence) },
    { label: 'EMPIRICAL', value: Math.min(1, 0.35 + evidenceRatio * 1.8) },
    { label: 'BRIDGES', value: Math.min(1, 0.3 + bridgeDensity * 2.2) },
    { label: 'DIALECTIC', value: Math.min(1, 0.35 + contradictionTension * 2.5) },
    { label: 'CONSENSUS', value: Math.max(0.3, settledRatio) },
    { label: 'EVOLUTION', value: Math.max(0.25, evolutionDepth) }
  ];

  const radarPoints = radarAxes
    .map((axis, i) => {
      const angle = (Math.PI * 2 * i) / radarAxes.length - Math.PI / 2;
      const r = axis.value * 72;
      return `${100 + Math.cos(angle) * r},${100 + Math.sin(angle) * r}`;
    })
    .join(' ');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07090E] text-slate-100 select-none">
      <Visualizer
        nodes={graphData.nodes}
        links={graphData.links}
        clusters={graphData.clusters}
        activeScene={activeScene}
        viewAngle={viewAngle}
        lens={lens}
        visualSettings={settings.visuals}
        physicsSettings={settings.physics}
        clusterFilter={settings.clusterFilter}
        onSelectNode={handleSelectNode}
        selectedNode={selectedNode}
        highlightedNodeIds={highlightedNodeIds}
        cameraTargetOverride={cameraTargetOverride}
        evolutionPulseCount={evolutionPulseCount}
        onWormholeTraverse={handleWormholeTraverse}
        spaceWeather={spaceWeather}
        temporalPlaybackGen={temporalPlaybackGen}
        heatmapSettings={heatmapSettings}
        onSelectHotspot={handleFocusHotspot}
        onHotspotsDetected={setDetectedHotspots}
      />

      {/* Epistemic Audit Dossier Overlay */}
      {lens === 'AUDIT' && (
        <div className="pointer-events-auto fixed inset-x-4 sm:inset-x-6 top-16 bottom-20 z-20 hud-panel rounded-lg p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="text-xs font-mono text-sky-400">
                  Epistemic Audit Dossier · Zero-Truncation Topology
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-semibold text-slate-100 mt-0.5">
                  Full Spatial Topology & Autonomous Evolution Ledger
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportMarkdown}
                  className="px-3 py-1.5 rounded bg-slate-900 border border-white/15 text-slate-200 hover:border-sky-400/50 text-xs font-medium cursor-pointer"
                >
                  Export Markdown (.MD)
                </button>
                <button
                  onClick={handleExportManifest}
                  className="px-3 py-1.5 rounded bg-slate-900 border border-white/15 text-slate-200 hover:border-sky-400/50 text-xs font-medium cursor-pointer"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => setLens('ORBIT')}
                  className="px-3.5 py-1.5 rounded bg-sky-500 text-slate-950 text-xs font-semibold hover:bg-sky-400 cursor-pointer"
                >
                  Return to 3D Orbit
                </button>
              </div>
            </div>

            {/* KPI Cards & Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-md bg-slate-900/75 border border-white/10">
                  <div className="text-[11px] font-mono text-slate-400">Active Nodes</div>
                  <div className="text-2xl font-display font-semibold text-sky-400 mt-1 tabular-nums">
                    {graphData.nodes.length}
                  </div>
                </div>
                <div className="p-3.5 rounded-md bg-slate-900/75 border border-white/10">
                  <div className="text-[11px] font-mono text-slate-400">Synaptic Links</div>
                  <div className="text-2xl font-display font-semibold text-emerald-400 mt-1 tabular-nums">
                    {graphData.links.length}
                  </div>
                </div>
                <div className="p-3.5 rounded-md bg-slate-900/75 border border-white/10">
                  <div className="text-[11px] font-mono text-slate-400">Contradictions</div>
                  <div className="text-2xl font-display font-semibold text-rose-400 mt-1 tabular-nums">
                    {graphData.nodes.filter(n => n.type === NodeType.CONTRADICTION).length}
                  </div>
                </div>
                <div className="p-3.5 rounded-md bg-slate-900/75 border border-white/10">
                  <div className="text-[11px] font-mono text-slate-400">Evolution Passes</div>
                  <div className="text-2xl font-display font-semibold text-amber-400 mt-1 tabular-nums">
                    {evolutionHistory.length}
                  </div>
                </div>

                {/* Cluster Stability Matrix */}
                <div className="col-span-2 sm:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {graphData.clusters.map(c => (
                    <div
                      key={c.id}
                      className="p-3 rounded-md bg-slate-900/75 border border-white/10 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-100 truncate">
                          {c.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                          {graphData.nodes.filter(n => n.clusterId === c.id).length} Nodes · {c.stability}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6-Axis Epistemic Radar Chart */}
              <div className="lg:col-span-5 p-4 rounded-md bg-slate-900/75 border border-white/10 flex flex-col items-center">
                <div className="text-[11px] font-mono text-slate-400 mb-2">
                  6-Axis Epistemic Calibration Radar
                </div>
                <svg viewBox="0 0 200 200" className="w-48 h-48 overflow-visible">
                  {[24, 48, 72].map(r => (
                    <circle
                      key={r}
                      cx="100"
                      cy="100"
                      r={r}
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.2)"
                      strokeDasharray="2 2"
                    />
                  ))}
                  {radarAxes.map((axis, i) => {
                    const angle = (Math.PI * 2 * i) / radarAxes.length - Math.PI / 2;
                    const x2 = 100 + Math.cos(angle) * 76;
                    const y2 = 100 + Math.sin(angle) * 76;
                    const lx = 100 + Math.cos(angle) * 94;
                    const ly = 100 + Math.sin(angle) * 94;
                    return (
                      <g key={axis.label}>
                        <line
                          x1="100"
                          y1="100"
                          x2={x2}
                          y2={y2}
                          stroke="rgba(255, 255, 255, 0.12)"
                        />
                        <text
                          x={lx}
                          y={ly}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#94A3B8"
                          fontSize="7"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {axis.label}
                        </text>
                      </g>
                    );
                  })}
                  <polygon
                    points={radarPoints}
                    fill="rgba(56, 189, 248, 0.2)"
                    stroke="#38BDF8"
                    strokeWidth="1.75"
                  />
                </svg>
              </div>
            </div>

            {/* Zero-Truncation Node Registry Table */}
            <div className="space-y-3">
              <div className="text-xs font-mono text-slate-400">
                Complete Node Registry ({graphData.nodes.length} Active Entries)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {graphData.nodes.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      handleSelectNode(n);
                      setLens('ORBIT');
                    }}
                    className="p-3.5 rounded-md bg-slate-900/75 border border-white/10 hover:border-sky-400/50 transition cursor-pointer flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                        <span>
                          <strong className="text-sky-400 font-normal">{n.type}</strong> · {n.source || 'Telemetry'}
                          {(n.generation || 0) > 0 ? ` · Gen-${n.generation}` : ''}
                        </span>
                        <span className="text-emerald-400">
                          {Math.round(n.confidence * 100)}%
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-100 mt-1">
                        {n.label}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {n.description}
                      </p>
                    </div>

                    {n.citations && n.citations.length > 0 && (
                      <div className="pt-2 border-t border-white/10 text-[10px] font-mono text-sky-300">
                        {n.citations.join(' · ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Top Bar & Collapsible Bottom Dock */}
      <DirectorUI
        activeScene={activeScene}
        isTouring={isTouring}
        isLoading={isLoading}
        onToggleTour={handleToggleTour}
        onNext={handleNext}
        currentLens={lens}
        onLensChange={setLens}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
        settings={settings}
        onUpdateSettings={setSettings}
        onOpenIngestionModal={() => setIsIngestionModalOpen(true)}
        audioDuration={audioDuration}
        clusters={graphData.clusters}
        currentClusterIdx={currentClusterIdx}
        onSelectClusterIdx={handleSelectClusterIdx}
        chatHistory={chatHistory}
        onSendQuery={handleSendQuery}
        isQueryLoading={isQueryLoading}
        customScenes={customScenes}
        onCaptureKeyframe={handleCaptureKeyframe}
        onPlayCustomScene={handlePlayCustomScene}
        onDeleteCustomScene={handleDeleteCustomScene}
        onExportManifest={handleExportManifest}
        onExportMarkdown={handleExportMarkdown}
        onExportPresentationHtml={handleExportPresentationHtml}
        evolutionHistory={evolutionHistory}
        isEvolving={isEvolving}
        currentEvolutionRound={currentEvolutionRound}
        totalEvolutionRounds={totalEvolutionRounds}
        evolutionFocus={evolutionFocus}
        onChangeEvolutionFocus={setEvolutionFocus}
        onRunEvolutionRounds={handleRunEvolutionRounds}
        nodes={graphData.nodes}
        onSelectNode={handleSelectNode}
        onSynthesizeDialecticalResolution={handleSynthesizeDialecticalResolution}
        isDialecticalLoading={isDialecticalLoading}
        spaceWeather={spaceWeather}
        onChangeSpaceWeather={setSpaceWeather}
        generationSnapshots={generationSnapshots}
        temporalPlaybackGen={temporalPlaybackGen}
        onSetTemporalPlaybackGen={setTemporalPlaybackGen}
        isPlayingTemporal={isPlayingTemporal}
        onTogglePlayTemporal={() => setIsPlayingTemporal(prev => !prev)}
        temporalSpeed={temporalSpeed}
        onChangeTemporalSpeed={setTemporalSpeed}
        researcherDispatches={researcherDispatches}
        isPatrolling={isPatrolling}
        onTriggerNanoprobePatrol={handleTriggerNanoprobePatrol}
        isNavigatorActive={navigatorState.isActive}
        onToggleNavigator={handleToggleNavigator}
        onOpenWhitepaper={() => setIsWhitepaperOpen(true)}
        onOpenBioscience={() => setIsBioscienceOpen(true)}
        onOpenExoplanetSim={() => setIsExoplanetSimOpen(true)}
        onOpenStellarSim={() => setIsStellarSimOpen(true)}
        onOpenMergerSim={() => setIsMergerSimOpen(true)}
        onOpenChatbot={() => setIsChatbotOpen(true)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onOpenLyriaStudio={() => setIsLyriaOpen(true)}
        onOpenVault={() => setIsVaultOpen(true)}
        isAuthenticated={Boolean(firebaseUser)}
        heatmapSettings={heatmapSettings}
        onUpdateHeatmapSettings={setHeatmapSettings}
        detectedHotspots={detectedHotspots}
        onFocusHotspot={handleFocusHotspot}
        selectedHotspotId={selectedHotspotId}
        onAgentCommand={handleAgentCommand}
        onWormholeTraverse={handleWormholeTraverse}
      />

      {/* Slide-Over Node Inspector Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        nodes={graphData.nodes}
        graphData={graphData}
        selectedNode={selectedNode}
        onSelectNode={handleSelectNode}
        onUpdateNode={handleUpdateNode}
        onGraftChildNodes={handleGraftChildNodes}
        onEvolveNodeSubtree={handleEvolveNodeSubtree}
        onDrillDownCluster={handleDrillDownCluster}
        isEvolving={isEvolving}
        isDrillDownLoading={isDrillDownLoading}
        onOpenBioscienceLab={node => {
          setSelectedNode(node);
          setIsBioscienceOpen(true);
        }}
      />

      {/* Multi-Source Ingestion Modal */}
      <DataIngestionModal
        isOpen={isIngestionModalOpen}
        onClose={() => setIsIngestionModalOpen(false)}
        isLoading={isLoading}
        onIngestZip={handleIngestZip}
        onIngestGitHub={handleIngestGitHub}
        onIngestCsv={handleIngestCsv}
        onIngestJson={handleIngestJson}
      />

      {/* 1. Academic Whitepaper & LaTeX Publication Suite */}
      <AcademicWhitepaperModal
        isOpen={isWhitepaperOpen}
        onClose={() => setIsWhitepaperOpen(false)}
        graphData={graphData}
        citations={whitepaperCitations}
        onAddCitation={cit =>
          setWhitepaperCitations(prev =>
            prev.some(c => c.title === cit.title) ? prev : [...prev, cit]
          )
        }
        physicsParams={opticalPhysicsParams}
        onUpdatePhysicsParams={params => {
          setOpticalPhysicsParams(params);
          setSettings(prev => ({
            ...prev,
            visuals: {
              ...prev.visuals,
              bloomIntensity: Math.round(params.anamorphicStreakGain * 8),
              dispersionCauchyB: params.cauchyB,
              thinFilmThicknessNm: params.thinFilmThicknessNm,
              mieAnisotropyG: params.mieAnisotropyG,
              anamorphicFlareIntensity: params.anamorphicStreakGain
            }
          }));
        }}
        onJumpToFigureTarget={(clusterId, nodeId) => {
          const idx = graphData.clusters.findIndex(c => c.id === clusterId);
          if (idx >= 0) handleSelectClusterIdx(idx);
          if (nodeId) {
            const targetNode = graphData.nodes.find(n => n.id === nodeId);
            if (targetNode) handleSelectNode(targetNode);
          }
        }}
      />

      {/* 2. Federated Astrobiology & Molecular Bioinformatics Workbench */}
      <BioscienceWorkbench
        isOpen={isBioscienceOpen}
        onClose={() => setIsBioscienceOpen(false)}
        selectedNode={selectedNode}
        onCiteInWhitepaper={cit =>
          setWhitepaperCitations(prev =>
            prev.some(c => c.title === cit.title) ? prev : [...prev, cit]
          )
        }
      />

      {/* Advanced Astrobiology Exoplanet Simulation Workbench */}
      <ExoplanetSimulationWorkbench
        isOpen={isExoplanetSimOpen}
        onClose={() => setIsExoplanetSimOpen(false)}
        user={firebaseUser}
        onAddDiscoveryToAtlas={newNode => {
          setGraphData(prev => ({
            ...prev,
            nodes: [...prev.nodes, newNode]
          }));
          setSelectedNode(newNode);
          setEvolutionPulseCount(prev => prev + 1);
        }}
      />

      {/* Stellar Evolution & Nucleosynthesis Time-Domain Simulator */}
      <StellarNucleosynthesisWorkbench
        isOpen={isStellarSimOpen}
        onClose={() => setIsStellarSimOpen(false)}
        user={firebaseUser}
        nodes={graphData.nodes}
        clusters={graphData.clusters}
        onSelectAtlasNode={node => {
          handleSelectNode(node);
          setLens('ORBIT');
        }}
        onFocusAtlasCluster={clusterId => {
          const idx = graphData.clusters.findIndex(c => c.id === clusterId);
          if (idx >= 0) handleSelectClusterIdx(idx);
          setLens('ORBIT');
        }}
        onAddDiscoveryToAtlas={newNode => {
          setGraphData(prev => ({
            ...prev,
            nodes: [...prev.nodes, newNode]
          }));
          setSelectedNode(newNode);
          setEvolutionPulseCount(prev => prev + 1);
        }}
        onOpenMergerLab={() => {
          setIsStellarSimOpen(false);
          setIsMergerSimOpen(true);
        }}
      />

      {/* Relativistic Black Hole & Gravitational-Wave Merger Lab */}
      <RelativisticMergerWorkbench
        isOpen={isMergerSimOpen}
        onClose={() => setIsMergerSimOpen(false)}
        user={firebaseUser}
        nodes={graphData.nodes}
        clusters={graphData.clusters}
        onSelectAtlasNode={node => {
          handleSelectNode(node);
          setLens('ORBIT');
        }}
        onFocusAtlasCluster={clusterId => {
          const idx = graphData.clusters.findIndex(c => c.id === clusterId);
          if (idx >= 0) handleSelectClusterIdx(idx);
          setLens('ORBIT');
        }}
        onAddDiscoveryToAtlas={newNode => {
          setGraphData(prev => ({
            ...prev,
            nodes: [...prev.nodes, newNode]
          }));
          setSelectedNode(newNode);
          setEvolutionPulseCount(prev => prev + 1);
        }}
      />

      {/* 3. Multi-Turn Gemini Research Console & Search Grounding */}
      <CosmicChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        graphData={graphData}
        isAuthenticated={Boolean(firebaseUser)}
        onCiteInWhitepaper={cit =>
          setWhitepaperCitations(prev =>
            prev.some(c => c.title === cit.title) ? prev : [...prev, cit]
          )
        }
      />

      {/* 4. Gemini 3.8 Live Real-Time Voice Mission Comms */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
      />

      {/* 5. Lyria 3 Cosmic Soundtrack Studio */}
      <LyriaMusicStudio
        isOpen={isLyriaOpen}
        onClose={() => setIsLyriaOpen(false)}
        activeCluster={graphData.clusters[currentClusterIdx] || graphData.clusters[0]}
        currentLens={lens}
        isAuthenticated={Boolean(firebaseUser)}
      />

      {/* 6. Firebase Firestore Observatory Vault & Community Hub */}
      <ObservatoryVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        user={firebaseUser}
        graphData={graphData}
        discoveries={vaultDiscoveries}
        expeditions={vaultExpeditions}
        chatSessions={vaultChats}
        sharedMaps={vaultSharedMaps}
        onLoadSharedGraph={applyNewGraph}
        onAddDiscoveryNodeToAtlas={newNode => {
          setGraphData(prev => ({
            ...prev,
            nodes: [...prev.nodes, newNode]
          }));
          setSelectedNode(newNode);
          setEvolutionPulseCount(prev => prev + 1);
        }}
      />

      {/* Autonomous AI-UI-Navigator Intelligence Demonstration Mode */}
      <AINavigatorOverlay
        state={navigatorState}
        onTogglePause={handleToggleNavigatorPause}
        onCycleSpeed={handleCycleNavigatorSpeed}
        onStopNavigator={handleStopNavigator}
        onResumeNavigator={handleResumeNavigator}
      />
    </div>
  );
};

export default App;
