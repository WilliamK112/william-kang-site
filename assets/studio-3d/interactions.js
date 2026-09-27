// Pointer navigation stays separate from camera gestures and native link semantics.
export function connectNavigation({ THREE, scene, camera, canvas, navigation, actions = [], onActivity, onGesture }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const targets = [...navigation.keys, ...actions];
  const roots = new Map(targets.map(target => [target.group, target]));
  const meshOwners = new Map(targets.flatMap(target => target.hitMeshes.map(mesh => [mesh, target])));
  const hitMeshes = [...meshOwners.keys()];
  const occluders = [];
  const listeners = [];
  const activePointers = new Set();
  let hovered = null, focused = null, pressed = null, gesture = null;

  function owner(object) {
    if (meshOwners.has(object)) return meshOwners.get(object);
    for (let node = object; node; node = node.parent) if (roots.has(node)) return roots.get(node);
    return null;
  }
  scene.traverse(object => {
    if (!object.isMesh || object.isReflector || owner(object)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (materials.some(material => !material.transparent)) occluders.push(object);
  });
  function visible(object) {
    for (let node = object; node; node = node.parent) if (!node.visible) return false;
    return true;
  }
  function hitAt(event) {
    if (canvas.closest('[data-state="fallback"]')) return null;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    if (!rect.width || !rect.height || x < 0 || x > rect.width || y < 0 || y > rect.height) return null;
    pointer.set(x / rect.width * 2 - 1, 1 - y / rect.height * 2);
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hitMeshes, false).find(result => visible(result.object) && owner(result.object)?.enabled?.() !== false);
    if (!hit) return null;
    raycaster.far = hit.distance - .035;
    const blocked = raycaster.intersectObjects(occluders, false).some(result => visible(result.object));
    raycaster.far = Infinity;
    return blocked ? null : owner(hit.object);
  }
  function refreshCursor() {
    canvas.style.cursor = gesture?.moved ? 'grabbing' : hovered ? 'pointer' : '';
    canvas.title = hovered ? (hovered.label || hovered.link?.label || '') + (hovered.link ? ' ↗' : '') : '';
  }
  function setHovered(next) {
    if (hovered === next) return;
    hovered = next;
    refreshCursor();
    onActivity();
  }
  function listen(target, name, handler, options) {
    target.addEventListener(name, handler, options);
    listeners.push(() => target.removeEventListener(name, handler, options));
  }
  function cancelGesture() {
    gesture = null;
    pressed = null;
    setHovered(null);
    refreshCursor();
    onActivity();
  }
  listen(canvas, 'pointerdown', event => {
    activePointers.add(event.pointerId);
    if (activePointers.size > 1 || !event.isPrimary || event.button !== 0) {
      cancelGesture();
      return;
    }
    const key = hitAt(event);
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, key, moved: false };
    pressed = key;
    if (event.pointerType !== 'touch') setHovered(key);
    onActivity();
  }, { passive: true });
  listen(canvas, 'pointermove', event => {
    if (gesture && gesture.id === event.pointerId) {
      if (!gesture.moved && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 7) {
        gesture.moved = true;
        onGesture?.();
        pressed = null;
        setHovered(null);
        refreshCursor();
        onActivity();
      }
      return;
    }
    if (!activePointers.size && event.pointerType !== 'touch') setHovered(hitAt(event));
  }, { passive: true });
  listen(canvas, 'pointerup', event => {
    const candidate = gesture;
    const wasSingle = activePointers.size === 1;
    activePointers.delete(event.pointerId);
    gesture = null;
    pressed = null;
    const released = hitAt(event);
    if (candidate && candidate.id === event.pointerId && wasSingle && event.isPrimary && event.button === 0 &&
        !candidate.moved && candidate.key && candidate.key === released &&
        Math.hypot(event.clientX - candidate.x, event.clientY - candidate.y) <= 7) {
      // Synchronous native anchor activation retains the browser's popup allowance.
      if (candidate.key.activate) candidate.key.activate();
      else candidate.key.link.anchor.click();
    }
    setHovered(event.pointerType === 'touch' ? null : released);
    refreshCursor();
    onActivity();
  }, { passive: true });
  listen(canvas, 'pointercancel', event => { activePointers.delete(event.pointerId); cancelGesture(); });
  listen(window, 'pointerup', event => {
    activePointers.delete(event.pointerId);
    if (gesture?.id === event.pointerId) cancelGesture();
  });
  listen(canvas, 'pointerleave', () => setHovered(null));
  listen(canvas, 'wheel', () => { if (gesture) gesture.moved = true; pressed = null; setHovered(null); onGesture?.(); }, { passive: true });
  listen(canvas, 'dblclick', event => {
    if (hitAt(event)) { event.stopImmediatePropagation(); event.preventDefault(); }
  }, true);
  listen(window, 'blur', () => { activePointers.clear(); cancelGesture(); });
  listen(canvas, 'webglcontextlost', () => { activePointers.clear(); cancelGesture(); });
  for (const target of targets) {
    if (target.cap) target.homeY ??= target.cap.position.y;
    const element = target.element || target.link?.anchor;
    if (!element) continue;
    listen(element, 'focus', () => { focused = target; target.onFocus?.(); onActivity(); });
    listen(element, 'blur', () => { focused = null; onActivity(); });
    if (target.activate) listen(element, 'click', target.activate);
  }

  return {
    hitAt,
    get hovered() { return hovered; },
    update(dt, reducedMotion) {
      let moving = false;
      for (const key of navigation.keys) {
        const selected = key === hovered || key === focused;
        const target = key.homeY + (key === pressed ? -.085 : selected ? .11 : 0);
        const oldY = key.cap.position.y;
        key.cap.position.y = reducedMotion ? target : THREE.MathUtils.lerp(oldY, target, 1 - Math.exp(-22 * dt));
        if (Math.abs(key.cap.position.y - target) < .0005) key.cap.position.y = target;
        if (Math.abs(oldY - key.cap.position.y) > .0001) moving = true;
        if (key.accentMaterial) key.accentMaterial.emissiveIntensity = selected ? .65 : .12;
      }
      return moving;
    },
    dispose() { listeners.forEach(remove => remove()); }
  };
}
