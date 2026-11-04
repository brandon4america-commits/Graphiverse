import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import {
  Node,
  Cluster,
  GraphLink,
  SceneManifest,
  ViewLens,
  VisualSettings,
  ClusterStability,
  NodeType,
  PhysicsSettings,
  ClusterFilterState,
  ExpansionType,
  SpaceWeather,
  HeatmapSettings,
  HeatmapHotspot
} from '../types';
import { getAudioSpectrum } from '../services/audio';
import {
  calculateNodeEpistemicWeights,
  getPaletteColorRamps,
  detectEpistemicHotspots,
  DEFAULT_HEATMAP_SETTINGS
} from '../services/heatmapEngine';
import {
  createBrushedMetalNormalMap,
  createCrystalRoughnessMap,
  createTechCircuitNormalMap,
  createContactRadianceTexture
} from '../services/proceduralTextures';
import { CinematicChromaticAberrationShader } from '../services/postprocessingShaders';
import {
  AnamorphicFlareShader,
  TactileFilmGrainShader,
  VolumetricLightShaftShader
} from '../services/hyperRealShaders';
import { updateSpatialAudioListener, emitSpatialChime } from '../services/spatialAudio';

const metalNormalMap = createBrushedMetalNormalMap(512);
const crystalRoughnessMap = createCrystalRoughnessMap(512);
const techNormalMap = createTechCircuitNormalMap(512);
const contactRadianceTexture = createContactRadianceTexture(512);

interface VisualizerProps {
  nodes: Node[];
  links: GraphLink[];
  clusters: Cluster[];
  activeScene?: SceneManifest;
  viewAngle: { x: number; y: number };
  lens: ViewLens;
  visualSettings: VisualSettings;
  physicsSettings: PhysicsSettings;
  clusterFilter: ClusterFilterState;
  onSelectNode: (node: Node) => void;
  selectedNode?: Node;
  highlightedNodeIds: string[];
  cameraTargetOverride?: { x: number; y: number; z: number } | null;
  evolutionPulseCount?: number;
  onWormholeTraverse?: () => void;
  spaceWeather?: SpaceWeather;
  temporalPlaybackGen?: number | null;
  heatmapSettings?: HeatmapSettings;
  onSelectHotspot?: (hotspot: HeatmapHotspot) => void;
  onHotspotsDetected?: (hotspots: HeatmapHotspot[]) => void;
}

const NODE_COLORS: Record<NodeType, number> = {
  [NodeType.CLAIM]: 0x38bdf8,
  [NodeType.EVIDENCE]: 0x10b981,
  [NodeType.CONTRADICTION]: 0xf43f5e,
  [NodeType.QUESTION]: 0xf59e0b,
  [NodeType.IDEA]: 0xa855f7,
  [NodeType.SOURCE]: 0x93c5fd,
  [NodeType.DEFINITION]: 0xf8fafc
};

const NODE_HEX_STRINGS: Record<NodeType, string> = {
  [NodeType.CLAIM]: '#38BDF8',
  [NodeType.EVIDENCE]: '#10B981',
  [NodeType.CONTRADICTION]: '#F43F5E',
  [NodeType.QUESTION]: '#F59E0B',
  [NodeType.IDEA]: '#A855F7',
  [NodeType.SOURCE]: '#93C5FD',
  [NodeType.DEFINITION]: '#F8FAFC'
};

const CLUSTER_COLORS: Record<ClusterStability, number> = {
  [ClusterStability.SETTLED]: 0x38bdf8,
  [ClusterStability.EMERGING]: 0xf59e0b,
  [ClusterStability.CONTESTED]: 0xf43f5e
};

const HALO_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HALO_FRAGMENT_SHADER = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uAudioBass;
  uniform float uAudioHigh;
  uniform float uIntensity;

  void main() {
    vec2 center = vUv - vec2(0.5);
    float dist = length(center) * 2.0;
    if (dist > 1.0) discard;

    float core = exp(-dist * 4.5) * (0.28 + uAudioBass * 0.3);
    float innerRing = smoothstep(0.02, 0.0, abs(dist - 0.52)) * 0.32;
    float outerRing = smoothstep(0.015, 0.0, abs(dist - 0.88)) * 0.45;

    float alpha = (core + innerRing + outerRing) * uIntensity;
    gl_FragColor = vec4(uColor * 1.1, clamp(alpha, 0.0, 0.55));
  }
`;

const WORMHOLE_FRAGMENT_SHADER = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uAudioBass;

  void main() {
    vec2 p = vUv - vec2(0.5);
    float r = length(p) * 2.0;
    if (r > 1.0 || r < 0.14) discard;

    float a = atan(p.y, p.x);
    float spiral = sin(a * 4.0 + r * 12.0 - uTime * 3.0);
    float horizonGlow = smoothstep(0.14, 0.3, r) * smoothstep(0.95, 0.45, r);
    float beam = (spiral * 0.4 + 0.5) * horizonGlow * (0.85 + uAudioBass * 0.8);

    gl_FragColor = vec4(uColor * 1.15, clamp(beam, 0.0, 0.65));
  }
`;

const HEATMAP_PARTICLE_COUNT = 2800;

const HEATMAP_VERTEX_SHADER = `
  attribute float aIntensity;
  attribute float aPhase;
  varying float vIntensity;
  uniform float uTime;
  uniform float uAudioBass;
  uniform float uPointSize;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + D.xxxx;
    vec4 y = y_ * ns.x + D.xxxx;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vIntensity = aIntensity;
    vec3 p = position;
    vec3 noiseCoord = p * 0.012 + vec3(uTime * 0.14 + aPhase);
    float nX = snoise(noiseCoord);
    float nY = snoise(noiseCoord + vec3(12.5, 34.2, 56.8));
    float nZ = snoise(noiseCoord + vec3(78.1, 91.3, 23.4));

    float noiseDisp = (6.5 + aIntensity * 10.0 + uAudioBass * 12.0);
    p += vec3(nX, nY, nZ) * noiseDisp;

    vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPos;

    float dynamicScale = (1.0 + aIntensity * 1.6 + uAudioBass * 0.7);
    gl_PointSize = clamp(uPointSize * dynamicScale * (360.0 / -mvPos.z), 3.5, 68.0);
  }
`;

const HEATMAP_FRAGMENT_SHADER = `
  varying float vIntensity;
  uniform vec3 uColorLow;
  uniform vec3 uColorMid;
  uniform vec3 uColorHigh;
  uniform vec3 uColorPeak;
  uniform float uThreshold;
  uniform float uGlobalIntensity;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord) * 2.0;
    if (dist > 1.0) discard;

    float falloff = exp(-dist * dist * 3.4);

    if (vIntensity < uThreshold) discard;
    float normVal = clamp((vIntensity - uThreshold) / max(0.0001, 1.0 - uThreshold), 0.0, 1.0);

    vec3 color;
    if (normVal < 0.33) {
      color = mix(uColorLow, uColorMid, normVal / 0.33);
    } else if (normVal < 0.66) {
      color = mix(uColorMid, uColorHigh, (normVal - 0.33) / 0.33);
    } else {
      color = mix(uColorHigh, uColorPeak, (normVal - 0.66) / 0.34);
    }

    float alpha = falloff * pow(normVal, 0.8) * uGlobalIntensity * 0.68;
    gl_FragColor = vec4(color * 1.25, clamp(alpha, 0.0, 0.85));
  }
`;

const CONDUIT_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const CONDUIT_FRAGMENT_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uAudioBass;

  void main() {
    float pulse1 = sin(vUv.x * 32.0 - uTime * 5.0) * 0.5 + 0.5;
    float pulse2 = cos(vUv.x * 64.0 + uTime * 8.0) * 0.5 + 0.5;
    float coreBeam = pow(pulse1 * pulse2, 1.8) * 1.1;

    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.2);

    float alpha = (coreBeam * 0.35 + fresnel * 0.45 + uAudioBass * 0.25) * 0.45;
    vec3 finalColor = uColor * (0.9 + coreBeam * 1.2);

    gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 0.55));
  }
