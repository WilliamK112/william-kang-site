import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from '../assets/background-3d/vendor/three.module.js';
import { createStudioVisit } from '../assets/studio-3d/studio-visit.js';

const EPSILON = 1e-9;
const ROUTE = ['lectern', 'aisle', 'entry', 'window'];
const CONSTRAINTS = {
  enabled: true,
  enableDamping: true,
  enableZoom: true,
  minDistance: 13,
  maxDistance: 38,
  minPolarAngle: .18,
  maxPolarAngle: 1.35,
  minAzimuthAngle: -.8,
  maxAzimuthAngle: 1.4,
};

function nearVector(actual, expected, message) {
  assert.ok(actual.distanceTo(expected) < EPSILON,
    `${message}: ${actual.toArray()} instead of ${expected.toArray()}`);
}

function fixture({ reduced = false, behindStudio = false } = {}) {
  const studioGroup = new THREE.Group();
  studioGroup.position.set(-1.65, 0, .5);
  studioGroup.scale.setScalar(.88);
  studioGroup.updateMatrixWorld(true);
  const camera = new THREE.PerspectiveCamera(37, 16 / 9, .01, 200);
  camera.position.copy(behindStudio
    ? studioGroup.localToWorld(new THREE.Vector3(1, 6, -8))
    : new THREE.Vector3(17.6, 13.9, 24));
  const controls = {
    ...CONSTRAINTS,
    target: new THREE.Vector3(0, 1.9, -.2),
    update() { camera.lookAt(this.target); },
  };
  controls.update();
  const initial = {
    position: camera.position.clone(),
    target: controls.target.clone(),
    direction: camera.getWorldDirection(new THREE.Vector3()),
    fov: camera.fov,
    constraints: { ...CONSTRAINTS },
  };
  const door = {
    open: false,
    hovered: true,
    flushes: 0,
    setOpen(value) { this.open = value; },
    setHovered(value) { this.hovered = value; },
    update(_dt, instant) { if (instant) this.flushes++; },
  };
  const changes = [];
  const visit = createStudioVisit({
    THREE, camera, controls, door, studioGroup,
    reducedMotion: () => reduced,
    onChange: state => changes.push(state),
  });
  return {
    visit, camera, controls, door, studioGroup, initial, changes,
    setReduced(value) { reduced = value; },
    nodePosition(id) {
      const node = visit.nodes.find(node => node.id === id);
      assert.ok(node, `Unknown test node ${id}`);
      return studioGroup.localToWorld(new THREE.Vector3(...node.position));
    },
  };
}

function finish(f, expectedState, observe = () => {}) {
  for (let frames = 0; f.visit.moving && frames < 400; frames++) {
    assert.equal(f.visit.update(.08), true);
    observe();
  }
  assert.equal(f.visit.moving, false, 'Transition must finish in bounded time');
  assert.equal(f.visit.state, expectedState);
}

function atNode(f, id) {
  assert.equal(f.visit.currentNode, id);
  assert.equal(f.visit.state, 'interior');
  nearVector(f.camera.position, f.nodePosition(id), `Camera at ${id}`);
}

function enter(f) {
  f.visit.enter();
  finish(f, 'interior');
  atNode(f, 'lectern');
  assert.equal(f.door.open, true);
  assert.equal(f.door.hovered, false);
  assert.equal(f.controls.enabled, false);
  assert.equal(f.controls.enableZoom, false);
}

function reach(f, id) {
  enter(f);
  for (const next of ROUTE.slice(1, ROUTE.indexOf(id) + 1)) {
    assert.equal(f.visit.moveTo(next), true);
    finish(f, 'interior');
    atNode(f, next);
  }
}

