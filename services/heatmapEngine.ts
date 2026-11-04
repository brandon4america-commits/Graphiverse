import * as THREE from 'three';
import {
  Node,
  GraphLink,
  Cluster,
  ClusterStability,
  NodeType,
  HeatmapSettings,
  HeatmapMetricMode,
  HeatmapPalette,
  HeatmapHotspot
} from '../types';

export const DEFAULT_HEATMAP_SETTINGS: HeatmapSettings = {
  enabled: true,
  mode: 'FRICTION',
  intensity: 1.25,
  radius: 72,
  threshold: 0.12,
  particleCount: 3200,
  palette: 'SPECTRAL_FRICTION',
  showHotspots: true,
  showIsoContours: true,
  pulseWithAudio: true
};

export interface NodeEpistemicWeight {
  friction: number;
  activity: number;
  composite: number;
  contradictionCount: number;
  degree: number;
}

/**
 * Computes epistemic friction and graph activity metrics for each node in the graph.
 */
export function calculateNodeEpistemicWeights(
  nodes: Node[],
  links: GraphLink[],
  clusters: Cluster[]
): Map<string, NodeEpistemicWeight> {
  const clusterMap = new Map<string, Cluster>(clusters.map(c => [c.id, c]));
  const weightMap = new Map<string, NodeEpistemicWeight>();

  // Pre-calculate degree & contradiction link count
  const degreeMap = new Map<string, number>();
  const contradictionMap = new Map<string, number>();
  const supportMap = new Map<string, number>();

  nodes.forEach(n => {
    degreeMap.set(n.id, 0);
    contradictionMap.set(n.id, 0);
    supportMap.set(n.id, 0);
  });

  links.forEach(l => {
    degreeMap.set(l.source, (degreeMap.get(l.source) || 0) + 1);
    degreeMap.set(l.target, (degreeMap.get(l.target) || 0) + 1);

    if (l.relation === 'CONTRADICTS') {
      contradictionMap.set(l.source, (contradictionMap.get(l.source) || 0) + 1);
      contradictionMap.set(l.target, (contradictionMap.get(l.target) || 0) + 1);
    } else if (l.relation === 'SUPPORTS') {
      supportMap.set(l.source, (supportMap.get(l.source) || 0) + 1);
      supportMap.set(l.target, (supportMap.get(l.target) || 0) + 1);
    }
  });

  nodes.forEach(node => {
    const cluster = clusterMap.get(node.clusterId);
    const degree = degreeMap.get(node.id) || 0;
    const contradictions = contradictionMap.get(node.id) || 0;
    const supports = supportMap.get(node.id) || 0;

    // 1. Calculate Epistemic Friction:
    // - High if node is CONTRADICTION or QUESTION
    // - High if confidence is low (< 0.75)
    // - High if cluster is CONTESTED
    // - High if involved in CONTRADICTS links
    // - High if connection polarity is conflicted (both supports and contradicts)
    let typeFriction = 0.25;
    if (node.type === NodeType.CONTRADICTION) typeFriction = 0.92;
    else if (node.type === NodeType.QUESTION) typeFriction = 0.65;
    else if (node.type === NodeType.CLAIM) typeFriction = 0.42;
    else if (node.type === NodeType.EVIDENCE) typeFriction = 0.28;
    else if (node.type === NodeType.IDEA) typeFriction = 0.38;
    else if (node.type === NodeType.SOURCE) typeFriction = 0.20;
    else if (node.type === NodeType.DEFINITION) typeFriction = 0.15;

    const confidenceDeficit = Math.max(0, 1.0 - (node.confidence || 0.85)) * 0.9;
    const clusterTension =
      cluster?.stability === ClusterStability.CONTESTED
        ? 0.35
        : cluster?.stability === ClusterStability.EMERGING
        ? 0.18
        : 0.05;

    const contradictionPressure = Math.min(1.0, contradictions * 0.32);
    const polarizationFriction =
      contradictions > 0 && supports > 0
        ? Math.min(0.35, Math.min(contradictions, supports) * 0.2)
        : 0;

    const rawFriction =
      typeFriction * 0.38 +
      confidenceDeficit * 0.25 +
      contradictionPressure * 0.45 +
      clusterTension * 0.25 +
      polarizationFriction;
    const friction = Math.min(1.0, Math.max(0.05, rawFriction));

    // 2. Calculate Graph Activity:
    // - High if recently evolved / generated
    // - High degree centrality (hub connectivity)
    // - High node value (information density)
    const generationBonus = Math.min(0.5, ((node.generation || 0) + 1) * 0.14);
    const degreeCentrality = Math.min(0.65, (degree / 6) * 0.55);
    const valueDensity = Math.min(0.4, ((node.val || 15) / 30) * 0.35);
    const rawActivity = generationBonus + degreeCentrality + valueDensity;
    const activity = Math.min(1.0, Math.max(0.08, rawActivity));

    // 3. Composite Synergy Score:
    const composite = Math.min(
      1.0,
      friction * 0.62 + activity * 0.38 + friction * activity * 0.35
    );

    weightMap.set(node.id, {
      friction,
      activity,
      composite,
      contradictionCount: contradictions,
      degree
    });
  });

  return weightMap;
}

/**
 * Palette color vectors for ShaderMaterial & HUD visualization
 */