`;

interface SimNode {
  id: string;
  node: Node;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  mesh: THREE.Mesh;
  wireframe: THREE.LineSegments;
  reticle: THREE.Object3D;
  genRing?: THREE.Mesh;
}

interface Nanoprobe {
  mesh: THREE.Mesh;
  halo: THREE.Mesh;
  sourceId: string;
  targetId: string;
  progress: number;
  speed: number;
  offset: THREE.Vector3;
}

const Visualizer: React.FC<VisualizerProps> = ({
  nodes,
  links,
  clusters,
  activeScene,
  lens,
  visualSettings,
  physicsSettings,
  clusterFilter,
  onSelectNode,
  selectedNode,
  highlightedNodeIds,
  cameraTargetOverride,
  evolutionPulseCount = 0,
  onWormholeTraverse,
  spaceWeather = 'QUIET_SPACE',
  temporalPlaybackGen = null,
  heatmapSettings = DEFAULT_HEATMAP_SETTINGS,
  onSelectHotspot,
  onHotspotsDetected
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelsLayerRef = useRef<HTMLDivElement>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);
  const nodeLabelElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const clusterLabelElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const propsRef = useRef({
    nodes,
    links,
    clusters,
    activeScene,
    lens,
    visualSettings,
    physicsSettings,
    clusterFilter,
    onSelectNode,
    selectedNode,
    highlightedNodeIds,
    cameraTargetOverride,
    evolutionPulseCount,
    onWormholeTraverse,
    spaceWeather,
    temporalPlaybackGen,
    heatmapSettings,
    onSelectHotspot,
    onHotspotsDetected
  });

  useEffect(() => {
    propsRef.current = {
      nodes,
      links,
      clusters,
      activeScene,
      lens,
      visualSettings,
      physicsSettings,
      clusterFilter,
      onSelectNode,
      selectedNode,
      highlightedNodeIds,
      cameraTargetOverride,
      evolutionPulseCount,
      onWormholeTraverse,
      spaceWeather,
      temporalPlaybackGen,
      heatmapSettings,
      onSelectHotspot,
      onHotspotsDetected
    };
  });

  const simNodesRef = useRef<Map<string, SimNode>>(new Map());
  const sceneObjectsRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    composer: EffectComposer;
    chromaticPass: ShaderPass;
    anamorphicPass: ShaderPass;
    filmGrainPass: ShaderPass;
    fxaaPass: ShaderPass;
    nodeGroup: THREE.Group;
    clusterGroup: THREE.Group;
    splineGroup: THREE.Group;
    probeGroup: THREE.Group;
    debrisGroup: THREE.Group;
    shockwaveGroup: THREE.Group;
    wormholeGroup: THREE.Group;
    volumetricShaftsGroup: THREE.Group;
    volumetricLightMat: THREE.ShaderMaterial;
    contactRadianceGroup: THREE.Group;
    nebulaPoints: THREE.Points;
    starPoints: THREE.Points;
    cosmicDustPoints: THREE.Points;
    horizonRingsGroup: THREE.Group;
    linkMesh: THREE.LineSegments | null;
    packetPoints: THREE.Points | null;
    gridHelper: THREE.GridHelper | null;
    astrolabeGroup: THREE.Group | null;
    sentinelGroup: THREE.Group | null;
    dirLight1: THREE.DirectionalLight;
    dirLight2: THREE.DirectionalLight;
    dirLight3: THREE.DirectionalLight;
    heatmapGroup: THREE.Group;
    heatmapPoints: THREE.Points;
    heatmapGeo: THREE.BufferGeometry;
    heatmapMat: THREE.ShaderMaterial;
    hotspotBeaconsGroup: THREE.Group;
    isoContoursGroup: THREE.Group;
  } | null>(null);

  const cameraTargetVec = useRef(new THREE.Vector3(0, 0, 0));
  const cameraPosGoalVec = useRef<THREE.Vector3 | null>(null);
  const lastPulseCountRef = useRef(0);

  // Trigger 3D Shockwave Ring
  useEffect(() => {
    if (evolutionPulseCount > lastPulseCountRef.current && sceneObjectsRef.current) {
      lastPulseCountRef.current = evolutionPulseCount;
      const { shockwaveGroup } = sceneObjectsRef.current;

      const origin = selectedNode
        ? simNodesRef.current.get(selectedNode.id)?.pos.clone() || new THREE.Vector3(0, 0, 0)
        : new THREE.Vector3(0, 0, 0);

      const waveGeo = new THREE.RingGeometry(8, 11, 64);
      const waveMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const waveMesh = new THREE.Mesh(waveGeo, waveMat);
      waveMesh.position.copy(origin);
      waveMesh.userData = { birthTime: performance.now(), maxScale: 48 };
      shockwaveGroup.add(waveMesh);

      const waveGeo2 = new THREE.RingGeometry(5, 7, 64);
      const waveMat2 = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const waveMesh2 = new THREE.Mesh(waveGeo2, waveMat2);
      waveMesh2.position.copy(origin);
      waveMesh2.rotation.x = Math.PI / 2;
      waveMesh2.userData = { birthTime: performance.now(), maxScale: 42 };
      shockwaveGroup.add(waveMesh2);
    }
  }, [evolutionPulseCount, selectedNode]);

  // Synchronize DOM Elements for Progressive 3D Level-of-Detail (LOD) Labels
  useEffect(() => {
    const layer = labelsLayerRef.current;
    if (!layer) return;

    // Sync Cluster Sector Anchor Labels
    const incomingClusterIds = new Set(clusters.map(c => c.id));
    clusterLabelElementsRef.current.forEach((el, id) => {
      if (!incomingClusterIds.has(id)) {
        el.remove();
        clusterLabelElementsRef.current.delete(id);
      }
    });

    clusters.forEach((cluster, idx) => {
      let el = clusterLabelElementsRef.current.get(cluster.id);
      if (!el) {
        el = document.createElement('div');
        el.className =
          'pointer-events-none absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 select-none';
        layer.appendChild(el);
        clusterLabelElementsRef.current.set(cluster.id, el);
      }
      const distBadge = cluster.distanceRange ? ` · ${cluster.distanceRange}` : '';
      el.innerHTML = `
        <div class="px-2.5 py-1 rounded bg-[#0B0F17]/75 border border-white/10 backdrop-blur-sm text-center shadow-sm">
          <div class="text-[9px] font-mono uppercase tracking-widest text-sky-400/90">
            Sector 0${idx + 1}${distBadge}
          </div>
          <div class="text-[11px] font-medium text-slate-200 whitespace-nowrap">
            ${cluster.name}
          </div>
        </div>
      `;
    });

    // Sync Node LOD Labels
    const incomingNodeIds = new Set(nodes.map(n => n.id));
    nodeLabelElementsRef.current.forEach((el, id) => {
      if (!incomingNodeIds.has(id)) {
        el.remove();
        nodeLabelElementsRef.current.delete(id);
      }
    });

    nodes.forEach(node => {
      let el = nodeLabelElementsRef.current.get(node.id);
      if (!el) {
        el = document.createElement('div');
        el.className =
          'pointer-events-none absolute top-0 left-0 -translate-x-1/2 transition-opacity duration-150 select-none';
        layer.appendChild(el);
        nodeLabelElementsRef.current.set(node.id, el);
      }
      const dotColor = NODE_HEX_STRINGS[node.type] || '#38BDF8';
      const metaParts = [
        node.type,
        `${Math.round(node.confidence * 100)}%`,
        node.distanceLabel
      ].filter(Boolean);

      el.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="node-label-pill flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#07090E]/85 border border-white/10 shadow-sm whitespace-nowrap">
            <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${dotColor}"></span>
            <span class="text-[11px] font-medium text-slate-100">${node.label}</span>
          </div>
          <div class="node-label-meta hidden mt-0.5 px-1.5 py-0.2 rounded bg-[#07090E]/90 text-[9px] font-mono text-slate-400 whitespace-nowrap">
            ${metaParts.join(' · ')}
          </div>
        </div>
      `;
    });
  }, [nodes, clusters]);

  // Main WebGL Scene Initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07090e);
    scene.fog = new THREE.FogExp2(0x07090e, 0.00045);

    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 6000);
    camera.position.set(0, 145, 510);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 2200;
    controls.minDistance = 25;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;

    const stopAutoGoal = () => {
      cameraPosGoalVec.current = null;
    };
    renderer.domElement.addEventListener('pointerdown', stopAutoGoal);
    renderer.domElement.addEventListener('wheel', stopAutoGoal);

    // Calibrated Observatory Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x07090e, 1.45);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xd8ecff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.5);
    dirLight1.position.set(380, 520, 380);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    dirLight1.shadow.bias = -0.0005;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf43f5e, 1.6);
    dirLight2.position.set(-420, -310, -280);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xf59e0b, 1.4);
    dirLight3.position.set(0, 450, -450);
    scene.add(dirLight3);

    // Calibrated Post-Processing Pipeline
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.42,
      0.3,
      0.86
    );
    composer.addPass(bloomPass);

    const anamorphicPass = new ShaderPass(AnamorphicFlareShader);
    composer.addPass(anamorphicPass);

    const chromaticPass = new ShaderPass(CinematicChromaticAberrationShader);
    composer.addPass(chromaticPass);

    const filmGrainPass = new ShaderPass(TactileFilmGrainShader);
    composer.addPass(filmGrainPass);

    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms['resolution'].value.set(1 / width, 1 / height);
    composer.addPass(fxaaPass);

    // Subtle Atmospheric Volumetric Light Shafts
    const volumetricShaftsGroup = new THREE.Group();
    scene.add(volumetricShaftsGroup);

    const shaftGeo = new THREE.CylinderGeometry(20, 240, 950, 32, 1, true);
    shaftGeo.translate(0, -475, 0);

    const volumetricLightMat = new THREE.ShaderMaterial({
      vertexShader: VolumetricLightShaftShader.vertexShader,
      fragmentShader: VolumetricLightShaftShader.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x38bdf8) },
        uAudioBass: { value: 0 },
        uIntensity: { value: 0.38 }
      },
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    const origin1 = new THREE.Vector3(380, 520, 380);
    const target1 = new THREE.Vector3(0, -60, 0);
    const dir1 = target1.clone().sub(origin1).normalize();
    const quat1 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir1);

    const shaftMesh1 = new THREE.Mesh(shaftGeo, volumetricLightMat);
    shaftMesh1.position.copy(origin1);
    shaftMesh1.quaternion.copy(quat1);
    volumetricShaftsGroup.add(shaftMesh1);

    const counterMat = new THREE.ShaderMaterial({
      vertexShader: VolumetricLightShaftShader.vertexShader,
      fragmentShader: VolumetricLightShaftShader.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xa855f7) },
        uAudioBass: { value: 0 },
        uIntensity: { value: 0.25 }
      },
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    const origin2 = new THREE.Vector3(-420, 480, -320);
    const target2 = new THREE.Vector3(60, -90, 40);
    const dir2 = target2.clone().sub(origin2).normalize();
    const quat2 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir2);

    const shaftMesh2 = new THREE.Mesh(shaftGeo, counterMat);
    shaftMesh2.position.copy(origin2);
    shaftMesh2.quaternion.copy(quat2);
    volumetricShaftsGroup.add(shaftMesh2);

    const contactRadianceGroup = new THREE.Group();
    contactRadianceGroup.position.y = -224.8;
    scene.add(contactRadianceGroup);

    // Subtle Deep-Field Nebula Clouds
    const nebulaCount = 900;
    const nebulaGeo = new THREE.BufferGeometry();
    const nebulaPos = new Float32Array(nebulaCount * 3);
    const nebulaCol = new Float32Array(nebulaCount * 3);

    for (let i = 0; i < nebulaCount; i++) {
      const q = i % 4;
      const angle = (q * Math.PI) / 2 + (Math.random() - 0.5) * 1.2;
      const dist = 180 + Math.random() * 440;
      nebulaPos[i * 3] = Math.cos(angle) * dist + (Math.random() - 0.5) * 90;
      nebulaPos[i * 3 + 1] = (Math.random() - 0.5) * 220;
      nebulaPos[i * 3 + 2] = Math.sin(angle) * dist + (Math.random() - 0.5) * 90;

      const col =
        q === 0
          ? [0.22, 0.74, 0.97]
          : q === 1
          ? [0.96, 0.62, 0.04]
          : q === 2
          ? [0.95, 0.25, 0.37]
          : [0.66, 0.33, 0.97];

      nebulaCol[i * 3] = col[0];
      nebulaCol[i * 3 + 1] = col[1];
      nebulaCol[i * 3 + 2] = col[2];
    }
    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
    nebulaGeo.setAttribute('color', new THREE.BufferAttribute(nebulaCol, 3));
    const nebulaMat = new THREE.PointsMaterial({
      size: 11.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const nebulaPoints = new THREE.Points(nebulaGeo, nebulaMat);
    scene.add(nebulaPoints);

    // Calibrated Astrometric Starfield
    const starCount = 2600;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 720 + Math.random() * 1600;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const palette =
        i % 5 === 0 ? [0.58, 0.77, 0.99] : i % 7 === 0 ? [0.98, 0.82, 0.55] : [0.88, 0.93, 1.0];
      starColors[i * 3] = palette[0];
      starColors[i * 3 + 1] = palette[1];
      starColors[i * 3 + 2] = palette[2];
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // Subtle Interstellar Dust
    const dustCount = 1100;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const r = 120 + Math.random() * 520;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dustPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      dustPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.65;
      dustPositions[i * 3 + 2] = r * Math.cos(phi);

      const dColor =
        i % 4 === 0
          ? [0.22, 0.74, 0.97]
          : i % 4 === 1
          ? [0.66, 0.33, 0.97]
          : i % 4 === 2
          ? [0.96, 0.62, 0.04]
          : [0.06, 0.73, 0.51];
      dustColors[i * 3] = dColor[0];
      dustColors[i * 3 + 1] = dColor[1];
      dustColors[i * 3 + 2] = dColor[2];
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const cosmicDustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(cosmicDustPoints);

    // Understated Observatory Coordinate Grid & Horizon Rings
    const gridHelper = new THREE.GridHelper(1400, 36, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -225;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.22;
    scene.add(gridHelper);

    const horizonRingsGroup = new THREE.Group();
    horizonRingsGroup.position.y = -225;
    scene.add(horizonRingsGroup);

    const groundRangeRadii = [240, 480, 720];
    groundRangeRadii.forEach((radius, idx) => {
      const gRingGeo = new THREE.RingGeometry(radius - 0.5, radius + 0.5, 96);
      const gRingMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: idx === 0 ? 0.18 : 0.09,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const gRingMesh = new THREE.Mesh(gRingGeo, gRingMat);
      gRingMesh.rotation.x = Math.PI / 2;
      horizonRingsGroup.add(gRingMesh);
    });

    // Subtle Ecliptic Reference Ring
    const eclipticGeo = new THREE.TorusGeometry(540, 0.45, 8, 120);
    const eclipticMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending
    });
    const eclipticRing = new THREE.Mesh(eclipticGeo, eclipticMat);
    eclipticRing.rotation.x = Math.PI / 2 + 0.24;
    scene.add(eclipticRing);

    // Minimal Central Barycenter Marker
    const astrolabeGroup = new THREE.Group();
    scene.add(astrolabeGroup);

    const coreGeo = new THREE.OctahedronGeometry(9, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.9,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    astrolabeGroup.add(coreMesh);

    const ringRadii = [34, 54];
    const ringColors = [0x38bdf8, 0x64748b];
    ringRadii.forEach((radius, idx) => {
      const rGeo = new THREE.TorusGeometry(radius, 0.35, 12, 96);
      const rMat = new THREE.MeshBasicMaterial({
        color: ringColors[idx],
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending
      });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.rotation.x = (Math.PI / 3) * idx;
      rMesh.rotation.y = (Math.PI / 4) * idx;
      astrolabeGroup.add(rMesh);
    });

    // Polar Wormhole Gateways (Subtle)
    const wormholeGroup = new THREE.Group();
    scene.add(wormholeGroup);

    const makeWormhole = (yPos: number, colorHex: number) => {
      const g = new THREE.Group();
      g.position.set(0, yPos, 0);

      const diskGeo = new THREE.PlaneGeometry(75, 75);
      const diskMat = new THREE.ShaderMaterial({
        vertexShader: HALO_VERTEX_SHADER,
        fragmentShader: WORMHOLE_FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(colorHex) },
          uAudioBass: { value: 0 }
        },
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const disk = new THREE.Mesh(diskGeo, diskMat);
      disk.rotation.x = Math.PI / 2;
      g.add(disk);

      const torusGeo = new THREE.TorusGeometry(26, 0.6, 12, 64);
      const torusMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.35
      });
      const torus = new THREE.Mesh(torusGeo, torusMat);
      torus.rotation.x = Math.PI / 2;
      g.add(torus);

      wormholeGroup.add(g);
      return { group: g, diskMat };
    };

    const northWormhole = makeWormhole(310, 0x38bdf8);
    const southWormhole = makeWormhole(-310, 0xa855f7);

    const debrisGroup = new THREE.Group();
    scene.add(debrisGroup);

    const sentinelGroup = new THREE.Group();
    scene.add(sentinelGroup);

    // Node, Cluster, Spline, Probe, Shockwave Groups
    const clusterGroup = new THREE.Group();
    const splineGroup = new THREE.Group();
    const nodeGroup = new THREE.Group();
    const probeGroup = new THREE.Group();
    const shockwaveGroup = new THREE.Group();
    scene.add(clusterGroup);
    scene.add(splineGroup);
    scene.add(nodeGroup);
    scene.add(probeGroup);
    scene.add(shockwaveGroup);

    // Autonomous Nanoprobe Swarm (12 Probes — subtle scale)
    const nanoprobes: Nanoprobe[] = [];
    for (let i = 0; i < 12; i++) {
      const pGeo = new THREE.DodecahedronGeometry(1.6, 0);
      const pMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x10b981 : 0x38bdf8,
        blending: THREE.AdditiveBlending
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);

      const hGeo = new THREE.RingGeometry(2.2, 2.8, 12);
      const hMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      });
      const hMesh = new THREE.Mesh(hGeo, hMat);
      pMesh.add(hMesh);

      probeGroup.add(pMesh);

      nanoprobes.push({
        mesh: pMesh,
        halo: hMesh,
        sourceId: '',
        targetId: '',
        progress: Math.random(),
        speed: 0.16 + (i % 4) * 0.04,
        offset: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8
        )
      });
    }

    // Dynamic Link Segments Pool (Clean filament opacity)
    const maxLinks = 1400;
    const linkPositions = new Float32Array(maxLinks * 6);
    const linkColors = new Float32Array(maxLinks * 6);
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPositions, 3));
    linkGeo.setAttribute('color', new THREE.BufferAttribute(linkColors, 3));
    const linkMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const linkMesh = new THREE.LineSegments(linkGeo, linkMat);
    scene.add(linkMesh);

    // Subtle Photonic Link Packets
    const packetCount = 140;
    const packetPositions = new Float32Array(packetCount * 3);
    const packetColors = new Float32Array(packetCount * 3);
    for (let i = 0; i < packetCount; i++) {
      const c =
        i % 3 === 0 ? [0.22, 0.74, 0.97] : i % 3 === 1 ? [0.06, 0.73, 0.51] : [0.96, 0.62, 0.04];
      packetColors[i * 3] = c[0];
      packetColors[i * 3 + 1] = c[1];
      packetColors[i * 3 + 2] = c[2];
    }
    const packetGeo = new THREE.BufferGeometry();
    packetGeo.setAttribute('position', new THREE.BufferAttribute(packetPositions, 3));
    packetGeo.setAttribute('color', new THREE.BufferAttribute(packetColors, 3));
    const packetMat = new THREE.PointsMaterial({
      size: 3.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const packetPoints = new THREE.Points(packetGeo, packetMat);
    scene.add(packetPoints);

    // Volumetric Heatmap Group & Particles
    const heatmapGroup = new THREE.Group();
    scene.add(heatmapGroup);

    const hotspotBeaconsGroup = new THREE.Group();
    const isoContoursGroup = new THREE.Group();
    heatmapGroup.add(hotspotBeaconsGroup);
    heatmapGroup.add(isoContoursGroup);

    const heatmapGeo = new THREE.BufferGeometry();
    const heatmapPositions = new Float32Array(HEATMAP_PARTICLE_COUNT * 3);
    const heatmapIntensities = new Float32Array(HEATMAP_PARTICLE_COUNT);
    const heatmapPhases = new Float32Array(HEATMAP_PARTICLE_COUNT);

    for (let i = 0; i < HEATMAP_PARTICLE_COUNT; i++) {
      heatmapPhases[i] = Math.random() * Math.PI * 2;
      const r = 35 + Math.random() * 260;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      heatmapPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      heatmapPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      heatmapPositions[i * 3 + 2] = r * Math.cos(phi);
      heatmapIntensities[i] = 0.0;
    }

    heatmapGeo.setAttribute('position', new THREE.BufferAttribute(heatmapPositions, 3));
    heatmapGeo.setAttribute('aIntensity', new THREE.BufferAttribute(heatmapIntensities, 1));
    heatmapGeo.setAttribute('aPhase', new THREE.BufferAttribute(heatmapPhases, 1));

    const initialRamp = getPaletteColorRamps(
      propsRef.current.heatmapSettings?.palette || 'SPECTRAL_FRICTION'
    );
    const heatmapMat = new THREE.ShaderMaterial({
      vertexShader: HEATMAP_VERTEX_SHADER,
      fragmentShader: HEATMAP_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uAudioBass: { value: 0 },
        uPointSize: { value: 16.0 },
        uThreshold: { value: propsRef.current.heatmapSettings?.threshold ?? 0.12 },
        uGlobalIntensity: { value: propsRef.current.heatmapSettings?.intensity ?? 1.25 },
        uColorLow: { value: initialRamp.low },
        uColorMid: { value: initialRamp.mid },
        uColorHigh: { value: initialRamp.high },
        uColorPeak: { value: initialRamp.peak }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const heatmapPoints = new THREE.Points(heatmapGeo, heatmapMat);
    heatmapGroup.add(heatmapPoints);

    sceneObjectsRef.current = {
      scene,
      camera,
      controls,
      composer,
      chromaticPass,
      anamorphicPass,
      filmGrainPass,
      fxaaPass,
      nodeGroup,
      clusterGroup,
      splineGroup,
      probeGroup,
      debrisGroup,
      shockwaveGroup,
      wormholeGroup,
      volumetricShaftsGroup,
      volumetricLightMat,
      contactRadianceGroup,
      nebulaPoints,
      starPoints,
      cosmicDustPoints,
      horizonRingsGroup,
      linkMesh,
      packetPoints,
      gridHelper,
      astrolabeGroup,
      sentinelGroup,
      dirLight1,
      dirLight2,
      dirLight3,
      heatmapGroup,
      heatmapPoints,
      heatmapGeo,
      heatmapMat,
      hotspotBeaconsGroup,
      isoContoursGroup
    };

    // Pointer Events & Hover LOD Detection
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: MouseEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: MouseEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      if (hotspotBeaconsGroup.children.length > 0 && heatmapGroup.visible) {
        const beaconHits = raycaster.intersectObjects(hotspotBeaconsGroup.children, true);
        if (beaconHits.length > 0) {
          let targetObj: THREE.Object3D | null = beaconHits[0].object;
          while (targetObj && !targetObj.userData?.hotspot && targetObj.parent) {
            targetObj = targetObj.parent;
          }
          if (targetObj?.userData?.hotspot) {
            propsRef.current.onSelectHotspot?.(targetObj.userData.hotspot);
            return;
          }
        }
      }

      const wormholeMeshes = [northWormhole.group.children[0], southWormhole.group.children[0]];
      const whHits = raycaster.intersectObjects(wormholeMeshes, false);
      if (whHits.length > 0) {
        propsRef.current.onWormholeTraverse?.();
        return;
      }

      const meshes: THREE.Object3D[] = [];
      simNodesRef.current.forEach(s => {
        if (s.mesh.visible) meshes.push(s.mesh);
      });

      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        simNodesRef.current.forEach(s => {
          if (s.mesh === hitMesh) {
            emitSpatialChime(s.pos, 440 + Math.round(s.node.confidence * 400));
            propsRef.current.onSelectNode(s.node);
          }
        });
      }
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const beaconHits =
        hotspotBeaconsGroup.children.length > 0 && heatmapGroup.visible
          ? raycaster.intersectObjects(hotspotBeaconsGroup.children, true)
          : [];

      const meshes: THREE.Object3D[] = [];
      simNodesRef.current.forEach(s => {
        if (s.mesh.visible) meshes.push(s.mesh);
      });
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        let foundHoverId: string | null = null;
        simNodesRef.current.forEach(s => {
          if (s.mesh === hitMesh) foundHoverId = s.id;
        });
        hoveredNodeIdRef.current = foundHoverId;
      } else {
        hoveredNodeIdRef.current = null;
      }

      renderer.domElement.style.cursor =
        intersects.length > 0 || beaconHits.length > 0 ? 'pointer' : 'grab';
    };

    renderer.domElement.addEventListener('mousedown', onPointerDown);
    renderer.domElement.addEventListener('mouseup', onPointerUp);
    renderer.domElement.addEventListener('mousemove', onPointerMove);

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
          composer.setSize(w, h);
          fxaaPass.material.uniforms['resolution'].value.set(1 / w, 1 / h);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let animId = 0;
    let isDisposed = false;
    let heatmapTick = 0;
    const clock = new THREE.Clock();
    const projVec = new THREE.Vector3();

    const animate = () => {
      if (isDisposed) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const currentProps = propsRef.current;
      const spectrum = getAudioSpectrum();

      let bassSum = 0;
      let highSum = 0;
      for (let i = 0; i < 8; i++) bassSum += spectrum[i];
      for (let i = 16; i < 32; i++) highSum += spectrum[i];
      const audioBass = bassSum / (8 * 255);
      const audioHigh = highSum / (16 * 255);

      const epistemicWeights = calculateNodeEpistemicWeights(
        currentProps.nodes,
        currentProps.links,
        currentProps.clusters
      );

      // Space Weather Modulations
      const weather = currentProps.spaceWeather || 'QUIET_SPACE';
      let weatherLight1 = 0x38bdf8;
      let weatherLight2 = 0xf43f5e;
      let weatherSpeedMult = 1.0;

      if (weather === 'SOLAR_FLARE') {
        weatherLight1 = 0xf59e0b;
        weatherLight2 = 0xea580c;
        weatherSpeedMult = 1.5;
        dirLight1.intensity = 2.8 + Math.sin(elapsed * 6) * 0.5;
      } else if (weather === 'COSMIC_RAY_STORM') {
        weatherLight1 = 0xa855f7;
        weatherLight2 = 0x10b981;
        weatherSpeedMult = 1.9;
        dirLight1.intensity = 2.6;
      } else if (weather === 'GRAVITATIONAL_SURGE') {
        weatherLight1 = 0x38bdf8;
        weatherLight2 = 0x93c5fd;
        weatherSpeedMult = 0.65;
        dirLight1.intensity = 2.3;
      } else {
        dirLight1.intensity = 2.4;
      }
      dirLight1.color.setHex(weatherLight1);
      dirLight2.color.setHex(weatherLight2);

      if (filmGrainPass && filmGrainPass.material.uniforms['uTime']) {
        filmGrainPass.material.uniforms['uTime'].value = elapsed;
      }
      if (volumetricLightMat && volumetricLightMat.uniforms.uTime) {
        volumetricLightMat.uniforms.uTime.value = elapsed;
        volumetricLightMat.uniforms.uAudioBass.value = audioBass;
        volumetricLightMat.uniforms.uColor.value.setHex(weatherLight1);
      }
      if (counterMat && counterMat.uniforms.uTime) {
        counterMat.uniforms.uTime.value = elapsed * 0.85;
        counterMat.uniforms.uAudioBass.value = audioBass;
      }

      controls.autoRotateSpeed = currentProps.visualSettings.rotationSpeed * 1.1 * weatherSpeedMult;
      starMat.opacity = Math.min(0.85, (currentProps.visualSettings.particleDensity / 100) * 0.75);
      starPoints.rotation.y = elapsed * 0.012 * weatherSpeedMult;

      nebulaPoints.rotation.y = elapsed * 0.016 * weatherSpeedMult;
      (nebulaMat as THREE.PointsMaterial).opacity = 0.14 + audioBass * 0.12;

      northWormhole.diskMat.uniforms.uTime.value = elapsed;
      northWormhole.diskMat.uniforms.uAudioBass.value = audioBass;
      southWormhole.diskMat.uniforms.uTime.value = elapsed;
      southWormhole.diskMat.uniforms.uAudioBass.value = audioBass;
      northWormhole.group.rotation.y = elapsed * 0.35;
      southWormhole.group.rotation.y = -elapsed * 0.35;

      if (gridHelper) {
        gridHelper.visible = currentProps.lens === 'MATRIX' || currentProps.lens === 'ORBIT';
      }

      if (astrolabeGroup) {
        astrolabeGroup.visible = currentProps.lens !== 'MATRIX';
        astrolabeGroup.children.forEach((child, idx) => {
          if (idx === 0) {
            const s = 1 + audioBass * 0.35 + Math.sin(elapsed * 2.0) * 0.05;
            child.scale.setScalar(s);
            child.rotation.y = elapsed * 0.5;
            child.rotation.x = elapsed * 0.3;
          } else {
            child.rotation.z += delta * (0.2 + idx * 0.08) * (idx % 2 === 0 ? 1 : -1);
            child.rotation.x += delta * 0.12;
          }
        });
      }

      for (let i = shockwaveGroup.children.length - 1; i >= 0; i--) {
        const wave = shockwaveGroup.children[i] as THREE.Mesh;
        const age = (performance.now() - wave.userData.birthTime) / 1000;
        if (age > 2.2) {
          wave.geometry.dispose();
          (wave.material as THREE.Material).dispose();
          shockwaveGroup.remove(wave);
        } else {
          const progress = age / 2.2;
          const easeOut = 1 - Math.pow(1 - progress, 3);
          wave.scale.setScalar(1 + easeOut * wave.userData.maxScale);
          wave.lookAt(camera.position);
          (wave.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.75;
        }
      }

      clusterGroup.children.forEach(obj => {
        const mesh = obj as THREE.Mesh;
        const mat = mesh.material as THREE.ShaderMaterial;
        if (mat.uniforms) {
          mat.uniforms.uTime.value = elapsed;
          mat.uniforms.uAudioBass.value = audioBass;
          mat.uniforms.uAudioHigh.value = audioHigh;
          mat.uniforms.uIntensity.value =
            currentProps.lens === 'NEBULA'
              ? 0.75
              : currentProps.lens === 'MATRIX'
              ? 0.15
              : 0.42;
        }
        mesh.lookAt(camera.position);
      });

      splineGroup.children.forEach(tube => {
        const mat = (tube as THREE.Mesh).material as THREE.ShaderMaterial;
        if (mat && mat.uniforms) {
          mat.uniforms.uTime.value = elapsed;
          mat.uniforms.uAudioBass.value = audioBass;
        }
      });

      const simMap = simNodesRef.current;
      const simArray: SimNode[] = Array.from(simMap.values());
      const clusterLookup = new Map<string, Cluster>(
        currentProps.clusters.map(c => [c.id, c] as [string, Cluster])
      );
      const phys = currentProps.physicsSettings;
      const expMode = currentProps.visualSettings.expansionType;
      const expMult =
        expMode === ExpansionType.EXPLOSIVE
          ? 1.38
          : expMode === ExpansionType.CRYSTALLINE
          ? 0.72
          : 1.0;

      const selectedId = currentProps.selectedNode?.id;
      const hoveredId = hoveredNodeIdRef.current;
      const focusNodeId = hoveredId || selectedId;
      const egoNeighbors = new Set<string>();
      if (focusNodeId) {
        egoNeighbors.add(focusNodeId);
        currentProps.links.forEach(l => {
          if (l.source === focusNodeId) egoNeighbors.add(l.target);
          if (l.target === focusNodeId) egoNeighbors.add(l.source);
        });
      }

      if (!phys.freezeLayout && simArray.length > 0) {
        for (let i = 0; i < simArray.length; i++) {
          const a = simArray[i];
          const cluster = clusterLookup.get(a.node.clusterId);

          if (currentProps.lens === 'MATRIX') {
            const wNode = epistemicWeights.get(a.node.id);
            const targetX = ((a.node.confidence || 0.8) - 0.5) * 480;
            const targetY = ((wNode?.friction || 0.3) - 0.5) * 360;
            const targetZ = ((a.node.generation || 0) - 1) * 75;
            a.vel.x += (targetX - a.pos.x) * 0.08;
            a.vel.y += (targetY - a.pos.y) * 0.08;
            a.vel.z += (targetZ - a.pos.z) * 0.08;
          } else if (cluster) {
            const cx = cluster.center.x * expMult;
            const cy = cluster.center.y * expMult;
            const cz = cluster.center.z * expMult;
            a.vel.x += (cx - a.pos.x) * phys.clusterGravity * 0.14;
            a.vel.y += (cy - a.pos.y) * phys.clusterGravity * 0.14;
            a.vel.z += (cz - a.pos.z) * phys.clusterGravity * 0.14;
          }

          for (let j = i + 1; j < simArray.length; j++) {
            const b = simArray[j];
            const dx = a.pos.x - b.pos.x;
            const dy = a.pos.y - b.pos.y;
            const dz = a.pos.z - b.pos.z;
            const distSq = dx * dx + dy * dy + dz * dz + 16;
            if (distSq < 26000) {
              const force = (phys.repulsionStrength * 12) / distSq;
              const invDist = 1 / Math.sqrt(distSq);
              const fx = dx * invDist * force;
              const fy = dy * invDist * force;
              const fz = dz * invDist * force;
              a.vel.x += fx;
              a.vel.y += fy;
              a.vel.z += fz;
              b.vel.x -= fx;
              b.vel.y -= fy;
              b.vel.z -= fz;
            }
          }
        }

        for (const link of currentProps.links) {
          const sourceSim = simMap.get(link.source);
          const targetSim = simMap.get(link.target);
          if (sourceSim && targetSim) {
            const wS = epistemicWeights.get(link.source)?.friction ?? 0.2;
            const wT = epistemicWeights.get(link.target)?.friction ?? 0.2;
            const linkFriction = Math.min(
              1.0,
              (wS + wT) / 2 + (link.relation === 'CONTRADICTS' ? 0.42 : 0)
            );

            const dx = targetSim.pos.x - sourceSim.pos.x;
            const dy = targetSim.pos.y - sourceSim.pos.y;
            const dz = targetSim.pos.z - sourceSim.pos.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

            const frictionContract = 1.0 - 0.42 * linkFriction;
            const targetDist = phys.linkDistance * expMult * frictionContract;
            const diff = (dist - targetDist) * (0.008 + 0.015 * linkFriction);

            const fx = (dx / dist) * diff;
            const fy = (dy / dist) * diff;
            const fz = (dz / dist) * diff;
            sourceSim.vel.x += fx;
            sourceSim.vel.y += fy;
            sourceSim.vel.z += fz;
            targetSim.vel.x -= fx;
            targetSim.vel.y -= fy;
            targetSim.vel.z -= fz;
          }
        }
      }

      const highlightSet = new Set([
        ...(currentProps.activeScene?.intelligence.highlightNodes || []),
        ...currentProps.highlightedNodeIds
      ]);
      const maxPlaybackGen = currentProps.temporalPlaybackGen;

      const viewWidth = renderer.domElement.clientWidth;
      const viewHeight = renderer.domElement.clientHeight;
      const isAuditView = currentProps.lens === 'AUDIT';

      // Update Cluster Anchor Labels (LOD)
      currentProps.clusters.forEach(cluster => {
        const el = clusterLabelElementsRef.current.get(cluster.id);
        if (!el) return;
        const clusterActive = currentProps.clusterFilter.activeClusters[cluster.id] ?? true;
        if (isAuditView || !clusterActive || currentProps.lens === 'MATRIX') {
          el.style.opacity = '0';
          return;
        }
        projVec.set(
          cluster.center.x * expMult,
          cluster.center.y * expMult + 52,
          cluster.center.z * expMult
        );
        const distToCam = camera.position.distanceTo(projVec);
        projVec.project(camera);

        if (projVec.z > 1 || distToCam < 110 || distToCam > 1800) {
          el.style.opacity = '0';
        } else {
          const x = (projVec.x * 0.5 + 0.5) * viewWidth;
          const y = (-(projVec.y * 0.5) + 0.5) * viewHeight;
          el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
          el.style.opacity = distToCam < 220 ? '0.45' : '0.88';
        }
      });

      for (const s of simArray) {
        const cluster = clusterLookup.get(s.node.clusterId);
        const visibleByCluster =
          (currentProps.clusterFilter.activeClusters[s.node.clusterId] ?? true) &&
          (cluster ? currentProps.clusterFilter.stabilityFilter[cluster.stability] : true);
        const visibleByConfidence = s.node.confidence >= currentProps.clusterFilter.minConfidence;
        const isVisible = visibleByCluster && visibleByConfidence;

        s.mesh.visible = isVisible;
        const labelEl = nodeLabelElementsRef.current.get(s.id);

        if (!isVisible || isAuditView) {
          if (labelEl) labelEl.style.opacity = '0';
          continue;
        }

        if (!phys.freezeLayout) {
          s.vel.multiplyScalar(0.84);
          s.pos.add(s.vel);
        }

        s.mesh.position.copy(s.pos);
        s.mesh.rotation.y += delta * 0.45;
        s.mesh.rotation.x += delta * 0.22;

        const isSelected = selectedId === s.id;
        const isHovered = hoveredId === s.id;
        const isHighlighted = highlightSet.has(s.id);
        const isEgoNeighbor = focusNodeId ? egoNeighbors.has(s.id) : true;

        const isFutureGhost =
          maxPlaybackGen !== null &&
          maxPlaybackGen !== undefined &&
          (s.node.generation || 0) > maxPlaybackGen;

        const mat = s.mesh.material as THREE.MeshStandardMaterial;
        if (isFutureGhost) {
          mat.transparent = true;
          mat.opacity = 0.2;
          mat.wireframe = true;
          mat.emissiveIntensity = 0.15;
          s.reticle.visible = false;
        } else {
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.wireframe = false;
          mat.emissiveIntensity =
            isSelected || isHovered
              ? 1.75
              : isHighlighted
              ? 1.15 + audioBass * 0.5
              : isEgoNeighbor
              ? 0.55 + (currentProps.visualSettings.bloomIntensity / 10) * 0.35
              : 0.2;

          const audioPulse = isHighlighted ? audioBass * 0.35 : audioBass * 0.1;
          const targetScale =
            (isSelected || isHovered
              ? 1.6
              : isHighlighted
              ? 1.28
              : isEgoNeighbor
              ? 1.0
              : 0.72) + audioPulse;
          s.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.14);

          s.reticle.visible = isSelected || isHovered || isHighlighted;
          if (s.reticle.visible) {
            s.reticle.lookAt(camera.position);
            s.reticle.rotation.z = elapsed * (isSelected || isHovered ? 1.6 : 0.8);
          }
        }

        if (s.genRing) {
          s.genRing.rotation.x = elapsed * 1.1;
          s.genRing.rotation.y = elapsed * 0.9;
        }

        // Progressive 3D Level-of-Detail (LOD) Label Update
        if (labelEl) {
          projVec.copy(s.pos);
          projVec.y -= 10;
          const distToCam = camera.position.distanceTo(s.pos);
          projVec.project(camera);

          const isLandmark = (s.node.val || 15) >= 21;
          const isCloseZoom = distToCam < 290;
          const shouldShowLabel =
            !isFutureGhost &&
            projVec.z <= 1 &&
            (isSelected ||
              isHovered ||
              isHighlighted ||
              (focusNodeId && egoNeighbors.has(s.id)) ||
              isCloseZoom ||
              (isLandmark && !focusNodeId && distToCam < 720));

          if (!shouldShowLabel) {
            labelEl.style.opacity = '0';
          } else {
            const x = (projVec.x * 0.5 + 0.5) * viewWidth;
            const y = (-(projVec.y * 0.5) + 0.5) * viewHeight;
            labelEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, 6px)`;

            const pillEl = labelEl.querySelector('.node-label-pill') as HTMLElement | null;
            const metaEl = labelEl.querySelector('.node-label-meta') as HTMLElement | null;

            if (isSelected || isHovered) {
              labelEl.style.opacity = '1';
              labelEl.style.zIndex = '25';
              if (pillEl) {
                pillEl.style.borderColor = 'rgba(56, 189, 248, 0.65)';
              }
              if (metaEl) metaEl.classList.remove('hidden');
            } else {
              labelEl.style.opacity = isCloseZoom || isHighlighted ? '0.92' : '0.72';
              labelEl.style.zIndex = '10';
              if (pillEl) {
                pillEl.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }
              if (metaEl) {
                if (distToCam < 185) metaEl.classList.remove('hidden');
                else metaEl.classList.add('hidden');
              }
            }
          }
        }
      }

      // Animate Nanoprobe Swarm
      if (currentProps.links.length > 0 && simArray.length >= 2) {
        nanoprobes.forEach((probe, pIdx) => {
          probe.progress += delta * probe.speed;
          if (probe.progress >= 1 || !probe.sourceId || !probe.targetId) {
            probe.progress = 0;
            const randomLink =
              currentProps.links[(pIdx + Math.floor(elapsed)) % currentProps.links.length];
            probe.sourceId = randomLink.source;
            probe.targetId = randomLink.target;
          }

          const sNode = simMap.get(probe.sourceId);
          const tNode = simMap.get(probe.targetId);
          if (sNode && tNode) {
            const p = probe.progress;
            probe.mesh.position
              .lerpVectors(sNode.pos, tNode.pos, p)
              .add(probe.offset);
            probe.mesh.rotation.y = elapsed * 1.6;
            probe.halo.rotation.z = elapsed * 2.2;
          }
        });
      }

      // Update Links & Photonic Packets
      let linkIdx = 0;
      const posAttr = linkGeo.attributes.position as THREE.BufferAttribute;
      const colAttr = linkGeo.attributes.color as THREE.BufferAttribute;
      const validLinks: { s: THREE.Vector3; t: THREE.Vector3 }[] = [];

      for (const link of currentProps.links) {
        if (linkIdx >= maxLinks) break;
        const s = simMap.get(link.source);
        const t = simMap.get(link.target);
        if (s && t && s.mesh.visible && t.mesh.visible) {
          validLinks.push({ s: s.pos, t: t.pos });
          const base = linkIdx * 6;
          linkPositions[base] = s.pos.x;
          linkPositions[base + 1] = s.pos.y;
          linkPositions[base + 2] = s.pos.z;
          linkPositions[base + 3] = t.pos.x;
          linkPositions[base + 4] = t.pos.y;
          linkPositions[base + 5] = t.pos.z;

          const isEgoLink =
            focusNodeId && (link.source === focusNodeId || link.target === focusNodeId);

          const wS = epistemicWeights.get(link.source)?.friction ?? 0.2;
          const wT = epistemicWeights.get(link.target)?.friction ?? 0.2;
          const linkFriction = Math.min(
            1.0,
            (wS + wT) / 2 + (link.relation === 'CONTRADICTS' ? 0.42 : 0)
          );

          let colorHex = 0x38bdf8;
          if (isEgoLink) {
            colorHex = 0x7dd3fc;
          } else if (linkFriction > 0.62) {
            colorHex = 0xf43f5e;
          } else if (linkFriction > 0.35) {
            colorHex = 0xf59e0b;
          } else if (link.relation === 'SUPPORTS') {
            colorHex = 0x10b981;
          }

          const dimFactor = focusNodeId && !isEgoLink ? 0.16 : isEgoLink ? 1.2 : 0.65;
          const c = new THREE.Color(colorHex).multiplyScalar(dimFactor);

          linkColors[base] = c.r;
          linkColors[base + 1] = c.g;
          linkColors[base + 2] = c.b;
          linkColors[base + 3] = c.r * 0.55;
          linkColors[base + 4] = c.g * 0.55;
          linkColors[base + 5] = c.b * 0.55;
          linkIdx++;
        }
      }
      linkGeo.setDrawRange(0, linkIdx * 2);
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      if (validLinks.length > 0) {
        const pAttr = packetGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < packetCount; i++) {
          const vl = validLinks[i % validLinks.length];
          const t = (elapsed * (0.3 + (i % 5) * 0.08) + i * 0.17) % 1.0;
          packetPositions[i * 3] = vl.s.x + (vl.t.x - vl.s.x) * t;
          packetPositions[i * 3 + 1] = vl.s.y + (vl.t.y - vl.s.y) * t;
          packetPositions[i * 3 + 2] = vl.s.z + (vl.t.z - vl.s.z) * t;
        }
        pAttr.needsUpdate = true;
      }

      // Volumetric Heatmap Field Update
      const hSettings = currentProps.heatmapSettings || DEFAULT_HEATMAP_SETTINGS;
      const {
        heatmapGroup,
        heatmapGeo,
        heatmapMat,
        hotspotBeaconsGroup,
        isoContoursGroup
      } = sceneObjectsRef.current;

      heatmapGroup.visible = hSettings.enabled;

      if (hSettings.enabled) {
        heatmapMat.uniforms.uTime.value = elapsed;
        heatmapMat.uniforms.uAudioBass.value = hSettings.pulseWithAudio ? audioBass : 0.0;
        heatmapMat.uniforms.uThreshold.value = hSettings.threshold;
        heatmapMat.uniforms.uGlobalIntensity.value = hSettings.intensity;

        const currentRamp = getPaletteColorRamps(hSettings.palette);
        heatmapMat.uniforms.uColorLow.value.copy(currentRamp.low);
        heatmapMat.uniforms.uColorMid.value.copy(currentRamp.mid);
        heatmapMat.uniforms.uColorHigh.value.copy(currentRamp.high);
        heatmapMat.uniforms.uColorPeak.value.copy(currentRamp.peak);

        heatmapTick++;
        if (heatmapTick % 4 === 0 && simArray.length > 0) {
          const weights = calculateNodeEpistemicWeights(
            currentProps.nodes,
            currentProps.links,
            currentProps.clusters
          );

          const activeNodesList: { pos: THREE.Vector3; weight: number }[] = [];
          for (const s of simArray) {
            if (s.mesh.visible) {
              const w = weights.get(s.id);
              const score =
                hSettings.mode === 'FRICTION'
                  ? w?.friction ?? 0.1
                  : hSettings.mode === 'ACTIVITY'
                  ? w?.activity ?? 0.1
                  : w?.composite ?? 0.1;
              activeNodesList.push({ pos: s.pos, weight: score });
            }
          }

          if (activeNodesList.length > 0) {
            const posArray = heatmapGeo.attributes.position.array as Float32Array;
            const intAttr = heatmapGeo.attributes.aIntensity as THREE.BufferAttribute;
            const intArray = intAttr.array as Float32Array;
            const rSq = (hSettings.radius || 70) * (hSettings.radius || 70);

            for (let i = 0; i < HEATMAP_PARTICLE_COUNT; i++) {
              const px = posArray[i * 3];
              const py = posArray[i * 3 + 1];
              const pz = posArray[i * 3 + 2];
              let fieldVal = 0;

              for (let j = 0; j < activeNodesList.length; j++) {
                const an = activeNodesList[j];
                const dx = px - an.pos.x;
                const dy = py - an.pos.y;
                const dz = pz - an.pos.z;
                const dSq = dx * dx + dy * dy + dz * dz;
                if (dSq < rSq * 3.0) {
                  fieldVal += an.weight * Math.exp(-dSq / rSq);
                }
              }
              intArray[i] = Math.min(1.0, fieldVal);
            }
            intAttr.needsUpdate = true;
          }
        }

        hotspotBeaconsGroup.visible = hSettings.showHotspots;
        isoContoursGroup.visible = hSettings.showIsoContours;

        if (hSettings.showHotspots) {
          hotspotBeaconsGroup.children.forEach((beacon, bIdx) => {
            beacon.rotation.y = elapsed * (0.6 + (bIdx % 3) * 0.2);
            const beaconRing = beacon.children[1];
            if (beaconRing) {
              const ringScale = 1.0 + Math.sin(elapsed * 2.2 + bIdx) * 0.1 + audioBass * 0.15;
              beaconRing.scale.set(ringScale, ringScale, 1.0);
            }
          });
        }

        if (hSettings.showIsoContours) {
          isoContoursGroup.children.forEach((contour, cIdx) => {
            contour.rotation.x = elapsed * 0.35 + cIdx;
            contour.rotation.y = elapsed * 0.25 + cIdx * 0.4;
            const breathe = 1.0 + Math.sin(elapsed * 1.6 + cIdx) * 0.06 + audioBass * 0.1;
            contour.scale.setScalar(breathe);
          });
        }
      }

      // Camera Target Slerp
      const targetOverride = currentProps.cameraTargetOverride;
      const activeCamTarget = currentProps.activeScene?.camera.target;
      const goalTarget = targetOverride || activeCamTarget;

      if (goalTarget) {
        const desiredLook = new THREE.Vector3(goalTarget.x, goalTarget.y, goalTarget.z);
        cameraTargetVec.current.lerp(desiredLook, 0.05);
        controls.target.copy(cameraTargetVec.current);

        if (cameraPosGoalVec.current) {
          camera.position.lerp(cameraPosGoalVec.current, 0.035);
          if (camera.position.distanceTo(cameraPosGoalVec.current) < 8) {
            cameraPosGoalVec.current = null;
          }
        }
      }

      updateSpatialAudioListener(camera);
      controls.update();
      composer.render();
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('mousedown', onPointerDown);
      renderer.domElement.removeEventListener('mouseup', onPointerUp);
      renderer.domElement.removeEventListener('mousemove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', stopAutoGoal);
      renderer.domElement.removeEventListener('wheel', stopAutoGoal);
      controls.dispose();
      composer.dispose();
      renderer.dispose();
    };
  }, []);

  // Fly-through trigger
  useEffect(() => {
    const goal = cameraTargetOverride || activeScene?.camera.target;
    if (goal) {
      cameraPosGoalVec.current = new THREE.Vector3(
        goal.x * 1.25 + 75,
        goal.y + 85,
        goal.z * 1.25 + 215
      );
    }
  }, [activeScene?.sceneId, cameraTargetOverride]);

  // Synchronize Nodes, Clusters, and Debris
  useEffect(() => {
    const objs = sceneObjectsRef.current;
    if (!objs) return;

    const { nodeGroup, clusterGroup, splineGroup, debrisGroup, contactRadianceGroup } = objs;
    const simMap = simNodesRef.current;

    while (contactRadianceGroup.children.length > 0) {
      const child = contactRadianceGroup.children[0] as THREE.Mesh;
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      contactRadianceGroup.remove(child);
    }

    clusters.forEach(cluster => {
      const isSubCluster = (cluster.level || 0) > 0;
      const radius = isSubCluster ? 105 : 175;
      const radGeo = new THREE.PlaneGeometry(radius * 2, radius * 2);
      const clusterCol = CLUSTER_COLORS[cluster.stability] || 0x38bdf8;
      const radMat = new THREE.MeshBasicMaterial({
        map: contactRadianceTexture,
        color: clusterCol,
        transparent: true,
        opacity: isSubCluster ? 0.18 : 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const radMesh = new THREE.Mesh(radGeo, radMat);
      radMesh.rotation.x = Math.PI / 2;
      radMesh.position.set(cluster.center.x, 0, cluster.center.z);
      contactRadianceGroup.add(radMesh);
    });

    while (clusterGroup.children.length > 0) {
      const child = clusterGroup.children[0] as THREE.Mesh;
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      clusterGroup.remove(child);
    }

    clusters.forEach(cluster => {
      const isSubCluster = (cluster.level || 0) > 0;
      const size = isSubCluster ? 130 : 220;
      const planeGeo = new THREE.PlaneGeometry(size, size);
      const color = new THREE.Color(CLUSTER_COLORS[cluster.stability] || 0x38bdf8);
      const shaderMat = new THREE.ShaderMaterial({
        vertexShader: HALO_VERTEX_SHADER,
        fragmentShader: HALO_FRAGMENT_SHADER,
        uniforms: {
          uColor: { value: color },
          uTime: { value: 0 },
          uAudioBass: { value: 0 },
          uAudioHigh: { value: 0 },
          uIntensity: { value: isSubCluster ? 0.35 : 0.5 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const haloMesh = new THREE.Mesh(planeGeo, shaderMat);
      haloMesh.position.set(cluster.center.x, cluster.center.y, cluster.center.z);
      clusterGroup.add(haloMesh);
    });

    // Subtle Inter-Cluster Filaments
    while (splineGroup.children.length > 0) {
      const child = splineGroup.children[0] as THREE.Mesh;
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      splineGroup.remove(child);
    }

    if (clusters.length >= 2) {
      for (let i = 0; i < clusters.length; i++) {
        const cA = clusters[i];
        const cB = clusters[(i + 1) % clusters.length];
        const pA = new THREE.Vector3(cA.center.x, cA.center.y, cA.center.z);
        const pB = new THREE.Vector3(cB.center.x, cB.center.y, cB.center.z);
        const mid = pA
          .clone()
          .add(pB)
          .multiplyScalar(0.5)
          .add(new THREE.Vector3(0, 50 * (i % 2 === 0 ? 1 : -1), 0));

        const curve = new THREE.CatmullRomCurve3([pA, mid, pB]);
        const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.75, 8, false);
        const colorHex = i % 2 === 0 ? 0x38bdf8 : 0x64748b;
        const tubeMat = new THREE.ShaderMaterial({
          vertexShader: CONDUIT_VERTEX_SHADER,
          fragmentShader: CONDUIT_FRAGMENT_SHADER,
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(colorHex) },
            uAudioBass: { value: 0 }
          },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        splineGroup.add(tubeMesh);
      }
    }

    while (debrisGroup.children.length > 0) {
      const child = debrisGroup.children[0] as THREE.Mesh;
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      debrisGroup.remove(child);
    }

    const incomingIds = new Set(nodes.map(n => n.id));
    simMap.forEach((sim, id) => {
      if (!incomingIds.has(id)) {
        sim.mesh.geometry.dispose();
        (sim.mesh.material as THREE.Material).dispose();
        nodeGroup.remove(sim.mesh);
        simMap.delete(id);
      }
    });

    const clusterMap = new Map<string, Cluster>(
      clusters.map(c => [c.id, c] as [string, Cluster])
    );
    nodes.forEach((node, idx) => {
      const existing = simMap.get(node.id);
      if (existing) {
        existing.node = node;
        return;
      }

      const cluster = clusterMap.get(node.clusterId);
      const baseCenter = cluster?.center || { x: 0, y: 0, z: 0 };
      const angle = (idx * 2.39996) % (Math.PI * 2);
      const radius = 26 + (idx % 7) * 14;

      const initPos = new THREE.Vector3(
        node.x ?? baseCenter.x + Math.cos(angle) * radius,
        node.y ?? baseCenter.y + ((idx % 5) - 2) * 18,
        node.z ?? baseCenter.z + Math.sin(angle) * radius
      );

      const size = Math.max(4.4, Math.min(12.0, (node.val || 15) * 0.4));
      const geom =
        node.type === NodeType.CONTRADICTION
          ? new THREE.OctahedronGeometry(size * 1.1, 0)
          : node.type === NodeType.CLAIM
          ? new THREE.IcosahedronGeometry(size, 1)
          : new THREE.DodecahedronGeometry(size * 0.92, 0);

      const colorHex = NODE_COLORS[node.type] || 0x38bdf8;
      const normalMapTex =
        node.type === NodeType.CLAIM || node.type === NodeType.EVIDENCE
          ? techNormalMap
          : metalNormalMap;

      const mat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.65,
        roughness: node.type === NodeType.CONTRADICTION ? 0.32 : 0.16,
        metalness: node.type === NodeType.EVIDENCE ? 0.9 : 0.82,
        clearcoat: 0.9,
        clearcoatRoughness: 0.1,
        anisotropy: 0.75,
        iridescence: 0.7,
        iridescenceIOR: 1.34,
        iridescenceThicknessRange: [120, 380],
        transmission: 0.45,
        thickness: 1.4,
        ior: 1.52,
        normalMap: normalMapTex,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughnessMap: crystalRoughnessMap
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(initPos);

      const wireGeo = new THREE.WireframeGeometry(geom);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending
      });
      const wireframe = new THREE.LineSegments(wireGeo, wireMat);
      wireframe.scale.setScalar(1.06);
      mesh.add(wireframe);

      const ringGeo = new THREE.RingGeometry(size * 1.45, size * 1.65, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const reticle = new THREE.Mesh(ringGeo, ringMat);
      reticle.visible = false;
      mesh.add(reticle);

      let genRing: THREE.Mesh | undefined;
      if ((node.generation || 0) > 0) {
        const gGeo = new THREE.TorusGeometry(size * 1.3, 0.25, 8, 32);
        const gMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending
        });
        genRing = new THREE.Mesh(gGeo, gMat);
        mesh.add(genRing);
      }

      nodeGroup.add(mesh);

      simMap.set(node.id, {
        id: node.id,
        node,
        pos: initPos,
        vel: new THREE.Vector3(),
        mesh,
        wireframe,
        reticle,
        genRing
      });
    });

    // Update Volumetric Heatmap Sample Distribution & Epicenter Beacons
    const { heatmapGeo, hotspotBeaconsGroup, isoContoursGroup } = objs;

    const simNodesList: SimNode[] = Array.from(simMap.values());
    if (simNodesList.length > 0) {
      const posArray = heatmapGeo.attributes.position.array as Float32Array;
      const numParticles = HEATMAP_PARTICLE_COUNT;

      for (let i = 0; i < numParticles; i++) {
        if (i < numParticles * 0.75) {
          const targetNode = simNodesList[i % simNodesList.length];
          const jitterR = 12 + Math.random() * 45;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          posArray[i * 3] = targetNode.pos.x + jitterR * Math.sin(phi) * Math.cos(theta);
          posArray[i * 3 + 1] = targetNode.pos.y + jitterR * Math.sin(phi) * Math.sin(theta) * 0.8;
          posArray[i * 3 + 2] = targetNode.pos.z + jitterR * Math.cos(phi);
        } else {
          const targetCluster = clusters[i % clusters.length] || { center: { x: 0, y: 0, z: 0 } };
          const cCenter = targetCluster.center;
          const jitterR = 25 + Math.random() * 115;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          posArray[i * 3] = cCenter.x + jitterR * Math.sin(phi) * Math.cos(theta);
          posArray[i * 3 + 1] = cCenter.y + jitterR * Math.sin(phi) * Math.sin(theta) * 0.65;
          posArray[i * 3 + 2] = cCenter.z + jitterR * Math.cos(phi);
        }
      }
      heatmapGeo.attributes.position.needsUpdate = true;
    }

    const nodePosMap = new Map<string, THREE.Vector3>();
    simMap.forEach((s, id) => {
      nodePosMap.set(id, s.pos);
    });

    const hMode = propsRef.current.heatmapSettings?.mode || 'FRICTION';
    const detected = detectEpistemicHotspots(nodes, nodePosMap, links, clusters, hMode, 5);
    propsRef.current.onHotspotsDetected?.(detected);

    while (hotspotBeaconsGroup.children.length > 0) {
      const child = hotspotBeaconsGroup.children[0] as THREE.Object3D;
      child.traverse(obj => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        if ((obj as THREE.Mesh).material) {
          const m = (obj as THREE.Mesh).material;
          if (Array.isArray(m)) m.forEach(mat => mat.dispose());
          else m.dispose();
        }
      });
      hotspotBeaconsGroup.remove(child);
    }

    while (isoContoursGroup.children.length > 0) {
      const child = isoContoursGroup.children[0] as THREE.Mesh;
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      isoContoursGroup.remove(child);
    }

    detected.forEach((spot, idx) => {
      const isFriction = spot.category !== 'ACTIVITY_SURGE';
      const colorHex = isFriction ? 0xf43f5e : 0x10b981;
      const spotGroup = new THREE.Group();
      spotGroup.position.set(spot.position.x, spot.position.y, spot.position.z);
      spotGroup.userData = { hotspot: spot, isHotspotBeacon: true };

      const colGeo = new THREE.CylinderGeometry(0.5, 0.5, 85, 12, 1, true);
      const colMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const colMesh = new THREE.Mesh(colGeo, colMat);
      colMesh.userData = { hotspot: spot };
      spotGroup.add(colMesh);

      const ringGeo = new THREE.RingGeometry(12, 15, 28);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.userData = { hotspot: spot };
      spotGroup.add(ringMesh);

      const orbGeo = new THREE.OctahedronGeometry(3.6, 0);
      const orbMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 1.4,
        roughness: 0.15,
        metalness: 0.8
      });
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      orbMesh.position.y = 46;
      orbMesh.userData = { hotspot: spot };
      spotGroup.add(orbMesh);

      hotspotBeaconsGroup.add(spotGroup);

      const isoGeo = new THREE.TorusGeometry(28 + idx * 4, 0.5, 12, 48);
      const isoMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const isoMesh = new THREE.Mesh(isoGeo, isoMat);
      isoMesh.position.set(spot.position.x, spot.position.y, spot.position.z);
      isoContoursGroup.add(isoMesh);
    });
  }, [nodes, clusters, links, heatmapSettings?.mode, heatmapSettings?.radius, heatmapSettings?.threshold]);

  return (
    <div data-tour="canvas-3d" className="relative w-full h-full overflow-hidden bg-[#07090E] select-none">
      <div ref={containerRef} className="w-full h-full" />

      {/* Progressive 3D Level-of-Detail (LOD) Labels Overlay */}
      <div ref={labelsLayerRef} className="pointer-events-none absolute inset-0 overflow-hidden z-10" />

      {/* Subtle Radial Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 64%, rgba(7, 9, 14, 0.72) 100%)'
        }}
      />

      {/* Minimal Taxonomy Key (Bottom Right) */}
      <div className="pointer-events-none absolute bottom-3 right-4 z-10 hidden 2xl:flex items-center gap-3 px-3 py-1 rounded bg-[#0B0F17]/80 border border-white/10 text-[10px] font-mono text-slate-400">
        {Object.entries(NODE_HEX_STRINGS).map(([type, hex]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: hex }}
            />
            <span className="text-slate-300">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Visualizer;