function restored(f) {
  assert.equal(f.visit.state, 'exterior');
  assert.equal(f.visit.currentNode, null);
  assert.equal(f.visit.active, false);
  assert.equal(f.visit.moving, false);
  nearVector(f.camera.position, f.initial.position, 'Original camera position');
  nearVector(f.controls.target, f.initial.target, 'Original orbit target');
  nearVector(f.camera.getWorldDirection(new THREE.Vector3()), f.initial.direction,
    'Original camera direction');
  assert.equal(f.camera.fov, f.initial.fov);
  for (const [name, value] of Object.entries(f.initial.constraints)) {
    assert.equal(f.controls[name], value, `Original ${name} constraint`);
  }
  assert.equal(f.door.open, false);
  assert.equal(f.visit.update(.1), false, 'Exterior update must remain idle');
}

test('only adjacent room destinations can start a move, and a hop cannot be interrupted by another hop', () => {
  const f = fixture();
  assert.equal(f.visit.moveTo('aisle'), false);
  f.visit.enter();
  assert.equal(f.visit.moveTo('aisle'), false);
  finish(f, 'interior');

  for (const route of [ROUTE.slice(1), ROUTE.slice(0, -1).reverse()]) {
    for (const destination of route) {
      const current = f.visit.nodes.find(node => node.id === f.visit.currentNode);
      const originalPosition = f.camera.position.clone();
      for (const rejected of [current.id, 'missing', ...ROUTE.filter(id => !current.neighbors.includes(id))]) {
        assert.equal(f.visit.moveTo(rejected), false, `${current.id} must reject ${rejected}`);
        assert.equal(f.visit.state, 'interior');
        nearVector(f.camera.position, originalPosition, 'Rejected move leaves camera fixed');
      }
      assert.equal(f.visit.moveTo(destination), true);
      assert.equal(f.visit.state, 'relocating');
      assert.equal(f.visit.currentNode, current.id, 'Current node changes only after arrival');
      assert.equal(f.visit.moveTo(current.id), false);
      assert.equal(f.visit.moveTo(destination), false);
      finish(f, 'interior');
      atNode(f, destination);
    }
  }
});

test('looking around keeps the eye fixed, and an adjacent hop preserves that look direction and field of view', () => {
  const f = fixture();
  enter(f);
  const start = f.camera.position.clone();
  const direction = new THREE.Vector3(.73, -.2, -1.35);
  f.controls.target.copy(start).add(direction);
  f.camera.lookAt(f.controls.target);
  const normalized = direction.clone().normalize();
  const fov = f.camera.fov;
  for (let i = 0; i < 5; i++) assert.equal(f.visit.update(.1), false);
  nearVector(f.camera.position, start, 'Looking does not translate the eye');
  nearVector(f.camera.getWorldDirection(new THREE.Vector3()), normalized, 'Requested look direction');

  const end = f.nodePosition('aisle');
  const path = end.clone().sub(start);
  assert.equal(f.visit.moveTo('aisle'), true);
  let sawIntermediatePosition = false;
  finish(f, 'interior', () => {
    const displacement = f.camera.position.clone().sub(start);
    const fraction = displacement.dot(path) / path.lengthSq();
    assert.ok(fraction >= -EPSILON && fraction <= 1 + EPSILON, 'Hop stays within its safe aisle segment');
    nearVector(f.camera.position, start.clone().addScaledVector(path, fraction), 'Hop does not drift sideways');
    if (fraction > 0 && fraction < 1) sawIntermediatePosition = true;
    nearVector(f.controls.target.clone().sub(f.camera.position), direction, 'Look target follows the eye');
    nearVector(f.camera.getWorldDirection(new THREE.Vector3()), normalized, 'Heading remains unchanged');
    assert.equal(f.camera.fov, fov);
  });
  assert.equal(sawIntermediatePosition, true, 'Normal motion must animate rather than teleport');
  atNode(f, 'aisle');
});

test('reduced motion enters, changes nodes, and exits synchronously without leaving a transitional state', () => {
  const f = fixture({ reduced: true });
  f.visit.enter();
  atNode(f, 'lectern');
  assert.equal(f.visit.moving, false);
  for (const next of ROUTE.slice(1)) {
    assert.equal(f.visit.moveTo(next), true);
    atNode(f, next);
    assert.equal(f.visit.moving, false);
  }
  f.visit.exit();
  restored(f);
  assert.ok(f.door.flushes >= 5, 'Door state is synchronized on instant transitions');
});

