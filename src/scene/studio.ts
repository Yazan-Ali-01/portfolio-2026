import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Quaternion,
  RepeatWrapping,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Raycaster,
  Scene,
  SpotLight,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
  type Texture,
} from 'three';

/**
 * The architect's studio (E10).
 *
 * A fixed viewpoint at the desk: you drag to look, you never walk.
 *
 * What makes this read as a room rather than floating panels — the first attempt
 * had none of it:
 *   - enclosure: floor, back wall and two side walls, so you can see corners
 *   - a desk with volume and legs, not a slab
 *   - shadows, so objects sit on surfaces instead of hovering
 *   - falloff, so the corners go dark and the desk is the lit place
 *   - a few props, which is what gives the planes a human scale
 */

export type ArtifactSpec = {
  id: string;
  name: string;
  texture: string;
  place: 'wall' | 'desk';
  x: number;
  width: number;
  /** height / width of the texture, so nothing is stretched. */
  aspect: number;
};

/** A thing on the desk that says something about itself when you point at it. */
export type DeskNoteSpec = { id: string; title: string; body: string };

/** Where to draw the hover label: canvas pixels, above whatever is hovered. */
export type HoverAnchor =
  | { kind: 'project'; name: string; x: number; y: number }
  | { kind: 'note'; name: string; body: string; x: number; y: number }
  | null;

export type StudioController = {
  resize: (w: number, h: number) => void;
  setPointer: (x: number, y: number) => void;
  setDrag: (dx: number, dy: number) => void;
  /**
   * Raycast at a point, right now. Not the hovered object: a tap produces no
   * hover, so reading hover state meant touch taps resolved to nothing.
   */
  /**
   * What is at a point, right now. Not the hovered object: a tap produces no
   * hover, so reading hover state meant taps resolved to nothing.
   *
   * Precedence matters. A direct hit on anything beats the proximity fallback,
   * or tapping the keyboard would open whichever monitor happened to be within
   * a thumb's width of it.
   */
  probeAt: (nx: number, ny: number) => { project: string } | HoverAnchor;
  setActive: (on: boolean) => void;
  dispose: () => void;
};

const ACCENT = 0x8b5cf6;

/** Room dimensions, in world units. Everything else is placed against these. */
const ROOM = {
  floorY: -2.2,
  ceilingY: 4.2,
  backZ: -5.2,
  frontZ: 3.4,
  halfWidth: 6.2,
};

const DESK = {
  top: -0.9,
  thickness: 0.16,
  width: 8.6,
  depth: 3.2,
  z: -1.1,
};

