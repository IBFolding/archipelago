import * as THREE from 'three';
import { ISLANDS } from '@/lib/content';

/**
 * Islands packed for the shader: xz centre + an average radius used to fade
 * the water to shallow turquoise and draw a foam ring around each landmass.
 */
const SHOAL_COUNT = ISLANDS.length;

const shoals = ISLANDS.map((i) => {
  const r = (i.shape.rx + i.shape.rz) / 2;
  return new THREE.Vector3(i.pos[0], i.pos[1], r);
});

export const OCEAN_VERT = /* glsl */ `
uniform float uTime;
varying vec3 vWorld;
varying float vWave;

// Cheap directional Gerstner-ish swell. Three octaves is enough at this scale.
float swell(vec2 p, float t) {
  float w = 0.0;
  w += sin(p.x * 0.42 + t * 1.05) * 0.150;
  w += cos(p.y * 0.51 - t * 0.88) * 0.115;
  w += sin((p.x + p.y) * 0.23 + t * 0.64) * 0.080;
  w += sin((p.x - p.y * 0.6) * 0.78 - t * 1.6) * 0.035;
  return w;
}

void main() {
  vec3 p = position;
  float h = swell(p.xy, uTime);
  p.z += h;

  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorld = world.xyz;
  vWave = h;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const OCEAN_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uShallow;
uniform float uNight;
uniform vec3 uSky;
uniform vec3 uShoals[${SHOAL_COUNT}];

varying vec3 vWorld;
varying float vWave;

void main() {
  // Distance to the nearest shoreline, normalised by that island's radius.
  float nearest = 1e9;
  for (int i = 0; i < ${SHOAL_COUNT}; i++) {
    vec3 s = uShoals[i];
    float d = length(vWorld.xz - s.xy) - s.z;
    nearest = min(nearest, d);
  }

  // Lagoon: turquoise close in, deep blue far out.
  float shelf = smoothstep(-0.5, 14.0, nearest);
  vec3 col = mix(uShallow, uMid, shelf);
  col = mix(col, uDeep, smoothstep(16.0, 48.0, nearest));

  // Foam ring that breathes with the swell, so it looks like surf, not a decal.
  // Narrow band hugging the shoreline only, modulated so it breaks like surf.
  float surfBand = 1.0 - smoothstep(0.0, 0.62, abs(nearest - 0.30 + vWave * 0.55));
  float surfNoise = 0.45 + 0.55 * sin(vWorld.x * 2.4 + vWorld.z * 2.0 + uTime * 1.8);
  col = mix(col, vec3(0.93, 0.99, 1.0), clamp(surfBand * surfNoise, 0.0, 1.0) * 0.8);

  // Normal reconstructed from the analytic swell gradient.
  float e = 0.35;
  float dx = sin((vWorld.x + e) * 0.42 + uTime * 1.05) - sin((vWorld.x - e) * 0.42 + uTime * 1.05);
  float dz = cos((vWorld.z + e) * 0.51 - uTime * 0.88) - cos((vWorld.z - e) * 0.51 - uTime * 0.88);
  vec3 n = normalize(vec3(-dx * 0.5, 1.0, -dz * 0.5));

  // Sun glitter + fresnel rim.
  vec3 viewDir = normalize(cameraPosition - vWorld);
  vec3 h = normalize(normalize(uSunDir) + viewDir);
  float spec = pow(max(dot(n, h), 0.0), 90.0);
  float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);

  // Glitter only where the sun actually hits, so it reads as light on water
  // rather than snow across the whole bay.
  float sparkle = pow(max(0.0, sin(vWorld.x * 1.7 + uTime * 2.4) * sin(vWorld.z * 1.4 - uTime * 1.9)), 44.0)
                * smoothstep(0.02, 0.35, spec + 0.06);

  col += uSunColor * spec * 1.15;
  col += uSunColor * sparkle * 0.85;
  col += mix(vec3(0.30, 0.55, 0.70), vec3(0.05, 0.10, 0.22), uNight) * fres * 0.35;

  // Night grade: drop luminance, push blue, keep the moon glitter.
  col = mix(col, col * vec3(0.20, 0.30, 0.52), uNight);

  // A custom ShaderMaterial gets no scene fog, so fade the far water into the
  // sky here — otherwise the plane ends on a hard horizon line.
  float dist = length(vWorld - cameraPosition);
  float haze = 1.0 - exp(-pow(dist * 0.0115, 2.0));
  col = mix(col, uSky, clamp(haze, 0.0, 1.0));

  gl_FragColor = vec4(col, 1.0);
}
`;

export function createOceanMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(-0.5, 0.85, -0.3) },
      uSunColor: { value: new THREE.Color('#fff3cf') },
      uDeep: { value: new THREE.Color('#0a6ba4') },
      uMid: { value: new THREE.Color('#13a8ce') },
      uShallow: { value: new THREE.Color('#72efe0') },
      uNight: { value: 0 },
      uSky: { value: new THREE.Color('#8fdcf6') },
      uShoals: { value: shoals },
    },
    vertexShader: OCEAN_VERT,
    fragmentShader: OCEAN_FRAG,
  });
}
