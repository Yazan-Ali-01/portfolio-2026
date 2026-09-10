import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group, LineBasicMaterial, LineLoop, Material, Mesh, MeshBasicMaterial, PlaneGeometry, ShaderMaterial, SphereGeometry, Vector3 } from 'three';

/**
 * The concentric ring system. Pure three.js — no DOM, no framework, no knowledge
 * of scroll. Each ring carries the constants that make it individual so the
 * renderer only has to interpolate between 0 and 1.
 */

export type Ring = {
  line: LineLoop;
  /** Depth position in the tunnel. Never changes. */
  baseZ: number;
  /** Rotation applied at full tilt. Level at tilt 0. */
  offAxis: { x: number; y: number };
  /** Displacement applied at zero alignment. Concentric at alignment 1. */
  offset: Vector3;
};

/** Deterministic, so the composition is identical on every load. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function circleGeometry(radius: number, segments: number): BufferGeometry {
  const points = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points[i * 3] = Math.cos(a) * radius;
    points[i * 3 + 1] = Math.sin(a) * radius;
    points[i * 3 + 2] = 0;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(points, 3));
  return geometry;
}

export function createRings(count: number, segments: number): {
  group: Group;
  rings: Ring[];
  dispose: () => void;
} {
  const random = seeded(20260908);
  const group = new Group();
  const rings: Ring[] = [];
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];

  // A tunnel, not a flat target. Rings recede along -Z so the composition has
  // real depth and the light has somewhere to travel from.
  const SPACING = 1.9;

  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    // Near rings slightly wider than far ones: the tube tapers away from you.
    const radius = 2.45 - t * 0.55;

    const geometry = circleGeometry(radius, segments);
    const material = new LineBasicMaterial({
      color: 0xb08e9c,
      transparent: true,
      // Fog handles distance falloff; this is the near-field weighting.
      opacity: 0.55 - t * 0.12,
    });

    const line = new LineLoop(geometry, material);
    line.position.z = -i * SPACING;
    // A slow twist down the tunnel so the rings never stack into a flat target.
    line.rotation.z = i * 0.11;

    geometries.push(geometry);
    materials.push(material);

    rings.push({
      line,
      baseZ: -i * SPACING,
      offAxis: { x: (random() - 0.5) * 0.9, y: (random() - 0.5) * 0.9 },
      offset: new Vector3((random() - 0.5) * 1.7, (random() - 0.5) * 1.7, 0),
    });

    group.add(line);
  }

  return {
    group,
    rings,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

/** The warm point of light at the centre: a core, plus an additive glow. */
export function createLight(): {
  group: Group;
  setIntensity: (value: number) => void;
  dispose: () => void;
} {
  const group = new Group();

  const coreGeometry = new SphereGeometry(0.16, 20, 16);
  const coreMaterial = new MeshBasicMaterial({ color: 0xfff0ec, fog: false });
  const core = new Mesh(coreGeometry, coreMaterial);

  const glowGeometry = new PlaneGeometry(15, 15);
  const glowMaterial = new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(0xe0736e) },
      uIntensity: { value: 0.25 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 uColor;
      uniform float uIntensity;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        // Two lobes: a tight core bloom and a wide atmospheric halo.
        float core = pow(max(0.0, 1.0 - d), 6.0);
        float halo = pow(max(0.0, 1.0 - d), 1.7) * 0.42;
        gl_FragColor = vec4(uColor, (core + halo) * uIntensity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
  });
  const glow = new Mesh(glowGeometry, glowMaterial);

  group.add(glow, core);

  return {
    group,
    setIntensity: (value: number) => {
      glowMaterial.uniforms.uIntensity.value = value;
      coreMaterial.opacity = value;
      core.scale.setScalar(0.6 + value * 1.4);
      glow.scale.setScalar(0.7 + value * 0.9);
    },
    dispose: () => {
      coreGeometry.dispose();
      coreMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
    },
  };
}
