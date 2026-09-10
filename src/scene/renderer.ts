import { FogExp2, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import type { StoryState } from '../lib/story-state';
import { resolveScene, type SceneValues } from './keyframes';
import { createRings, createLight } from './rings';

/**
 * Owns the WebGL context and the render loop.
 *
 * The loop is not a permanent animation: it runs only while the scene is still
 * settling toward the last state it was given, then stops. SPEC.md requires that
 * nothing moves on its own, so an idle scene schedules no frames at all.
 */

export type Quality = {
  ringCount: number;
  ringSegments: number;
  maxPixelRatio: number;
  /** Where the mouth of the tunnel sits, in world units. */
  offset: { x: number; y: number };
};

/** Desktop: the tunnel owns the right of the frame, the reading column the left. */
export const QUALITY_FULL: Quality = {
  ringCount: 42,
  ringSegments: 128,
  maxPixelRatio: 2,
  offset: { x: 3.15, y: 0 },
};

/**
 * Phone: there is no room beside the text, so the tunnel moves above it and
 * simplifies — fewer rings, coarser segments, lower pixel ratio. It does not
 * disappear (SPEC.md).
 */
export const QUALITY_COMPACT: Quality = {
  ringCount: 22,
  ringSegments: 88,
  maxPixelRatio: 1.75,
  offset: { x: 0.9, y: 2.9 },
};

/** Light travel, in world units, from far behind the rings to in front of them. */
const LIGHT_Z_FAR = -74;
const LIGHT_Z_NEAR = 2.5;

const RING_SCALE_TIGHT = 0.68;
const RING_SCALE_WIDE = 1.24;

/** How fast the scene catches up to a new target. Higher is snappier. */
const DAMPING = 7.5;
const SETTLED = 0.0006;

export type SceneController = {
  setState: (state: StoryState) => void;
  /** Jump straight to a state with no damping, then render one frame. */
  snapTo: (state: StoryState) => void;
  resize: (width: number, height: number) => void;
  setActive: (active: boolean) => void;
  dispose: () => void;
};

export function createSceneController(
  canvas: HTMLCanvasElement,
  quality: Quality = QUALITY_FULL,
): SceneController {
  const scene = new Scene();
  scene.fog = new FogExp2(0x191016, 0.021);

  const camera = new PerspectiveCamera(52, 1, 0.1, 220);
  camera.position.set(0, 0, 7);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.maxPixelRatio));
  renderer.setClearColor(0x000000, 0);

  const { group: ringGroup, rings, dispose: disposeRings } = createRings(
    quality.ringCount,
    quality.ringSegments,
  );
  const { group: lightGroup, setIntensity, dispose: disposeLight } = createLight();
  ringGroup.position.set(quality.offset.x, quality.offset.y, 0);
  lightGroup.position.x = quality.offset.x;
  scene.add(ringGroup, lightGroup);

  let target: SceneValues = resolveScene({ progress: 0, chapter: 0, chapterProgress: 0 });
  let current: SceneValues = { ...target };
  let running = false;
  let active = true;
  let lastTime = 0;

  function apply(values: SceneValues) {
    lightGroup.position.y = quality.offset.y;
    lightGroup.position.z =
      LIGHT_Z_FAR + (LIGHT_Z_NEAR - LIGHT_Z_FAR) * (1 - values.lightDistance);
    setIntensity(values.lightIntensity);

    const scale = RING_SCALE_TIGHT + (RING_SCALE_WIDE - RING_SCALE_TIGHT) * values.ringSpread;
    const scatter = 1 - values.alignment;

    for (const ring of rings) {
      ring.line.scale.setScalar(scale);
      ring.line.rotation.x = ring.offAxis.x * values.ringTilt;
      ring.line.rotation.y = ring.offAxis.y * values.ringTilt;
      ring.line.position.x = ring.offset.x * scatter;
      ring.line.position.y = ring.offset.y * scatter;
      ring.line.position.z = ring.baseZ;
    }
  }

  function step(time: number) {
    const delta = lastTime === 0 ? 0.016 : Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    const factor = 1 - Math.exp(-DAMPING * delta);
    let motion = 0;
    for (const key of Object.keys(current) as (keyof SceneValues)[]) {
      const diff = target[key] - current[key];
      current[key] += diff * factor;
      motion += Math.abs(diff);
    }

    apply(current);
    renderer.render(scene, camera);

    if (motion < SETTLED) {
      current = { ...target };
      apply(current);
      renderer.render(scene, camera);
      stop();
    }
  }

  function start() {
    if (running || !active) return;
    running = true;
    lastTime = 0;
    renderer.setAnimationLoop(step);
  }

  function stop() {
    if (!running) return;
    running = false;
    renderer.setAnimationLoop(null);
  }

  apply(current);

  return {
    setState(state) {
      target = resolveScene(state);
      start();
    },
    snapTo(state) {
      target = resolveScene(state);
      current = { ...target };
      apply(current);
      renderer.render(scene, camera);
    },
    resize(width, height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    },
    setActive(next) {
      active = next;
      if (!active) stop();
      else start();
    },
    dispose() {
      stop();
      disposeRings();
      disposeLight();
      renderer.dispose();
    },
  };
}
