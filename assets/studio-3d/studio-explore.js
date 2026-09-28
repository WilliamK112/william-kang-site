// Fixed-eye room viewing. The scene owns rendering and navigation owns clicks.
export function createStudioExplore({ THREE, studioGroup, camera, controls, canvas, visit, wake, onActivity = () => {} }) {
  const group = new THREE.Group();
  group.name = 'Studio floor navigation';
  group.userData.dynamic = true;
  studioGroup.add(group);

  const listeners = [], pointers = new Set(), captures = new Set();
  const nodes = new Map(visit.nodes.map(node => [node.id, node]));
  const markers = new Map();
  const direction = new THREE.Vector3();
  const originalTouchAction = canvas.style.touchAction;
  const pitchLimit = THREE.MathUtils.degToRad(70);
  let state = visit.state, drag = null, disposed = false;

  function roundedSquare(half, radius, Path = THREE.Shape) {
    const path = new Path();
    path.moveTo(-half + radius, -half);
    path.lineTo(half - radius, -half);
    path.quadraticCurveTo(half, -half, half, -half + radius);
    path.lineTo(half, half - radius);
    path.quadraticCurveTo(half, half, half - radius, half);
    path.lineTo(-half + radius, half);
    path.quadraticCurveTo(-half, half, -half, half - radius);
    path.lineTo(-half, -half + radius);
    path.quadraticCurveTo(-half, -half, -half + radius, -half);
    path.closePath();
    return path;
  }
  const fillGeometry = new THREE.ShapeGeometry(roundedSquare(.22, .045), 4);
  const borderShape = roundedSquare(.22, .045);
  borderShape.holes.push(roundedSquare(.211, .036, THREE.Path));
  const borderGeometry = new THREE.ShapeGeometry(borderShape, 4);
  fillGeometry.rotateX(-Math.PI / 2);
  borderGeometry.rotateX(-Math.PI / 2);

  function currentId() { return typeof visit.currentNode === 'object' ? visit.currentNode?.id : visit.currentNode; }
  function available(id) {
    return !disposed && state === 'interior' && visit.state === 'interior' &&
      id !== currentId() && Boolean(nodes.get(currentId())?.neighbors.includes(id));
  }
  const actions = visit.nodes.map(node => {
    const marker = new THREE.Group();
    marker.name = `Walk to ${node.label || node.id}`;
    marker.position.set(node.position[0], node.floorY ?? .35, node.position[2]);
    const materialOptions = { transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false };
    const fillMaterial = new THREE.MeshBasicMaterial({ ...materialOptions, color: 0xb8e1d5, opacity: .10 });
    const borderMaterial = new THREE.MeshBasicMaterial({ ...materialOptions, color: 0xd0eee2, opacity: .42 });
    const fill = new THREE.Mesh(fillGeometry, fillMaterial);
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.y = .001;
    marker.add(fill, border);
    group.add(marker);
    markers.set(node.id, { group: marker, fillMaterial, borderMaterial, hover: 0 });
    return {
      id: `walk-${node.id}`, group: marker, hitMeshes: [fill],
      label: `Move to ${node.label || node.id}`,
      enabled: () => available(node.id),
      activate() { if (available(node.id)) visit.moveTo(node.id); }
    };
  });

  function activity() { onActivity(); wake?.(); }
  function listen(target, name, handler, options) {
    target.addEventListener(name, handler, options);
    listeners.push(() => target.removeEventListener(name, handler, options));
  }
  function releaseCapture(id) {
    if (!captures.delete(id)) return;
    if (canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id);
  }
  function cancelDrag() {
    drag = null;
    for (const id of [...captures]) releaseCapture(id);
  }
  function cancelPointers() { pointers.clear(); cancelDrag(); }
  function syncMarkers() {
    group.visible = !disposed && state === 'interior';
    for (const [id, marker] of markers) marker.group.visible = available(id);
  }
  function setState(next) {
    if (disposed) return;
    state = next;
    cancelPointers();
    canvas.style.touchAction = state === 'exterior' ? originalTouchAction : 'none';
    syncMarkers();
  }
  function angles() {
    camera.getWorldDirection(direction);
    return {
      yaw: Math.atan2(direction.x, -direction.z),
      pitch: Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1)),
      distance: Math.max(.1, camera.position.distanceTo(controls.target))
    };
  }
  function applyLook(yaw, pitch, distance) {
    pitch = THREE.MathUtils.clamp(pitch, -pitchLimit, pitchLimit);
    const horizontal = Math.cos(pitch);
    direction.set(Math.sin(yaw) * horizontal, Math.sin(pitch), -Math.cos(yaw) * horizontal);
    controls.target.copy(camera.position).addScaledVector(direction, distance);
    camera.lookAt(controls.target);
    camera.updateMatrixWorld();
    activity();
  }
  // Radian deltas are also useful for accessible, discrete look controls.
  function lookBy(yaw, pitch) {
    if (disposed || state !== 'interior' || visit.state !== 'interior' || !Number.isFinite(yaw) || !Number.isFinite(pitch)) return false;
    const start = angles();
    applyLook(start.yaw + yaw, start.pitch + pitch, start.distance);
    return true;
  }

  listen(canvas, 'pointerdown', event => {
    if (disposed || state !== 'interior' || visit.state !== 'interior') return;
    pointers.add(event.pointerId);
    if (pointers.size !== 1 || !event.isPrimary || event.button !== 0) { cancelDrag(); return; }
    canvas.focus?.({ preventScroll: true });
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, ...angles() };
    if (canvas.setPointerCapture) {
      canvas.setPointerCapture(event.pointerId);
      captures.add(event.pointerId);
    }
  }, { passive: true });
  listen(canvas, 'pointermove', event => {
    if (!drag || drag.id !== event.pointerId || pointers.size !== 1 || state !== 'interior' || visit.state !== 'interior') return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) <= 7) return;
    drag.moved = true;
    const height = Math.max(1, canvas.getBoundingClientRect().height);
    const sensitivity = THREE.MathUtils.degToRad(camera.fov) * 1.2 / height;
    applyLook(drag.yaw - dx * sensitivity, drag.pitch + dy * sensitivity, drag.distance);
  }, { passive: true });
  function pointerEnd(event) {
    pointers.delete(event.pointerId);
    if (drag?.id === event.pointerId) drag = null;
    releaseCapture(event.pointerId);
  }
  listen(canvas, 'pointerup', pointerEnd);
  listen(canvas, 'pointercancel', pointerEnd);
  listen(window, 'pointerup', pointerEnd);
  listen(window, 'pointercancel', pointerEnd);
  listen(canvas, 'lostpointercapture', event => {
    captures.delete(event.pointerId);
    if (drag?.id === event.pointerId) drag = null;
  });
  listen(window, 'blur', cancelPointers);
  listen(canvas, 'webglcontextlost', cancelPointers);
  listen(canvas, 'keydown', event => {
    if (event.target !== canvas || document.activeElement !== canvas || event.altKey || event.ctrlKey || event.metaKey) return;
    const step = THREE.MathUtils.degToRad(5);
    const changes = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const change = changes[event.key];
    if (change && lookBy(...change)) event.preventDefault();
  });
  setState(state);

  return {
    group, actions, setState, lookBy,
    update(dt, reducedMotion = false, hoveredId = null) {
      if (disposed) return false;
      if (visit.state !== state) setState(visit.state);
      syncMarkers();
      let moving = false;
      const step = Number.isFinite(dt) ? Math.max(0, Math.min(.1, dt)) : 0;
      for (const [id, marker] of markers) {
        const target = marker.group.visible && hoveredId === `walk-${id}` ? 1 : 0;
        const old = marker.hover;
        marker.hover = reducedMotion ? target : THREE.MathUtils.lerp(old, target, 1 - Math.exp(-16 * step));
        if (Math.abs(marker.hover - target) < .001) marker.hover = target;
        marker.fillMaterial.opacity = .10 + marker.hover * .14;
        marker.borderMaterial.opacity = .42 + marker.hover * .38;
        if (Math.abs(old - marker.hover) > .0001) moving = true;
      }
      return moving;
    },
    get stats() {
      const visibleMarkers = group.visible ? [...markers.values()].filter(marker => marker.group.visible).length : 0;
      return { markers: markers.size, visibleMarkers, drawCalls: visibleMarkers * 2 };
    },
    get diagnostics() {
      const look = angles();
      return Object.freeze({ state, currentNode: currentId(), dragging: Boolean(drag?.moved), pointerCount: pointers.size, yaw: look.yaw, pitch: look.pitch,
        visibleNodes: Object.freeze([...markers].filter(([, marker]) => group.visible && marker.group.visible).map(([id]) => id)) });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelPointers();
      listeners.forEach(remove => remove());
      canvas.style.touchAction = originalTouchAction;
      group.removeFromParent();
      fillGeometry.dispose(); borderGeometry.dispose();
      for (const marker of markers.values()) { marker.fillMaterial.dispose(); marker.borderMaterial.dispose(); }
    }
  };
}
