import { GraphData, CustomSceneKeyframe } from '../types';

/**
 * Generates a self-contained, single-file HTML interactive WebGL presentation player.
 */
export function generatePresentationPlayerHtml(
  graphData: GraphData,
  keyframes: CustomSceneKeyframe[],
  title = 'Graphiverse Cinematic Interactive Presentation'
): string {
  const jsonGraph = JSON.stringify(graphData);
  const jsonScenes = JSON.stringify(keyframes);

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
  <style>
    body { margin: 0; overflow: hidden; background-color: #030508; color: #fff; font-family: monospace; }
    canvas { width: 100vw; height: 100vh; display: block; }
    .glass-panel { background: rgba(4, 8, 19, 0.88); border: 1px solid rgba(0, 240, 255, 0.35); backdrop-filter: blur(12px); }
  </style>
</head>
<body class="relative w-screen h-screen overflow-hidden select-none">
  <div id="canvas-container" class="w-full h-full"></div>

  <!-- Top Title HUD -->
  <div class="absolute top-5 left-5 z-10 glass-panel px-4 py-2.5 rounded-lg flex items-center gap-3">
    <div class="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-ping"></div>
    <div>
      <div className="text-[10px] uppercase text-[#00F0FF] font-bold">STANDALONE WEBGL PRESENTATION PLAYER</div>
      <div class="text-sm font-bold text-white">${title}</div>
    </div>
  </div>

  <!-- Bottom Navigation Control Dock -->
  <div id="controls-dock" class="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 glass-panel px-5 py-3 rounded-xl flex items-center gap-4 max-w-3xl w-[92vw] sm:w-auto">
    <button id="btn-prev" class="px-3 py-1.5 rounded bg-[#091322] border border-[#00F0FF]/40 text-xs text-[#00F0FF] hover:bg-[#00F0FF]/20 font-bold uppercase cursor-pointer">
      ◀ Prev Scene
    </button>
    <div id="scene-counter" class="text-xs text-white/90 font-bold tracking-wider">
      Scene 1 / 1
    </div>
    <button id="btn-next" class="px-3 py-1.5 rounded bg-[#00F0FF] text-[#030508] font-bold text-xs uppercase hover:bg-[#7CE8FF] cursor-pointer">
      Next Scene ▶
    </button>
  </div>

  <!-- Selected Node Detail Drawer -->
  <div id="node-drawer" class="hidden absolute top-20 right-5 z-10 glass-panel p-4 rounded-lg max-w-sm">
    <div id="node-type" class="text-[10px] text-[#00F0FF] uppercase font-bold mb-1">CLAIM</div>
    <div id="node-title" class="text-base font-bold text-white mb-1">Node Title</div>
    <div id="node-source" class="text-xs text-[#94A3B8] mb-2">Source: Telemetry</div>
    <div id="node-desc" class="text-xs text-white/80 leading-relaxed">Description...</div>
  </div>

  <script>
    const graphData = ${jsonGraph};
    const scenes = ${jsonScenes};
    let currentSceneIdx = 0;

    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030508);
    scene.fog = new THREE.FogExp2(0x030508, 0.0004);

    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(0, 150, 480);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xd8ecff, 1.2);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight.position.set(300, 400, 300);
    scene.add(dirLight);

    // Build Nodes
    const nodeMeshMap = new Map();
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    const colors = {
      CLAIM: 0x00f0ff,
      EVIDENCE: 0x00ff9d,
      CONTRADICTION: 0xff2a5f,
      QUESTION: 0xffb800,
      IDEA: 0xb877ff,
      SOURCE: 0x7ce8ff,
      DEFINITION: 0xffffff
    };

    graphData.nodes.forEach((node, i) => {
      const cluster = graphData.clusters.find(c => c.id === node.clusterId) || { center: {x:0, y:0, z:0} };
      const angle = (i * 2.4) % (Math.PI * 2);
      const r = 24 + (i % 6) * 12;
      const x = node.x || (cluster.center.x + Math.cos(angle) * r);
      const y = node.y || (cluster.center.y + ((i % 5) - 2) * 15);
      const z = node.z || (cluster.center.z + Math.sin(angle) * r);

      const size = Math.max(5, Math.min(12, (node.val || 15) * 0.4));
      const geom = node.type === 'CONTRADICTION'
        ? new THREE.OctahedronGeometry(size, 0)
        : new THREE.IcosahedronGeometry(size, 1);

      const mat = new THREE.MeshStandardMaterial({
        color: colors[node.type] || 0x00f0ff,
        emissive: colors[node.type] || 0x00f0ff,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, y, z);
      mesh.userData = node;
      nodeGroup.add(mesh);
      nodeMeshMap.set(node.id, mesh);
    });

    // Build Links
    const linkPositions = [];
    graphData.links.forEach(l => {
      const s = nodeMeshMap.get(l.source);
      const t = nodeMeshMap.get(l.target);
      if (s && t) {
        linkPositions.push(s.position.x, s.position.y, s.position.z);
        linkPositions.push(t.position.x, t.position.y, t.position.z);
      }
    });
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkPositions, 3));
    const linkMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.35 });
    const lines = new THREE.LineSegments(linkGeo, linkMat);
    scene.add(lines);

    // Camera preset switcher
    function updateSceneDisplay() {
      const counterEl = document.getElementById('scene-counter');
      if (scenes.length === 0) {
        counterEl.innerText = "Full Observatory Orbit";
        return;
      }
      const kf = scenes[currentSceneIdx];
      counterEl.innerText = \`Scene \${currentSceneIdx + 1} / \${scenes.length}: \${kf.title}\`;
      if (kf.cameraTarget) {
        controls.target.set(kf.cameraTarget.x, kf.cameraTarget.y, kf.cameraTarget.z);
      }
    }

    document.getElementById('btn-prev').addEventListener('click', () => {
      if (scenes.length === 0) return;
      currentSceneIdx = (currentSceneIdx - 1 + scenes.length) % scenes.length;
      updateSceneDisplay();
    });

    document.getElementById('btn-[#btn-next]' || 'btn-next').addEventListener('click', () => {
      if (scenes.length === 0) return;
      currentSceneIdx = (currentSceneIdx + 1) % scenes.length;
      updateSceneDisplay();
    });

    updateSceneDisplay();

    // Raycast selector
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    window.addEventListener('click', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeGroup.children);
      const drawer = document.getElementById('node-drawer');
      if (intersects.length > 0) {
        const node = intersects[0].object.userData;
        document.getElementById('node-type').innerText = node.type;
        document.getElementById('node-title').innerText = node.label;
        document.getElementById('node-source').innerText = 'Source: ' + (node.source || 'Telemetry');
        document.getElementById('node-desc').innerText = node.description || 'No description provided.';
        drawer.classList.remove('hidden');
      } else {
        drawer.classList.add('hidden');
      }
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animate() {
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
  </script>
</body>
</html>`;
}
