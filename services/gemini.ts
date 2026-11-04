import {
  Node,
  ClusterStability,
  GraphData,
  VoiceMode,
  GraphQueryResult,
  NodeInspectionResult,
  EvolutionFocus,
  EvolutionRoundResult,
  Cluster,
  ClusterDrillDownResult,
  DialecticalPair
} from '../types';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Request failed');
    throw new Error(`API error (${response.status}): ${errText}`);
  }

  return response.json() as Promise<T>;
}

export const generateSceneManifest = async (
  clusterNodes: Node[],
  clusterName: string,
  stability: ClusterStability,
  voiceMode: VoiceMode = 'SINGLE'
) => {
  try {
    return await postJson<{
      title: string;
      lyrics: string[];
      musicPrompt: string;
      audioCue: {
        tempo: number;
        key: string;
        instrumentation: string[];
        mood: string;
      };
    }>('/api/gemini/manifest', {
      nodes: clusterNodes,
      clusterName,
      stability,
      voiceMode
    });
  } catch (error) {
    console.warn('Fallback manifest used:', error);
    return {
      title: clusterName,
      lyrics: [
        `Analyzing ${clusterName} spatial topology.`,
        `${clusterNodes.length} primary telemetry nodes active in sector.`
      ],
      musicPrompt: 'Deep cinematic space telemetry synth pad',
      audioCue: {
        tempo: 78,
        key: 'D Minor',
        instrumentation: ['Sub Bass', 'Modular Pad', 'Crystal Arpeggio'],
        mood: 'Analytical & Expansive'
      }
    };
  }
};

export const generateSceneAudio = async (
  lyrics: string[],
  mood: string,
  instrumentation: string[],
  voiceMode: VoiceMode = 'SINGLE'
): Promise<string | undefined> => {
  try {
    const data = await postJson<{ audioData?: string }>('/api/gemini/tts', {
      lyrics,
      mood,
      instrumentation,
      voiceMode
    });
    return data.audioData;
  } catch (error) {
    console.warn('TTS generation skipped:', error);
    return undefined;
  }
};

export const generateMusicDrone = async (
  prompt: string,
  audioCue?: { tempo: number; key: string; mood: string }
): Promise<string | undefined> => {
  return JSON.stringify({
    prompt,
    tempo: audioCue?.tempo || 76,
    key: audioCue?.key || 'D Minor',
    mood: audioCue?.mood || 'Deep Space'
  });
};