for (const destination of ROUTE) {
  test(`exiting from ${destination} follows the clear aisle to the doorway and restores the original orbit`, () => {
    const f = fixture();
    reach(f, destination);
    const required = {
      lectern: ['aisle', 'entry'],
      aisle: ['entry'],
      entry: [],
      window: ['entry'],
    }[destination];
    let nextRequired = 0;
    f.visit.exit();
    assert.equal(f.visit.state, 'exiting');
    assert.equal(f.visit.moveTo('aisle'), false);
    finish(f, 'exterior', () => {
      if (nextRequired < required.length &&
          f.camera.position.distanceTo(f.nodePosition(required[nextRequired])) < EPSILON) nextRequired++;
    });
    assert.equal(nextRequired, required.length, 'Exit must pass the safe room nodes in order');
    restored(f);
  });
}

test('exiting during a hop completes the safe segment before returning through the doorway', () => {
  const f = fixture();
  reach(f, 'aisle');
  assert.equal(f.visit.moveTo('lectern'), true);
  f.visit.update(.21);
  assert.equal(f.visit.state, 'relocating');
  assert.ok(f.camera.position.distanceTo(f.nodePosition('lectern')) > .1);
  const required = ['lectern', 'aisle', 'entry'];
  let nextRequired = 0;
  f.visit.exit();
  finish(f, 'exterior', () => {
    if (nextRequired < required.length &&
        f.camera.position.distanceTo(f.nodePosition(required[nextRequired])) < EPSILON) nextRequired++;
  });
  assert.equal(nextRequired, required.length, 'Interrupted hop exits via safe connected nodes');
  restored(f);
});

for (const elapsed of [0, .35, 1.6, 2.6]) {
  test(`entry interrupted at ${elapsed}s can exit without losing the exterior snapshot`, () => {
    const f = fixture();
    f.visit.enter();
    for (let remaining = elapsed; remaining > EPSILON; remaining -= .05) {
      f.visit.update(Math.min(.05, remaining));
    }
    assert.equal(f.visit.state, 'entering');
    f.visit.exit();
    assert.equal(f.visit.state, 'exiting');
    const changes = f.changes.length;
    f.visit.enter();
    f.visit.exit();
    assert.equal(f.changes.length, changes, 'Repeated entry/exit cannot restart an active exit');
    finish(f, 'exterior');
    restored(f);
  });
}

test('entering from behind the studio and completing a second visit preserve the exterior camera', () => {
  const f = fixture({ behindStudio: true });
  for (let cycle = 0; cycle < 2; cycle++) {
    reach(f, 'window');
    f.visit.exit();
    finish(f, 'exterior');
    restored(f);
  }
});

for (const interruptedState of ['entering', 'relocating', 'exiting']) {
  test(`an immediate exit restores all camera state while ${interruptedState}`, () => {
    const f = fixture();
    if (interruptedState === 'entering') f.visit.enter();
    else {
      enter(f);
      if (interruptedState === 'relocating') f.visit.moveTo('aisle');
      else f.visit.exit();
    }
    f.visit.update(.2);
    assert.equal(f.visit.state, interruptedState);
    f.visit.exit({ immediate: true });
    restored(f);
  });
}

test('turning on reduced motion during entry or a hop completes the pending transition', () => {
  const f = fixture();
  f.visit.enter();
  f.visit.update(.2);
  assert.equal(f.visit.update(0, true), true);
  atNode(f, 'lectern');
  f.visit.moveTo('aisle');
  f.visit.update(.2);
  assert.equal(f.visit.update(0, true), true);
  atNode(f, 'aisle');
  f.setReduced(true);
  f.visit.exit();
  restored(f);
});