export function createStudio(
  canvas: HTMLCanvasElement,
  artifacts: ArtifactSpec[],
  opts: {
    compact: boolean;
    notes?: DeskNoteSpec[];
    onHover?: (anchor: HoverAnchor) => void;
  },
): StudioController {
  const scene = new Scene();
  const bin: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (bin.push(x), x);

  const camera = new PerspectiveCamera(opts.compact ? 48 : 40, 1, 0.1, 90);
  const HOME = new Vector3(0, 1.05, 5.5);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.compact ? 1.6 : 2));
  // Contact shadows are the single biggest cue that an object is in a room.
  // Too expensive to justify on a phone, where the diorama is small anyway.
  renderer.shadowMap.enabled = !opts.compact;
  renderer.shadowMap.type = PCFSoftShadowMap;

  /** Framing is computed from content bounds, not hardcoded per breakpoint. */
  // Phones crop the room rather than shrink it. Fitting the full width into a
  // 390px viewport pushed the camera so far back the desk read as distant.
  const CONTENT = opts.compact
    ? { halfWidth: 3.85, halfHeight: 2.45, z: -2 }
    : { halfWidth: 4.8, halfHeight: 3.5, z: -2 };
  function fit(aspect: number) {
    const halfFov = (camera.fov * Math.PI) / 360;
    const forHeight = CONTENT.halfHeight / Math.tan(halfFov);
    const forWidth = CONTENT.halfWidth / (Math.tan(halfFov) * aspect);
    HOME.z = CONTENT.z + Math.max(forHeight, forWidth) * 1.06;
  }

  const surface = (color: number, roughness = 0.92) =>
    keep(new MeshStandardMaterial({ color, roughness, metalness: 0.02 }));

  // --- enclosure -----------------------------------------------------------
  const room = new Group();

  const floorMat = surface(0x0e0e11, 0.96);
  const floor = new Mesh(keep(new PlaneGeometry(30, 24)), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, ROOM.floorY, -1);
  floor.receiveShadow = true;
  room.add(floor);

  const backMat = surface(0x191920);
  const back = new Mesh(keep(new PlaneGeometry(ROOM.halfWidth * 2, 8)), backMat);
  back.position.set(0, ROOM.floorY + 4, ROOM.backZ);
  back.receiveShadow = true;
  room.add(back);

  const sideMat = surface(0x121216);
  const sideGeo = keep(new PlaneGeometry(ROOM.frontZ - ROOM.backZ, 8));
  for (const dir of [-1, 1]) {
    const side = new Mesh(sideGeo, sideMat);
    side.rotation.y = (dir * Math.PI) / 2;
    side.position.set(dir * ROOM.halfWidth, ROOM.floorY + 4, (ROOM.backZ + ROOM.frontZ) / 2);
    side.receiveShadow = true;
    room.add(side);
  }

  // --- the desk ------------------------------------------------------------

  /** Procedural oak. Drawn once at runtime rather than shipped as an image. */
  function woodTexture(
    base = '#6d4c30',
    dark = '58, 38, 22',
    light = '150, 112, 74',
    repeat: [number, number] = [2.2, 1],
  ) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    let seed = 8675309;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, c.width, c.height);

    for (let i = 0; i < 190; i++) {
      const y0 = rnd() * c.height;
      ctx.strokeStyle = rnd() > 0.35
        ? `rgba(${dark}, ${0.05 + rnd() * 0.2})`
        : `rgba(${light}, ${0.04 + rnd() * 0.12})`;
      ctx.lineWidth = 0.6 + rnd() * 2.6;
      ctx.beginPath();
      const amp = 2 + rnd() * 6;
      const freq = 1 + rnd() * 2.5;
      const phase = rnd() * Math.PI * 2;
      for (let x = 0; x <= c.width; x += 12) {
        const y = y0 + Math.sin((x / c.width) * Math.PI * 2 * freq + phase) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    return keep(t);
  }

  const deskTopMat = keep(
    new MeshStandardMaterial({ map: woodTexture(), roughness: 0.58, metalness: 0.02 }),
  );
  const deskTop = new Mesh(
    keep(new BoxGeometry(DESK.width, DESK.thickness, DESK.depth)),
    deskTopMat,
  );
  deskTop.position.set(0, DESK.top - DESK.thickness / 2, DESK.z);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  room.add(deskTop);

  const legMat = surface(0x3a2718, 0.72);
  const legHeight = DESK.top - DESK.thickness - ROOM.floorY;
  const legGeo = keep(new BoxGeometry(0.16, legHeight, 0.16));
  for (const lx of [-DESK.width / 2 + 0.4, DESK.width / 2 - 0.4]) {
    for (const lz of [DESK.z - DESK.depth / 2 + 0.3, DESK.z + DESK.depth / 2 - 0.3]) {
      const leg = new Mesh(legGeo, legMat);
      leg.position.set(lx, ROOM.floorY + legHeight / 2, lz);
      leg.castShadow = true;
      room.add(leg);
    }
  }

  scene.add(room);

  const loaderShared = new TextureLoader();

  /*
   * Hoverable props. Unlike the project artifacts these are not clickable — they
   * just say what they are. Their label anchors sit at an absolute height above
   * the desk rather than in each mesh's local space, because several of them are
   * non-uniformly scaled and local offsets would come out wrong.
   */
  const noteBy = new Map((opts.notes ?? []).map((note) => [note.id, note]));
  const noteMeshes: Mesh[] = [];
  function note(id: string, worldY: number, ...meshes: Mesh[]) {
    const found = noteBy.get(id);
    if (!found) return;
    for (const mesh of meshes) {
      mesh.userData.note = found;
      mesh.userData.anchorY = worldY;
      noteMeshes.push(mesh);
    }
  }

  // --- props: scale, and the sense that someone works here -----------------
  const propMat = surface(0x33333c, 0.7);
  const metalMat = keep(
    new MeshStandardMaterial({ color: 0x9fa5ae, roughness: 0.26, metalness: 0.85 }),
  );

  /** Spine artwork drawn at runtime. Two strings do not need two image files. */
  function spineTexture(title: string, bg: string, fg: string) {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 80;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = fg;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.strokeRect(13, 12, c.width - 26, c.height - 24);
    ctx.globalAlpha = 1;
    ctx.fillStyle = fg;
    ctx.font = '600 30px ui-sans-serif, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, c.width / 2, c.height / 2 + 1);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return keep(t);
  }

  function book(title: string, cover: number, bg: string, fg: string, w: number, thick: number) {
    const coverMat = surface(cover, 0.82);
    const edgeMat = surface(0xcfc7b6, 0.9);
    const spineMat = keep(new MeshStandardMaterial({ map: spineTexture(title, bg, fg), roughness: 0.82 }));
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z. Spine faces the viewer.
    const mesh = new Mesh(keep(new BoxGeometry(w, thick, 0.66)), [
      edgeMat,
      edgeMat,
      coverMat,
      coverMat,
      spineMat,
      edgeMat,
    ]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  const lower = book('Think and Grow Rich', 0x6f2b2b, '#6f2b2b', '#e9d7b0', 1.06, 0.13);
  lower.position.set(3.3, DESK.top + 0.065, DESK.z + 0.85);
  lower.rotation.y = 0.07;
  scene.add(lower);
  note('think-and-grow-rich', DESK.top + 0.2, lower);

  const upper = book('Beyond Good and Evil', 0x1d2233, '#1d2233', '#dfe4ef', 0.94, 0.11);
  upper.position.set(3.36, DESK.top + 0.185, DESK.z + 0.83);
  upper.rotation.y = -0.05;
  scene.add(upper);
  note('beyond-good-and-evil', DESK.top + 0.42, upper);

  // A framed print of the studio, on the desk in the studio.
  const printW = 1.02;
  const printH = printW * (942 / 1024);
  const printGroup = new Group();
  const printTex = loaderShared.load('/work/tex/miniature.jpg');
  printTex.colorSpace = SRGBColorSpace;
  const printFrame = new Mesh(
    keep(new BoxGeometry(printW + 0.07, printH + 0.07, 0.035)),
    surface(0x2f2f37, 0.6),
  );
  printFrame.position.y = (printH + 0.07) / 2;
  printFrame.castShadow = true;
  const printFace = new Mesh(
    keep(new PlaneGeometry(printW, printH)),
    keep(new MeshBasicMaterial({ map: printTex })),
  );
  printFace.position.set(0, (printH + 0.07) / 2, 0.019);
  printGroup.add(printFrame, printFace);
  printGroup.position.set(3.75, DESK.top, DESK.z - 0.8);
  printGroup.rotation.set(-0.2, -0.26, 0);
  scene.add(printGroup);

  // Mate, and the thermos that keeps the water hot. Modelled on Yazan's own:
  // a wooden gourd on a silver foot with a bombilla, and a wood-clad flask.
  const gourdWood = keep(
    new MeshStandardMaterial({
      map: woodTexture('#8a5a33', '70, 40, 20', '188, 140, 92', [1, 1]),
      roughness: 0.55,
      metalness: 0.04,
    }),
  );
  const thermosWood = keep(
    new MeshStandardMaterial({
      map: woodTexture('#7c5330', '62, 36, 18', '176, 130, 84', [1.4, 1]),
      roughness: 0.5,
      metalness: 0.05,
    }),
  );

  const mate = new Group();

  const mateFoot = new Mesh(keep(new CylinderGeometry(0.112, 0.098, 0.062, 28)), metalMat);
  mateFoot.position.y = 0.031;
  const mateStem = new Mesh(keep(new CylinderGeometry(0.058, 0.072, 0.03, 22)), metalMat);
  mateStem.position.y = 0.077;

  // Gourd silhouette: bulbous body flaring back out to the lip.
  const profile = [
    [0.05, 0.0],
    [0.1, 0.032],
    [0.135, 0.08],
    [0.151, 0.135],
    [0.152, 0.185],
    [0.137, 0.232],
    [0.131, 0.255],
    [0.152, 0.278],
    [0.157, 0.298],
  ].map(([r, y]) => new Vector2(r, y));
  const gourd = new Mesh(keep(new LatheGeometry(profile, 32)), gourdWood);
  gourd.position.y = 0.09;
  gourd.castShadow = true;

  const mateRim = new Mesh(keep(new CylinderGeometry(0.16, 0.156, 0.026, 30)), metalMat);
  mateRim.position.y = 0.388;
  const yerba = new Mesh(
    keep(new CylinderGeometry(0.143, 0.143, 0.014, 30)),
    surface(0x8d8a4a, 0.95),
  );
  yerba.position.y = 0.393;

  const bombillaCurve = new CatmullRomCurve3([
    new Vector3(0.0, 0.33, 0.025),
    new Vector3(0.05, 0.46, 0.018),
    new Vector3(0.115, 0.58, 0.0),
    new Vector3(0.157, 0.645, -0.012),
  ]);
  const bombilla = new Mesh(keep(new TubeGeometry(bombillaCurve, 22, 0.011, 8)), metalMat);
  bombilla.castShadow = true;

  mate.add(mateFoot, mateStem, gourd, mateRim, yerba, bombilla);
  mate.position.set(-3.3, DESK.top, DESK.z + 1.0);
  mate.rotation.y = 0.5;
  scene.add(mate);

  const thermos = new Group();
  const thermosBody = new Mesh(keep(new CylinderGeometry(0.113, 0.113, 0.5, 28)), thermosWood);
  thermosBody.position.y = 0.25;
  thermosBody.castShadow = true;
  const thermosBand = new Mesh(keep(new CylinderGeometry(0.118, 0.118, 0.046, 28)), surface(0x121215, 0.5));
  thermosBand.position.y = 0.522;
  const thermosCap = new Mesh(keep(new CylinderGeometry(0.104, 0.104, 0.115, 28)), thermosWood);
  thermosCap.position.y = 0.602;
  thermosCap.castShadow = true;
  const thermosDome = new Mesh(
    keep(new SphereGeometry(0.104, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)),
    thermosWood,
  );
  thermosDome.scale.y = 0.45;
  thermosDome.position.y = 0.659;
  const handle = new Mesh(keep(new TorusGeometry(0.082, 0.009, 8, 22, Math.PI * 1.1)), metalMat);
  handle.rotation.z = -Math.PI * 0.55;
  handle.position.set(0.112, 0.47, 0);
  handle.castShadow = true;
  thermos.add(thermosBody, thermosBand, thermosCap, thermosDome, handle);
  thermos.position.set(-3.92, DESK.top, DESK.z + 0.62);
  thermos.rotation.y = -0.35;
  scene.add(thermos);

  note('mate', DESK.top + 0.86, gourd, mateRim, bombilla, thermosBody, thermosCap, mateFoot);

  // --- the wall: things that are not work, but are the reason for it -------
  function wallPoster(id: string, src: string, x: number, y: number, w: number, aspect: number) {
    const h = w * aspect;
    const texture = loaderShared.load(src);
    texture.colorSpace = SRGBColorSpace;

    const group = new Group();
    const board = new Mesh(
      keep(new BoxGeometry(w + 0.055, h + 0.055, 0.03)),
      surface(0x26262d, 0.62),
    );
    board.position.z = 0.015;
    board.castShadow = true;
    const face = new Mesh(
      keep(new PlaneGeometry(w, h)),
      keep(new MeshBasicMaterial({ map: texture })),
    );
    face.position.z = 0.033;

    group.add(board, face);
    group.position.set(x, y, ROOM.backZ + 0.01);
    scene.add(group);
    note(id, y + h / 2 + 0.14, face, board);
  }

  wallPoster('umm-kulthum', '/work/tex/umm-kulthum.jpg', -3.32, 2.52, 1.15, 583 / 512);
  wallPoster('death-note', '/work/tex/death-note.jpg', -1.58, 2.5, 1.02, 746 / 576);

  // --- keyboard: a 75% board, laid out for real rather than faked ----------
  const KB_U = 0.098; // world units per key unit
  const CAP_H = 0.05;
  const CASE_H = 0.07;

  type Kind = 'alpha' | 'mod' | 'accent' | 'gap';
  const rows: [number, Kind][][] = [
    [[1, 'accent'], [0.5, 'gap'], [1, 'alpha'], [1, 'alpha'], [1, 'alpha'], [1, 'alpha'],
     [0.25, 'gap'], [1, 'mod'], [1, 'mod'], [1, 'mod'], [1, 'mod'],
     [0.25, 'gap'], [1, 'alpha'], [1, 'alpha'], [1, 'alpha'], [1, 'alpha'], [1, 'gap']],
    [...Array(13).fill([1, 'alpha']), [2, 'mod'], [1, 'mod']],
    [[1.5, 'mod'], ...Array(12).fill([1, 'alpha']), [1.5, 'mod'], [1, 'mod']],
    [[1.75, 'mod'], ...Array(11).fill([1, 'alpha']), [2.25, 'accent'], [1, 'mod']],
    [[2.25, 'mod'], ...Array(10).fill([1, 'alpha']), [1.75, 'mod'], [1, 'accent'], [1, 'mod']],
    [[1.25, 'mod'], [1.25, 'mod'], [1.25, 'mod'], [7.25, 'accent'], [1.25, 'mod'], [1.25, 'mod'],
     [1.25, 'accent'], [1.25, 'accent'], [1.25, 'accent']],
  ];

  const caseW = 16 * KB_U + 0.1;
  const caseD = 6.5 * KB_U + 0.12;

  const keyboard = new Group();
  const kbCase = new Mesh(
    keep(new BoxGeometry(caseW, CASE_H, caseD)),
    surface(0x141418, 0.5),
  );
  kbCase.position.y = CASE_H / 2;
  kbCase.castShadow = true;
  kbCase.receiveShadow = true;
  keyboard.add(kbCase);

  const capCount = rows.flat().filter(([, k]) => k !== 'gap').length;
  const caps = new InstancedMesh(
    keep(new BoxGeometry(1, 1, 1)),
    keep(new MeshStandardMaterial({ color: 0xffffff, roughness: 0.62 })),
    capCount,
  );
  caps.castShadow = true;

  const KIND_COLOR: Record<Exclude<Kind, 'gap'>, number> = {
    alpha: 0x2b3a5e,
    mod: 0x1c1c22,
    accent: 0xf0b429,
  };

  const m = new Matrix4();
  const q = new Quaternion();
  const pos = new Vector3();
  const scl = new Vector3();
  const col = new Color();
  const capY = CASE_H + CAP_H / 2 - 0.008;
  let n = 0;

  rows.forEach((row, r) => {
    const units = row.reduce((sum, [w]) => sum + w, 0);
    // The function row sits slightly further back, as it does on a real board.
    const z = -caseD / 2 + 0.06 + (r + 0.5) * KB_U + (r > 0 ? 0.35 * KB_U : 0);
    let x = -(units * KB_U) / 2;
    for (const [w, kind] of row) {
      if (kind === 'gap') {
        x += w * KB_U;
        continue;
      }
      pos.set(x + (w * KB_U) / 2, capY, z);
      scl.set(w * KB_U - 0.014, CAP_H, KB_U - 0.014);
      caps.setMatrixAt(n, m.compose(pos, q, scl));
      caps.setColorAt(n, col.setHex(KIND_COLOR[kind]));
      n += 1;
      x += w * KB_U;
    }
  });
  caps.instanceMatrix.needsUpdate = true;
  if (caps.instanceColor) caps.instanceColor.needsUpdate = true;
  keyboard.add(caps);

  // The rotary knob at the top right.
  const knob = new Mesh(keep(new CylinderGeometry(0.052, 0.052, 0.036, 20)), surface(0x0f0f12, 0.42));
  knob.position.set(caseW / 2 - 0.095, CASE_H + 0.016, -caseD / 2 + 0.115);
  knob.castShadow = true;
  const knobRing = new Mesh(keep(new CylinderGeometry(0.062, 0.062, 0.026, 20)), metalMat);
  knobRing.position.copy(knob.position).setY(CASE_H + 0.011);
  keyboard.add(knob, knobRing);

  keyboard.position.set(-0.15, DESK.top, DESK.z + 0.85);
  keyboard.rotation.y = 0.035;
  scene.add(keyboard);
  note('keyboard', DESK.top + 0.2, kbCase, caps as unknown as Mesh);

  // --- mouse ---------------------------------------------------------------
  const mouse = new Group();
  const shellMatMouse = surface(0x17171b, 0.52);
  const shell = new Mesh(
    keep(new SphereGeometry(1, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2)),
    shellMatMouse,
  );
  shell.scale.set(0.105, 0.082, 0.165);
  shell.castShadow = true;
  const skirt = new Mesh(keep(new CylinderGeometry(1, 1, 1, 28)), surface(0x25252b, 0.6));
  skirt.scale.set(0.104, 0.02, 0.163);
  skirt.position.y = 0.01;
  skirt.castShadow = true;
  const wheel = new Mesh(keep(new CylinderGeometry(0.017, 0.017, 0.014, 12)), surface(0x3c3c44, 0.5));
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.072, -0.062);
  mouse.add(skirt, shell, wheel);
  mouse.position.set(0.98, DESK.top, DESK.z + 0.92);
  mouse.rotation.y = -0.14;
  scene.add(mouse);
  note('mouse', DESK.top + 0.24, shell, skirt);

  // A lamp: the reason the desk is the lit place.
  const lamp = new Group();
  const lampBase = new Mesh(keep(new CylinderGeometry(0.24, 0.26, 0.06, 20)), propMat);
  lampBase.position.y = 0.03;
  const lampArm = new Mesh(keep(new CylinderGeometry(0.028, 0.028, 1.5, 10)), propMat);
  lampArm.position.set(0, 0.78, 0);
  lampArm.rotation.z = -0.16;
  const lampHead = new Mesh(keep(new CylinderGeometry(0.09, 0.2, 0.26, 18, 1, true)), propMat);
  lampHead.position.set(0.34, 1.44, 0);
  lampHead.rotation.z = 1.05;
  lamp.add(lampBase, lampArm, lampHead);
  lamp.position.set(-4.0, DESK.top, DESK.z - 0.8);
  lamp.traverse((o) => {
    if (o instanceof Mesh) o.castShadow = true;
  });
  scene.add(lamp);

  // --- light ---------------------------------------------------------------
  scene.add(new AmbientLight(0xffffff, 0.34));

  const key = new SpotLight(0xfff3e6, opts.compact ? 90 : 130, 22, 0.72, 0.55, 1.6);
  key.position.set(-3.2, 4.0, 2.6);
  key.target.position.set(-0.6, DESK.top, DESK.z);
  key.castShadow = !opts.compact;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0008;
  scene.add(key, key.target);

  // Sits just below the lamp head, which is at local (0.34, 1.44) of the lamp group.
  const lampLight = new PointLight(0xffd9a8, 16, 6, 2);
  lampLight.position.set(-3.55, DESK.top + 1.25, DESK.z - 0.75);
  scene.add(lampLight);

  const rim = new PointLight(ACCENT, 42, 16, 2);
  rim.position.set(5.0, 1.6, 0.8);
  scene.add(rim);

  // --- artifacts -----------------------------------------------------------
  const loader = loaderShared;
  const textures: Texture[] = [];
  const pickable: Mesh[] = [];
  const SHELL = 0x2c2c34;

  for (const spec of artifacts) {
    const texture = loader.load(spec.texture);
    texture.colorSpace = SRGBColorSpace;
    textures.push(texture);

    const w = spec.width;
    const h = w * spec.aspect;

    // Unlit, so the real screenshots read true instead of being tinted by the room.
    const screen = new Mesh(
      keep(new PlaneGeometry(w, h)),
      keep(new MeshBasicMaterial({ map: texture })),
    );

    const shellMat = keep(
      new MeshStandardMaterial({ color: SHELL, roughness: 0.5, metalness: 0.2 }),
    );
    const group = new Group();

    if (spec.place === 'wall') {
      // A mounted drawing: a board standing off the wall so it casts onto it.
      const board = new Mesh(keep(new BoxGeometry(w + 0.07, h + 0.07, 0.04)), shellMat);
      board.position.z = 0.02;
      board.castShadow = true;
      screen.position.z = 0.042;
      group.add(board, screen);
      group.position.set(spec.x, 2.05, ROOM.backZ + 0.01);
    } else {
      /*
       * A monitor, not a picture frame: bezel with a chin, a neck, and a base
       * that actually rests on the desk. The previous version was a box slightly
       * larger than the image, which left an unexplained border and sank through
       * the desk surface at the bottom.
       */
      const CHIN = 0.11;
      const BASE_H = 0.04;
      const NECK_H = 0.3;

      const base = new Mesh(keep(new BoxGeometry(w * 0.4, BASE_H, 0.46)), shellMat);
      base.position.set(0, BASE_H / 2, 0.02);
      base.castShadow = true;
      base.receiveShadow = true;

      const neck = new Mesh(keep(new BoxGeometry(0.15, NECK_H, 0.08)), shellMat);
      neck.position.set(0, BASE_H + NECK_H / 2, 0);
      neck.castShadow = true;

      const bezelH = h + 0.07 + CHIN;
      const bezelY = BASE_H + NECK_H + bezelH / 2;
      const bezel = new Mesh(keep(new BoxGeometry(w + 0.07, bezelH, 0.055)), shellMat);
      bezel.position.set(0, bezelY, -0.02);
      bezel.castShadow = true;

      // Lifted by half the chin so the glass sits above the bezel's bottom lip.
      screen.position.set(0, bezelY + CHIN / 2, 0.013);

      group.add(base, neck, bezel, screen);
      group.position.set(spec.x, DESK.top, DESK.z - 0.7);
      group.rotation.x = -0.05;
    }

    screen.userData.id = spec.id;
    screen.userData.name = spec.name;
    screen.userData.halfHeight = h / 2;
    screen.userData.shellMat = shellMat;
    screen.userData.group = group;

    scene.add(group);
    pickable.push(screen);
  }

  // --- look and pick -------------------------------------------------------
  const raycaster = new Raycaster();
  const pointer = new Vector2(-2, -2);
  let hovered: Mesh | null = null;

  // The label is positioned in screen space rather than pinned to a corner, so
  // it names the thing the pointer is actually on.
  const anchor = new Vector3();
  const probe = new Vector3();
  const ndc = new Vector2();
  const size = { w: 1, h: 1 };
  let hoveredNote: Mesh | null = null;

  const look = { x: 0, y: 0 };
  const lookTarget = { x: 0, y: 0 };

  let running = false;
  let active = true;
  let last = 0;

  function frame(time: number) {
    const dt = last === 0 ? 0.016 : Math.min((time - last) / 1000, 0.05);
    last = time;
    const ease = 1 - Math.exp(-6 * dt);

    look.x += (lookTarget.x - look.x) * ease;
    look.y += (lookTarget.y - look.y) * ease;

    camera.position.set(HOME.x + look.x * 1.5, HOME.y + look.y * 0.7, HOME.z);
    camera.lookAt(look.x * 0.5, opts.compact ? -0.28 : -0.05, -2);

    raycaster.setFromCamera(pointer, camera);
    const front = raycaster.intersectObjects([...pickable, ...noteMeshes], false)[0]
      ?.object as Mesh | undefined;
    const isProject = !!front && pickable.includes(front);
    const next = isProject ? front : null;
    hoveredNote = !front || isProject ? null : front;
    if (next !== hovered) {
      if (hovered) (hovered.userData.shellMat as MeshStandardMaterial).color.set(SHELL);
      hovered = next;
      if (hovered) (hovered.userData.shellMat as MeshStandardMaterial).color.set(ACCENT);
    }

    for (const mesh of pickable) {
      const group = mesh.userData.group as Group;
      const want = mesh === hovered ? 1.02 : 1;
      group.scale.setScalar(group.scale.x + (want - group.scale.x) * ease);
    }

    if (opts.onHover) {
      if (hoveredNote) {
        hoveredNote.getWorldPosition(anchor);
        anchor.y = hoveredNote.userData.anchorY as number;
        anchor.project(camera);
        const spec = hoveredNote.userData.note as DeskNoteSpec;
        opts.onHover({
          kind: 'note',
          name: spec.title,
          body: spec.body,
          x: (anchor.x * 0.5 + 0.5) * size.w,
          y: (-anchor.y * 0.5 + 0.5) * size.h,
        });
      } else if (hovered) {
        // A point just above the artifact's top edge, in its own local space, so
        // the group's position, tilt and hover scale are all accounted for.
        anchor.set(0, (hovered.userData.halfHeight as number) + 0.16, 0);
        hovered.localToWorld(anchor);
        anchor.project(camera);
        opts.onHover({
          kind: 'project',
          name: hovered.userData.name as string,
          x: (anchor.x * 0.5 + 0.5) * size.w,
          y: (-anchor.y * 0.5 + 0.5) * size.h,
        });
      } else {
        opts.onHover(null);
      }
    }

    renderer.render(scene, camera);
  }

  function start() {
    if (running || !active) return;
    running = true;
    last = 0;
    renderer.setAnimationLoop(frame);
  }

  function stop() {
    if (!running) return;
    running = false;
    renderer.setAnimationLoop(null);
  }

  start();

  return {
    resize(w, h) {
      size.w = w;
      size.h = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fit(camera.aspect);
      start();
    },
    setPointer(x, y) {
      pointer.set(x, y);
      start();
    },
    setDrag(dx, dy) {
      lookTarget.x = Math.max(-1, Math.min(1, dx));
      lookTarget.y = Math.max(-1, Math.min(1, dy));
      start();
    },
    probeAt(nx, ny) {
      raycaster.setFromCamera(ndc.set(nx, ny), camera);

      // 1. A direct hit on a project.
      const onProject = raycaster.intersectObjects(pickable, false)[0]?.object as Mesh | undefined;
      if (onProject) return { project: onProject.userData.id as string };

      // 2. A direct hit on a desk note.
      const onNote = raycaster.intersectObjects(noteMeshes, false)[0]?.object as Mesh | undefined;
      if (onNote) {
        const spec = onNote.userData.note as DeskNoteSpec;
        onNote.getWorldPosition(probe);
        probe.y = onNote.userData.anchorY as number;
        probe.project(camera);
        return {
          kind: 'note',
          name: spec.title,
          body: spec.body,
          x: (probe.x * 0.5 + 0.5) * size.w,
          y: (-probe.y * 0.5 + 0.5) * size.h,
        };
      }

      // 3. Missed everything. A finger is wider than a cursor, and a mate gourd
      //    is about twenty pixels across on a phone, so fall back to whatever is
      //    nearest on screen: project or note, whichever is genuinely closer.
      const tapX = (nx * 0.5 + 0.5) * size.w;
      const tapY = (-ny * 0.5 + 0.5) * size.h;
      const limit = Math.min(size.w, size.h) * 0.12;

      let best: Mesh | null = null;
      let bestDistance = Infinity;
      for (const mesh of [...pickable, ...noteMeshes]) {
        mesh.getWorldPosition(probe);
        probe.project(camera);
        const dx = (probe.x * 0.5 + 0.5) * size.w - tapX;
        const dy = (-probe.y * 0.5 + 0.5) * size.h - tapY;
        const distance = Math.hypot(dx, dy);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = mesh;
        }
      }
      if (!best || bestDistance > limit) return null;

      if (pickable.includes(best)) return { project: best.userData.id as string };

      const spec = best.userData.note as DeskNoteSpec;
      best.getWorldPosition(probe);
      probe.y = best.userData.anchorY as number;
      probe.project(camera);
      return {
        kind: 'note',
        name: spec.title,
        body: spec.body,
        x: (probe.x * 0.5 + 0.5) * size.w,
        y: (-probe.y * 0.5 + 0.5) * size.h,
      };
    },
    setActive(on) {
      active = on;
      if (!on) stop();
      else start();
    },
    dispose() {
      stop();
      textures.forEach((t) => t.dispose());
      bin.forEach((d) => d.dispose());
      (floorMat as Material).dispose();
      renderer.dispose();
    },
  };
}