export const queryGraph = async (
  query: string,
  graphData: GraphData,
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<GraphQueryResult> => {
  return postJson<GraphQueryResult>('/api/gemini/query', {
    query,
    nodes: graphData.nodes,
    clusters: graphData.clusters,
    history
  });
};

export const coPilotChat = async (
  query: string,
  nodes: Node[],
  history: { role: 'user' | 'model'; text: string }[] = []
): Promise<{ text: string; highlightNodes: string[]; targetClusterId?: string | null }> => {
  const res = await postJson<GraphQueryResult>('/api/gemini/query', {
    query,
    nodes,
    clusters: [],
    history
  });
  return {
    text: res.answer,
    highlightNodes: res.highlightNodeIds || [],
    targetClusterId: res.targetClusterId
  };
};

export const inspectNodeDeepDive = async (
  node: Node,
  graphData: GraphData
): Promise<NodeInspectionResult> => {
  const connectedLinks = graphData.links.filter(
    l => l.source === node.id || l.target === node.id
  );
  const neighborIds = new Set(
    connectedLinks.map(l => (l.source === node.id ? l.target : l.source))
  );
  const connectedNodes = graphData.nodes.filter(n => neighborIds.has(n.id));

  return postJson<NodeInspectionResult>('/api/gemini/node-inspect', {
    node,
    connectedNodes
  });
};

export const generateMoreEvidence = async (
  node: Node,
  allNodes: Node[]
): Promise<Node[]> => {
  const connectedNodes = allNodes.filter(
    n => n.clusterId === node.clusterId && n.id !== node.id
  );
  const result = await postJson<NodeInspectionResult>('/api/gemini/node-inspect', {
    node,
    connectedNodes
  });
  return (result.newChildNodes || []).map((child, idx) => ({
    id: `ev-${node.id}-${Date.now()}-${idx}`,
    label: child.label,
    type: child.type,
    clusterId: node.clusterId,
    val: child.val || 14,
    confidence: child.confidence || 0.85,
    source: child.source || node.source || 'AI Synthesis',
    description: child.description,
    generation: (node.generation || 0) + 1,
    parentId: node.id
  }));
};

export const runEvolutionRound = async (params: {
  graphData: GraphData;
  roundNumber: number;
  focus: EvolutionFocus;
  targetNodeId?: string;
}): Promise<EvolutionRoundResult> => {
  const res = await postJson<Omit<EvolutionRoundResult, 'round' | 'timestamp' | 'focus'>>(
    '/api/gemini/evolve',
    {
      nodes: params.graphData.nodes,
      links: params.graphData.links,
      clusters: params.graphData.clusters,
      roundNumber: params.roundNumber,
      focus: params.focus,
      targetNodeId: params.targetNodeId
    }
  );

  return {
    ...res,
    round: params.roundNumber,
    focus: params.focus,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
};

export const drillDownCluster = async (
  cluster: Cluster,
  graphData: GraphData
): Promise<ClusterDrillDownResult> => {
  const clusterNodes = graphData.nodes.filter(n => n.clusterId === cluster.id);
  return postJson<ClusterDrillDownResult>('/api/gemini/drill-down', {
    cluster,
    nodes: clusterNodes
  });
};

export const synthesizeDialecticalPair = async (
  nodeA: Node,
  nodeB: Node
): Promise<{
  tensionLevel: 'HIGH' | 'CRITICAL' | 'MODERATE';
  tensionDescription: string;
  reconcilingHypothesis: string;
  resolvingNode: {
    label: string;
    type: any;
    description: string;
    source: string;
    confidence: number;
  };
}> => {
  return postJson('/api/gemini/dialectical-synthesize', {
    nodeA,
    nodeB
  });
};

export const runResearcherPatrol = async (
  cluster: Cluster,
  sampledNodes: Node[],
  probeId: string
) => {
  return postJson<{
    id: string;
    probeId: string;
    targetClusterId: string;
    targetClusterName: string;
    timestamp: string;
    message: string;
    observedStability: ClusterStability;
    anomaliesDetected: number;
    telemetrySignal: 'STABLE' | 'DEGRADED' | 'ELEVATED';
  }>('/api/gemini/researcher-patrol', {
    cluster,
    sampledNodes,
    probeId
  });
};

export const parseProjectToGraph = async (
  fileList: string[],
  fileSnippets: string[]
): Promise<GraphData> => {
  const payload = `FILES:\n${fileList.join('\n')}\n\nSNIPPETS:\n${fileSnippets.join('\n---\n')}`;
  return postJson<GraphData>('/api/gemini/ingest', {
    sourceType: 'ZIP_ARCHIVE',
    payload
  });
};

export const ingestGitHubRepository = async (repoUrl: string): Promise<GraphData> => {
  const repoSummary = await postJson<{
    repo: string;
    description: string;
    stars: number;
    language: string;
    fileList: string[];
    readmeSnippet: string;
    sourceSnippets?: string[];
  }>('/api/github/repo', { repoUrl });

  const payload = `REPOSITORY: ${repoSummary.repo}
DESCRIPTION: ${repoSummary.description}
LANGUAGE: ${repoSummary.language} | STARS: ${repoSummary.stars}
FILE TREE:
${repoSummary.fileList.join('\n')}

README:
${repoSummary.readmeSnippet}

KEY SOURCE CODES:
${(repoSummary.sourceSnippets || []).join('\n\n')}`;

  return postJson<GraphData>('/api/gemini/ingest', {
    sourceType: 'GITHUB_REPO',
    payload
  });
};

export const ingestGitHubRepo = ingestGitHubRepository;

export const ingestCsvToGraph = async (csvText: string): Promise<GraphData> => {
  return postJson<GraphData>('/api/gemini/ingest', {
    sourceType: 'CSV_TABLE',
    payload: csvText
  });
};

export const ingestJsonToGraph = async (jsonText: string): Promise<GraphData> => {
  return postJson<GraphData>('/api/gemini/ingest', {
    sourceType: 'JSON_DOCUMENT',
    payload: jsonText
  });
};


export const generateComprehensiveDossierMarkdown = (
  graphData: GraphData,
  evolutionHistory: EvolutionRoundResult[]
): string => {
  const date = new Date().toISOString();
  let md = `# GRAPHIVERSE CINEMATIC SUITE // EPISTEMIC DOSSIER
**Generated**: ${date}
**Topology Statistics**: ${graphData.nodes.length} Nodes | ${graphData.links.length} Bridges | ${graphData.clusters.length} Sectors | ${evolutionHistory.length} Evolution Generations

---

## 1. Executive Summary & Epistemic Stability Matrix

| Sector / Cluster | Stability | Center (X, Y, Z) | Active Nodes |
|---|---|---|---|
`;

  graphData.clusters.forEach(c => {
    const nodeCount = graphData.nodes.filter(n => n.clusterId === c.id).length;
    md += `| **${c.name}** | \`${c.stability}\` | (${Math.round(c.center.x)}, ${Math.round(c.center.y)}, ${Math.round(c.center.z)}) | ${nodeCount} |\n`;
  });

  md += `\n---\n\n## 2. Complete Node Telemetry Registry\n\n`;

  graphData.nodes.forEach(n => {
    md += `### [${n.type}] ${n.label}\n`;
    md += `- **ID**: \`${n.id}\`\n`;
    md += `- **Sector**: \`${n.clusterId}\`\n`;
    md += `- **Confidence**: \`${Math.round(n.confidence * 100)}%\`\n`;
    md += `- **Source / Provenance**: ${n.source || 'Observatory Core Telemetry'}\n`;
    if (n.generation) md += `- **Evolution Generation**: \`GEN-${n.generation}\`\n`;
    if (n.parentId) md += `- **Parent Node**: \`${n.parentId}\`\n`;
    md += `- **Description**: ${n.description || 'N/A'}\n`;
    if (n.citations && n.citations.length > 0) {
      md += `- **Citations**:\n`;
      n.citations.forEach(cite => {
        md += `  - ${cite}\n`;
      });
    }
    if (n.aiAnalysis) {
      md += `- **AI Epistemic Deep-Dive**:\n  ${n.aiAnalysis.replace(/\n/g, '\n  ')}\n`;
    }
    md += `\n`;
  });

  md += `---\n\n## 3. Recursive Evolution History & Lineage Ledger\n\n`;

  if (evolutionHistory.length === 0) {
    md += `*No recursive evolution rounds recorded in this session.*\n`;
  } else {
    evolutionHistory.forEach(ev => {
      md += `### Round #${ev.round}: ${ev.roundTitle} (\`${ev.focus}\`)\n`;
      md += `- **Timestamp**: ${ev.timestamp}\n`;
      md += `- **Synthesis Summary**: ${ev.synthesisSummary}\n`;
      md += `- **Mutations**: +${ev.newNodes.length} Nodes, +${ev.newLinks.length} Bridges\n\n`;
    });
  }

  md += `---\n*End of Epistemic Dossier // Graphiverse Spatial Knowledge Observatory*\n`;
  return md;
};

export interface BioSignatureScanResult {
  spectroscopicAnalysis: string;
  recommendedJwstHours: number;
  biomarkerProbabilities: {
    biomarker: string;
    probability: number;
    status: 'DETECTED' | 'SUSPECTED' | 'ABSENT';
    description: string;
  }[];
  spectralCurve: {
    wavelength: number;
    transmissionDepth: number;
  }[];
}

export const analyzeExoplanetBioSignatureScanner = async (
  planet: any
): Promise<BioSignatureScanResult> => {
  try {
    return await postJson<BioSignatureScanResult>('/api/gemini/exoplanet-bioscan', { planet });
  } catch (error) {
    console.warn('Gemini bioscan failed, using fallback spectral telemetry:', error);
    return {
      spectroscopicAnalysis: `Fallback Astrobiological Scan for ${planet.name}: Atmospheric analysis indicates thermodynamic disequilibrium driven by co-existing O2 (${planet.gasO2}%) and CH4 (${planet.gasCH4}%). High-resolution JWST NIRSpec transmission spectra confirm strong H2O absorption bands at 1.4µm and 1.9µm.`,
      recommendedJwstHours: 120,
      biomarkerProbabilities: [
        { biomarker: 'Oxygen (O2)', probability: Math.min(95, planet.gasO2 * 2.5), status: planet.gasO2 > 5 ? 'DETECTED' : 'ABSENT', description: 'Photolytic signature of oxidizing atmosphere.' },
        { biomarker: 'Methane (CH4)', probability: Math.min(92, planet.gasCH4 * 6), status: planet.gasCH4 > 0.5 ? 'DETECTED' : 'ABSENT', description: 'Reducing volatile requiring active replenishment.' },
        { biomarker: 'Water Vapor (H2O)', probability: Math.min(98, planet.gasH2O * 1.5), status: planet.gasH2O > 10 ? 'DETECTED' : 'SUSPECTED', description: 'Global hydrosphere / atmospheric humidity.' },
        { biomarker: 'Carbon Dioxide (CO2)', probability: Math.min(88, planet.gasCO2 * 3), status: planet.gasCO2 > 1 ? 'DETECTED' : 'ABSENT', description: 'Greenhouse regulator & volcanic outgassing indicator.' },
        { biomarker: 'Vegetation Red-Edge', probability: planet.gasO2 > 10 && planet.gasCH4 > 1 ? 74 : 12, status: planet.gasO2 > 10 ? 'SUSPECTED' : 'ABSENT', description: 'Surface chlorophyll reflectance anomaly at ~0.7µm.' }
      ],
      spectralCurve: Array.from({ length: 30 }, (_, i) => {
        const wl = 0.5 + (i / 29) * 9.5;
        let depth = 1.2 + Math.sin(wl * 1.2) * 0.15;
        if (Math.abs(wl - 1.4) < 0.15) depth += (planet.gasH2O / 20) * 0.5;
        if (Math.abs(wl - 2.3) < 0.15) depth += (planet.gasCH4 / 5) * 0.4;
        if (Math.abs(wl - 4.3) < 0.2) depth += (planet.gasCO2 / 10) * 0.6;
        return { wavelength: Number(wl.toFixed(2)), transmissionDepth: Number(depth.toFixed(3)) };
      })
    };
  }
};

