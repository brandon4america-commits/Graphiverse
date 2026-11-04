/**
 * Custom GLSL Shader for Nuanced Chromatic Aberration & Lens Dispersion
 */
export const CinematicChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.0048 },
    distortion: { value: 0.08 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform float distortion;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      vec2 dir = vUv - center;
      float dist = length(dir);

      // Radial distortion scale
      vec2 rOffset = dir * amount * (1.0 + dist * distortion);
      vec2 bOffset = dir * amount * 1.5 * (1.0 + dist * distortion);

      float r = texture2D(tDiffuse, vUv - rOffset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv + bOffset).b;
      float a = texture2D(tDiffuse, vUv).a;

      // Subtle vignette falloff
      float vignette = smoothstep(0.95, 0.45, dist);
      vec3 col = vec3(r, g, b) * (0.85 + 0.15 * vignette);

      gl_FragColor = vec4(col, a);
    }
  `
};

/**
 * Custom GLSL Shader for Cinematic Frame Motion Blur / Velocity Accumulation
 */
export const CinematicMotionBlurShader = {
  uniforms: {
    tDiffuse: { value: null },
    tPrevFrame: { value: null },
    blurFactor: { value: 0.65 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tPrevFrame;
    uniform float blurFactor;
    varying vec2 vUv;

    void main() {
      vec4 current = texture2D(tDiffuse, vUv);
      vec4 previous = texture2D(tPrevFrame, vUv);
      
      // Blend current frame with previous frame for smooth velocity motion blur
      vec4 blended = mix(current, previous, blurFactor * 0.42);
      gl_FragColor = blended;
    }
  `
};
