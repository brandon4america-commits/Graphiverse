/**
 * Hyper-Real Aesthetic Post-Processing & Atmospheric Shaders
 * Anamorphic Lens Flare, Tactile Film Grain, and Volumetric Light Shafts
 */

/**
 * Anamorphic Horizontal Lens Flare Shader
 * Emulates widescreen anamorphic glass with spectral horizontal streak dispersion.
 */
export const AnamorphicFlareShader = {
  uniforms: {
    tDiffuse: { value: null },
    streakLength: { value: 0.038 },
    flareThreshold: { value: 0.72 },
    flareIntensity: { value: 1.15 }
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
    uniform float streakLength;
    uniform float flareThreshold;
    uniform float flareIntensity;
    varying vec2 vUv;

    // Luminance extraction
    float getLuminance(vec3 color) {
      return dot(color, vec3(0.2126, 0.7152, 0.0722));
    }

    void main() {
      vec4 baseColor = texture2D(tDiffuse, vUv);

      // Horizontal multi-tap anamorphic smear with chromatic dispersion
      vec3 flare = vec3(0.0);
      const int SAMPLES = 11;
      float totalWeight = 0.0;

      for (int i = -5; i <= 5; i++) {
        float offset = float(i) * streakLength;
        float weight = exp(-abs(float(i)) * 0.45);
        totalWeight += weight;

        // Chromatic split on horizontal streak (blue/cyan flare fringe)
        float r = texture2D(tDiffuse, vUv + vec2(offset * 0.85, 0.0)).r;
        float g = texture2D(tDiffuse, vUv + vec2(offset, 0.0)).g;
        float b = texture2D(tDiffuse, vUv + vec2(offset * 1.15, 0.0)).b;
        vec3 sampleCol = vec3(r, g, b);

        float lum = getLuminance(sampleCol);
        if (lum > flareThreshold) {
          float excess = (lum - flareThreshold) / (1.0 - flareThreshold + 0.0001);
          // Anamorphic cyan-electric blue tinting
          vec3 streakColor = sampleCol * vec3(0.5, 0.85, 1.35) * excess;
          flare += streakColor * weight;
        }
      }

      flare = (flare / totalWeight) * flareIntensity;

      // Composite flare with base image
      gl_FragColor = vec4(baseColor.rgb + flare, baseColor.a);
    }
  `
};

/**
 * Tactile Filmic Grain & Micro-Contrast Shader
 * Simulates organic 35mm grain structure with mid-tone distribution and filmic tonemapping.
 */
export const TactileFilmGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    grainIntensity: { value: 0.048 },
    grainSize: { value: 1.6 }
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
    uniform float uTime;
    uniform float grainIntensity;
    uniform float grainSize;
    varying vec2 vUv;

    // High frequency procedural noise
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float lum = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));

      // Organic grain concentrated in mid-tones (suppressed in deepest blacks & blown highlights)
      float midtoneMask = 4.0 * lum * (1.0 - lum);
      vec2 seed = (vUv * 800.0 / grainSize) + vec2(uTime * 14.5, uTime * 7.3);
      float noise = (hash(seed) - 0.5) * 2.0;

      // Tactile film grain
      vec3 grained = color.rgb + noise * grainIntensity * midtoneMask;

      // Subtle filmic S-curve contrast boost
      vec3 filmic = grained * grained * (3.0 - 2.0 * grained);
      vec3 finalCol = mix(grained, filmic, 0.18);

      gl_FragColor = vec4(finalCol, color.a);
    }
  `
};

/**
 * Volumetric Crepuscular Light Shaft Shader
 * Simulates celestial god rays with angle-dependent Mie scattering and drifting dust motes.
 */
export const VolumetricLightShaftShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: null },
    uAudioBass: { value: 0 },
    uIntensity: { value: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uAudioBass;
    uniform float uIntensity;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPos;

    void main() {
      // Axial falloff from apex to floor
      float verticalBeam = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.7, vUv.y);

      // Radial angle-dependent Mie forward-scattering
      vec3 viewDir = normalize(cameraPosition - vWorldPos);
      float viewAngle = abs(dot(viewDir, vNormal));
      float edgeFresnel = pow(1.0 - viewAngle, 2.8);

      // Drifting cosmic light motes inside the beam
      float dust1 = sin(vUv.x * 24.0 + uTime * 0.8) * cos(vUv.y * 30.0 - uTime * 0.6);
      float dust2 = sin(vUv.x * 48.0 - uTime * 1.2) * cos(vUv.y * 50.0 + uTime * 0.9);
      float dustMotes = (dust1 * dust2) * 0.25;

      float alpha = (verticalBeam * 0.45 + edgeFresnel * 0.65 + dustMotes + uAudioBass * 0.2) * uIntensity;
      vec3 beamColor = uColor * (1.2 + edgeFresnel * 0.8);

      gl_FragColor = vec4(beamColor, clamp(alpha * 0.42, 0.0, 0.85));
    }
  `
};