export function getPaletteColorRamps(palette: HeatmapPalette) {
  switch (palette) {
    case 'THERMAL_ENERGY':
      return {
        low: new THREE.Color(0x0a192f), // Deep indigo
        mid: new THREE.Color(0xff8c00), // Thermal amber
        high: new THREE.Color(0xff2200), // Pure thermal blaze
        peak: new THREE.Color(0xffff66), // White-hot core
        hexStrings: ['#0A192F', '#FF8C00', '#FF2200', '#FFFF66'],
        label: 'Thermal Energy'
      };
    case 'CHRONO_NEON':
      return {
        low: new THREE.Color(0x001a33), // Cyber void
        mid: new THREE.Color(0x00ff9d), // Neon emerald
        high: new THREE.Color(0xb877ff), // Chrono ultraviolet
        peak: new THREE.Color(0x00f0ff), // Luminous azure
        hexStrings: ['#001A33', '#00FF9D', '#B877FF', '#00F0FF'],
        label: 'Chrono Neon'
      };
    case 'SPECTRAL_FRICTION':
    default:
      return {
        low: new THREE.Color(0x021b33), // Coherent deep azure
        mid: new THREE.Color(0x00f0ff), // Luminous cyan
        high: new THREE.Color(0xffb800), // High epistemic tension amber
        peak: new THREE.Color(0xff2a5f), // Critical contradiction crimson
        hexStrings: ['#021B33', '#00F0FF', '#FFB800', '#FF2A5F'],
        label: 'Spectral Friction'
      };
  }
}

/**
 * Finds top 3-5 3D spatial hotspots (local maxima) of epistemic friction and graph activity.
 */
export function detectEpistemicHotspots(
  nodes: Node[],
  nodePositions: Map<string, THREE.Vector3>,
  links: GraphLink[],
  clusters: Cluster[],
  mode: HeatmapMetricMode,
  maxHotspots: number = 5
): HeatmapHotspot[] {
  const weights = calculateNodeEpistemicWeights(nodes, links, clusters);
  const clusterMap = new Map<string, Cluster>(clusters.map(c => [c.id, c]));

  // Rank candidate nodes based on selected metric mode
  const scoredNodes = nodes
    .filter(n => nodePositions.has(n.id))
    .map(n => {
      const w = weights.get(n.id) || {
        friction: 0.1,
        activity: 0.1,
        composite: 0.1,
        contradictionCount: 0,
        degree: 0
      };
      const score =
        mode === 'FRICTION'
          ? w.friction
          : mode === 'ACTIVITY'
          ? w.activity
          : w.composite;
      return {
        node: n,
        weight: w,
        score,
        pos: nodePositions.get(n.id)!
      };
    })
    .sort((a, b) => b.score - a.score);

  const hotspots: HeatmapHotspot[] = [];
  const minSeparation = 55; // spatial distance to avoid duplicate clusters

  for (const item of scoredNodes) {
    if (hotspots.length >= maxHotspots) break;

    // Check if too close to an existing hotspot
    const isNearby = hotspots.some(h => {
      const dx = h.position.x - item.pos.x;
      const dy = h.position.y - item.pos.y;
      const dz = h.position.z - item.pos.z;
      return Math.hypot(dx, dy, dz) < minSeparation;
    });

    if (isNearby) continue;

    // Find nearby supporting nodes
    const nearbyNodeIds = nodes
      .filter(other => {
        const otherPos = nodePositions.get(other.id);
        if (!otherPos) return false;
        const dist = item.pos.distanceTo(otherPos);
        return dist <= 85;
      })
      .map(n => n.id);

    const cluster = clusterMap.get(item.node.clusterId);
    const clusterName = cluster ? cluster.name : 'Sector Core';

    let category: 'FRICTION_SHEAR' | 'ACTIVITY_SURGE' | 'DIALECTICAL_TENSION' =
      'FRICTION_SHEAR';
    let diagnostic = '';

    if (mode === 'FRICTION' || item.weight.friction > 0.7) {
      if (item.weight.contradictionCount > 0) {
        category = 'DIALECTICAL_TENSION';
        diagnostic = `Severe epistemic shear: ${item.weight.contradictionCount} direct contradiction bridges. High dialectical divergence.`;
      } else {
        category = 'FRICTION_SHEAR';
        diagnostic = `Epistemic tension anomaly detected. Low confidence rating (${Math.round(
          (item.node.confidence || 0.7) * 100
        )}%) and theoretical volatility.`;
      }
    } else {
      category = 'ACTIVITY_SURGE';
      diagnostic = `High-velocity graph activity hub with ${item.weight.degree} synaptic connections and continuous signal propagation.`;
    }

    hotspots.push({
      id: `hotspot-${item.node.id}`,
      label: item.node.label,
      category,
      score: Number(item.score.toFixed(3)),
      frictionScore: Number(item.weight.friction.toFixed(3)),
      activityScore: Number(item.weight.activity.toFixed(3)),
      position: {
        x: Number(item.pos.x.toFixed(1)),
        y: Number(item.pos.y.toFixed(1)),
        z: Number(item.pos.z.toFixed(1))
      },
      clusterId: item.node.clusterId,
      clusterName,
      diagnostic,
      associatedNodeIds: nearbyNodeIds
    });
  }

  return hotspots;
}
