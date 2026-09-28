// A glass entry door in the studio's local coordinates. The host owns input,
// camera transitions and frame scheduling; this module creates no event loop.
export function buildStudioDoor({THREE, scene, box, cyl, rod, mat, panel}) {
  const group = new THREE.Group();
  group.name = 'Interactive studio glass entrance';
  scene.add(group);

  const aluminum = mat(0x78969c);
  const darkSeal = mat(0x3e6167);
  const leafMetal = mat(0xa7bbb3);
  // Hover changes are local to the door, never to cached scene materials.
  const accent = mat(0xafd7bf, 0xa8e8bf, .11).clone();
  const plaqueMaterial = mat(0xb8172f, 0xff3150, .24).clone();
  const handleMaterial = mat(0xd8d8bf, 0xbbe5c7, .025).clone();
  const glass = new THREE.MeshBasicMaterial({
    color: 0xa7e3df, transparent: true, opacity: .065,
    depthWrite: false, side: THREE.DoubleSide
  });

  // Solid jambs end at the lintel/threshold faces instead of overlapping them.
  for (const x of [2.52, 3.66]) {
    box(.05, 3.21, .072, x, 2.015, 1.46, aluminum, group);
    box(.012, 3.18, .026, x + (x < 3 ? .030 : -.030), 2.015, 1.434, darkSeal, group, false);
  }
  box(1.19, .06, .077, 3.09, .38, 1.46, aluminum, group);
  box(1.19, .06, .077, 3.09, 3.65, 1.46, aluminum, group);

  const leaf = new THREE.Group();
  leaf.name = 'Right-hinged glass door leaf';
  leaf.position.set(3.66, .38, 1.46);
  leaf.userData.dynamic = true;
  group.add(leaf);
  const glassLeaf = box(1.026, 3.126, .023, -.565, 1.625, 0, glass, leaf, false);
  glassLeaf.name = 'Door glass';
  for (const x of [-1.082, -.048]) box(.026, 3.166, .041, x, 1.625, 0, leafMetal, leaf);
  for (const y of [.057, 3.193]) box(1.06, .03, .041, -.565, y, 0, leafMetal, leaf);
  box(1.027, .033, .025, -.565, .92, .025, accent, leaf, false);

  // Compact barrel hinges explain the small gap between the pivot and leaf.
  for (const y of [.52, 2.65]) {
    cyl(.027, .13, 3.66, y + .38, 1.46, aluminum, group, 12);
    box(.062, .09, .020, -.032, y, .028, leafMetal, leaf, false);
  }
  for (const y of [1.03, 1.54]) rod([-.945, y, .015], [-.945, y, .09], .018, handleMaterial, leaf);
  rod([-.945, 1.03, .09], [-.945, 1.54, .09], .022, handleMaterial, leaf);
  // An inside pull stays within the door's own narrow swing envelope.
  for (const y of [1.12, 1.45]) rod([-.945, y, -.015], [-.945, y, -.069], .012, leafMetal, leaf);
  rod([-.945, 1.12, -.069], [-.945, 1.45, -.069], .017, leafMetal, leaf);

  // The rigid backing stays inside the painted velvet area so the canvas
  // fibers remain visible as the outer silhouette at normal camera distance.
  const plaque = box(.70, .18, .024, -.565, 2.075, .033, plaqueMaterial, leaf, false);
  plaque.name = 'Red fuzzy entry invitation';
  const enter = panel(.765, .255, -.565, 2.075, .046, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);

    // Deterministic fibers keep the sign crisp while giving its silhouette a
    // soft, plush edge instead of a flat rectangular label.
    let seed = 1729;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const left = W * .055, right = W * .945, top = H * .17, bottom = H * .83;
    const furColors = ['#ff4960', '#e92742', '#c91330', '#ff6a78'];
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, H * .018);
    for (let i = 0; i < 180; i += 1) {
      const horizontal = i < 110;
      const side = random() < .5 ? -1 : 1;
      const length = H * (.055 + random() * .10);
      const sway = (random() - .5) * H * .055;
      let x1, y1, x2, y2;
      if (horizontal) {
        x1 = left + random() * (right - left);
        y1 = side < 0 ? top : bottom;
        x2 = x1 + sway;
        y2 = y1 + side * length;
      } else {
        x1 = side < 0 ? left : right;
        y1 = top + random() * (bottom - top);
        x2 = x1 + side * length;
        y2 = y1 + sway;
      }
      ctx.strokeStyle = furColors[Math.floor(random() * furColors.length)];
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo((x1 + x2) / 2 + sway * .35, (y1 + y2) / 2, x2, y2);
      ctx.stroke();
    }

    const velvet = ctx.createLinearGradient(0, top, 0, bottom);
    velvet.addColorStop(0, '#f23b50');
    velvet.addColorStop(.48, '#d51f39');
    velvet.addColorStop(1, '#a90f28');
    ctx.fillStyle = velvet;
    ctx.fillRect(left, top, right - left, bottom - top);
    for (let i = 0; i < 130; i += 1) {
      const x = left + random() * (right - left);
      const y = top + random() * (bottom - top);
      const alpha = .08 + random() * .18;
      ctx.fillStyle = random() < .5 ? `rgba(255,255,255,${alpha})` : `rgba(80,0,14,${alpha})`;
      ctx.fillRect(x, y, Math.max(1, H * .012), Math.max(1, H * .012));
    }

    ctx.fillStyle = '#fff6e8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(H * .41)}px Arial, sans-serif`;
    ctx.shadowColor = 'rgba(72,0,15,.65)';
    ctx.shadowBlur = H * .035;
    ctx.shadowOffsetY = H * .018;
    ctx.fillText('ENTER', W * .12, H * .51, W * .55);
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#fff6e8';
    ctx.lineWidth = Math.max(4, H * .036);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(W * .73, H * .50); ctx.lineTo(W * .88, H * .50);
    ctx.moveTo(W * .825, H * .36); ctx.lineTo(W * .88, H * .50); ctx.lineTo(W * .825, H * .64);
    ctx.stroke();
  }, leaf);
  enter.material.side = THREE.FrontSide;
  enter.name = 'ENTER arrow lettering';

  // A fixed, invisible opening target keeps the entry easy to activate after
  // the glass swings aside. visible=true is required for native raycasting.
  const targetMaterial = new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0, depthWrite: false,
    colorWrite: false, side: THREE.DoubleSide
  });
  const openingTarget = new THREE.Mesh(new THREE.PlaneGeometry(1.075, 3.17), targetMaterial);
  openingTarget.position.set(3.09, 2.015, 1.489);
  openingTarget.name = 'Studio entry opening hit target';
  openingTarget.userData.dynamic = true;
  group.add(openingTarget);

  const maximumAngle = 1.48;
  let amount = 0, target = 0, hover = 0, hoverTarget = 0;
  const moving = () => Math.abs(amount - target) > .0001 || Math.abs(hover - hoverTarget) > .0001;
  return {
    group,
    leaf,
    hitMeshes: [openingTarget, glassLeaf, plaque],
    setOpen(value) { target = value ? 1 : 0; },
    setHovered(value) { hoverTarget = value ? 1 : 0; },
    update(dt, reducedMotion = false) {
      const oldAmount = amount, oldHover = hover;
      const step = Math.min(.1, Math.max(0, Number.isFinite(dt) ? dt : 0));
      amount = reducedMotion ? target : THREE.MathUtils.lerp(amount, target, 1 - Math.exp(-8.5 * step));
      hover = reducedMotion ? hoverTarget : THREE.MathUtils.lerp(hover, hoverTarget, 1 - Math.exp(-15 * step));
      if (Math.abs(amount - target) < .0001) amount = target;
      if (Math.abs(hover - hoverTarget) < .0001) hover = hoverTarget;
      leaf.rotation.y = amount * maximumAngle;
      accent.emissiveIntensity = .11 + hover * .39;
      plaqueMaterial.emissiveIntensity = .24 + hover * .56;
      handleMaterial.emissiveIntensity = .025 + hover * .17;
      return oldAmount !== amount || oldHover !== hover || moving();
    },
    get openAmount() { return amount; },
    get moving() { return moving(); }
  };
}
