import * as THREE from 'three';

/**
 * Procedurally generates a seamless high-fidelity metallic normal map canvas texture.
 * Features microscopic brushed metal grooves and micro-facet variations.
 */
export function createBrushedMetalNormalMap(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    return fallback;
  }

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  // Generate directional microscopic normal vectors
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // High frequency horizontal grooves + subtle noise
      const n1 = Math.sin(x * 0.45) * 0.25;
      const n2 = Math.cos((x + y * 0.5) * 0.2) * 0.15;
      const nx = 0.5 + (n1 + n2) * 0.5;
      const ny = 0.5 + Math.sin(y * 0.8) * 0.08;
      const nz = 1.0;

      // Map normal vector [-1, 1] to RGB [0, 255]
      data[idx] = Math.floor(nx * 255);
      data[idx + 1] = Math.floor(ny * 255);
      data[idx + 2] = Math.floor(nz * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedurally generates a crystalline / faceted roughness & bump map texture.
 */
export function createCrystalRoughnessMap(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, size, size);

  // Draw procedural Voronoi-like crystal facets
  for (let i = 0; i < 48; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const r = 15 + Math.random() * 65;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const alpha = 0.12 + Math.random() * 0.35;
    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedurally generates a tech-circuit normal map for node structures.
 */
export function createTechCircuitNormalMap(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Base normal map flat blue
  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, size, size);

  // Draw embossed circuit lines
  ctx.strokeStyle = 'rgb(180, 90, 255)';
  ctx.lineWidth = 3;

  for (let i = 0; i < 24; i++) {
    const startX = (i / 24) * size;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, size * 0.4);
    ctx.lineTo(startX + 30, size * 0.5);
    ctx.lineTo(startX + 30, size);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedurally generates a soft radial ground contact radiance texture.
 * Used for grounding clusters on the horizon grid with luminous ambient falloff.
 */
export function createContactRadianceTexture(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const center = size / 2;
  const radius = size / 2;

  // Multi-stop inverse-square radial glow
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
  gradient.addColorStop(0.18, 'rgba(180, 240, 255, 0.75)');
  gradient.addColorStop(0.45, 'rgba(0, 200, 255, 0.35)');
  gradient.addColorStop(0.75, 'rgba(0, 120, 255, 0.08)');
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Concentric interference rings
  ctx.lineWidth = 1.5;
  for (let r = 40; r < radius - 20; r += 50) {
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 * (1 - r / radius)})`;
    ctx.beginPath();
    ctx.arc(center, center, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

