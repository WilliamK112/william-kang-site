// Two draw calls replace the original canopies and add one finite fall of leaves.
// The host owns all time, theme transitions and shadow-map scheduling.
export function buildSeasons({ THREE, scene, mat }, { trees = [] } = {}) {
  const root = new THREE.Group();
  root.name = 'Instanced seasonal tree foliage';
  root.userData.dynamic = true;
  scene.add(root);
  scene.updateMatrixWorld(true);

  const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
  const smooth = (low, high, value) => {
    const t = clamp((value - low) / (high - low));
    return t * t * (3 - 2 * t);
  };
  function random(index, salt = 0) {
    let n = Math.imul(index + 113, 374761393) ^ Math.imul(salt + 71, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  const autumnGold = [0xb2b16b, 0xc7b771, 0xb3ac5c].map(value => new THREE.Color(value));
  const autumnFinal = [0xb77542, 0xad5843, 0xc5964b, 0xceab5d, 0xb96839].map(value => new THREE.Color(value));
  const canopyData = [], treeData = [], originals = [];
  const sphereGeometry = new THREE.SphereGeometry(1, 12, 8);
  const translation = new THREE.Matrix4(), radiusScale = new THREE.Matrix4();

  for (const descriptor of trees) {
    if (!descriptor.group || !descriptor.foliage?.length) continue;
    const treeIndex = treeData.length;
    const center = descriptor.group.getWorldPosition(new THREE.Vector3());
    const canopyIndices = [];
    for (const source of descriptor.foliage) {
      if (!source?.isMesh || !source.parent) continue;
      source.geometry.computeBoundingSphere();
      const sphere = source.geometry.boundingSphere;
      if (!sphere || !Number.isFinite(sphere.radius) || sphere.radius <= 0) continue;
      const matrix = source.matrixWorld.clone()
        .multiply(translation.makeTranslation(sphere.center.x, sphere.center.y, sphere.center.z))
        .multiply(radiusScale.makeScale(sphere.radius, sphere.radius, sphere.radius));
      const sourceMaterial = Array.isArray(source.material) ? source.material[0] : source.material;
      const index = canopyData.length;
      canopyData.push({
        matrix, center: new THREE.Vector3().setFromMatrixPosition(matrix),
        green: sourceMaterial.color?.clone() || new THREE.Color(0x6e936b),
        gold: autumnGold[index % autumnGold.length],
        autumn: autumnFinal[index % autumnFinal.length],
        bareStart: .015 + random(index, 1) * .25,
        bareEnd: .67 + random(index, 2) * .29,
      });
      canopyIndices.push(index);
      originals.push({ source, parent: source.parent });
      source.removeFromParent();
    }
    if (canopyIndices.length) treeData.push({ descriptor, center, canopyIndices, treeIndex });
  }

  const makeMaterial = () => {
    const material = mat ? mat(0xffffff).clone() : new THREE.MeshToonMaterial({ color: 0xffffff });
    material.color.set(0xffffff);
    material.emissive?.set(0x000000);
    material.emissiveIntensity = 0;
    return material;
  };
  const canopyMaterial = makeMaterial();
  const canopy = new THREE.InstancedMesh(sphereGeometry, canopyMaterial, Math.max(1, canopyData.length));
  canopy.name = 'One instanced seasonal canopy';
  canopy.count = canopyData.length;
  canopy.castShadow = canopy.receiveShadow = true;
  canopy.frustumCulled = false;
  canopy.userData.dynamic = true;
  canopy.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  root.add(canopy);

  // An eight-triangle curved blade lies on XZ when it comes to rest.
  const outline = [[0, -.20], [.055, -.135], [.09, -.035], [.075, .075], [0, .18], [-.075, .075], [-.09, -.035], [-.055, -.135]];
  const leafVertices = [0, .026, -.005], leafIndices = [];
  outline.forEach(([x, z]) => leafVertices.push(x, Math.abs(z) * .016, z));
  for (let index = 0; index < outline.length; index++) leafIndices.push(0, ((index + 1) % outline.length) + 1, index + 1);
  const leafGeometry = new THREE.BufferGeometry();
  leafGeometry.setAttribute('position', new THREE.Float32BufferAttribute(leafVertices, 3));
  leafGeometry.setIndex(leafIndices);
  leafGeometry.computeVertexNormals();
  const leafMaterial = makeMaterial();
  leafMaterial.side = THREE.DoubleSide;
  const leafCount = treeData.length ? Math.min(72, Math.max(48, treeData.length * 16)) : 0;
  const leaves = new THREE.InstancedMesh(leafGeometry, leafMaterial, Math.max(1, leafCount));
  leaves.name = 'One instanced finite fall of leaves';
  leaves.count = leafCount;
  leaves.castShadow = leaves.receiveShadow = true;
  leaves.frustumCulled = false;
  leaves.userData.dynamic = true;
  leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  root.add(leaves);

  const leafData = [];
  for (let index = 0; index < leafCount; index++) {
    const tree = treeData[index % treeData.length];
    const { descriptor, center, canopyIndices } = tree;
    const crown = canopyData[canopyIndices[Math.floor(random(index, 4) * canopyIndices.length)]];
    const start = crown.center.clone();
    start.x += (random(index, 5) - .5) * .20;
    start.y += (random(index, 6) - .4) * .16;
    start.z += (random(index, 7) - .5) * .20;
    const landing = descriptor.landingCenter || center;
    const outer = Math.max(.16, Number(descriptor.landingRadius ?? descriptor.scatterRadius) || .9);
    const inner = Math.min(outer * .78, descriptor.landingCenter ? 0 : Number(descriptor.landingInnerRadius) || .62);
    const angle = random(index, 8) * Math.PI * 2;
    const radius = Math.sqrt(inner * inner + random(index, 9) * (outer * outer - inner * inner));
    const end = new THREE.Vector3(
      THREE.MathUtils.clamp(landing.x + Math.cos(angle) * radius, -7.8, 7.8),
      (Number.isFinite(descriptor.groundY) ? descriptor.groundY : .04) + .005 + random(index, 10) * .010,
      THREE.MathUtils.clamp(landing.z + Math.sin(angle) * radius, -7.8, 7.8),
    );
    leafData.push({
      start, end, angle,
      delay: .32 + index / Math.max(1, leafCount - 1) * 16.0 + random(index, 11) * .55,
      duration: 3.8 + random(index, 12) * 2.15,
      phase: random(index, 13) * Math.PI * 2,
      turns: 1 + Math.floor(random(index, 14) * 3),
      scale: .58 + random(index, 15) * .45,
      green: crown.green, gold: crown.gold, autumn: crown.autumn,
      winterStart: .10 + random(index, 16) * .31,
      winterEnd: .72 + random(index, 17) * .27,
    });
  }

  const instance = new THREE.Object3D(), matrix = new THREE.Matrix4();
  const color = new THREE.Color(), scaleVector = new THREE.Vector3();
  const endTime = 24;
  let lastAutumn = NaN, lastWinter = NaN, lastFallTime = NaN, lastLeafAmount = NaN, disposed = false;
  let settledCount = 0, airborneCount = 0, visibleCanopyCount = canopyData.length;
  function seasonalColor(source, autumn) {
    return color.copy(source.green)
      .lerp(source.gold, smooth(0, .64, autumn))
      .lerp(source.autumn, smooth(.43, 1, autumn));
  }
  function update({ autumn = 0, winter = 0, fallTime = 0, leafAmount = 1 } = {}) {
    if (disposed) return false;
    autumn = clamp(autumn);
    winter = clamp(winter);
    leafAmount = clamp(leafAmount);
    fallTime = Math.max(0, Math.min(endTime, Number(fallTime) || 0));
    if (autumn === lastAutumn && winter === lastWinter && fallTime === lastFallTime && leafAmount === lastLeafAmount) return false;
    const recolor = autumn !== lastAutumn;
    const reshapeCanopy = winter !== lastWinter;
    if (recolor || reshapeCanopy) {
      visibleCanopyCount = 0;
      canopyData.forEach((source, index) => {
        const scale = 1 - smooth(source.bareStart, source.bareEnd, winter);
        if (scale > .005) visibleCanopyCount++;
        if (reshapeCanopy) {
          matrix.copy(source.matrix).scale(scaleVector.setScalar(scale > .005 ? scale : 0));
          canopy.setMatrixAt(index, matrix);
        }
        if (recolor) canopy.setColorAt(index, seasonalColor(source, autumn));
      });
      if (reshapeCanopy) canopy.instanceMatrix.needsUpdate = true;
      if (recolor && canopy.instanceColor) canopy.instanceColor.needsUpdate = true;
    }
    settledCount = 0;
    airborneCount = 0;
    leafData.forEach((leaf, index) => {
      const progress = clamp((fallTime - leaf.delay) / leaf.duration);
      const hasStarted = fallTime > leaf.delay;
      const winterScale = 1 - smooth(leaf.winterStart, leaf.winterEnd, winter);
      const visible = hasStarted && winterScale * leafAmount > .005;
      if (visible && progress >= 1) settledCount++;
      else if (visible) airborneCount++;
      const drift = Math.sin(Math.PI * progress) * .18;
      instance.position.lerpVectors(leaf.start, leaf.end, progress);
      instance.position.x += Math.sin(progress * Math.PI * 3 + leaf.phase) * drift;
      instance.position.z += Math.cos(progress * Math.PI * 2.5 + leaf.phase) * drift;
      // Arrival eases into a stable position and flat orientation; no recycling.
      const flutter = Math.sin(Math.PI * progress);
      instance.rotation.set(
        Math.sin(progress * Math.PI * 5 + leaf.phase) * flutter * .90,
        leaf.angle + progress * Math.PI * 2 * leaf.turns,
        Math.cos(progress * Math.PI * 4 + leaf.phase) * flutter * .70,
      );
      instance.scale.setScalar(visible ? leaf.scale * winterScale * leafAmount * smooth(0, .08, progress) : 0);
      instance.updateMatrix();
      leaves.setMatrixAt(index, instance.matrix);
      if (recolor) leaves.setColorAt(index, seasonalColor(leaf, autumn));
    });
    leaves.instanceMatrix.needsUpdate = true;
    if (recolor && leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
    canopy.visible = visibleCanopyCount > 0;
    leaves.visible = airborneCount + settledCount > 0;
    lastAutumn = autumn;
    lastWinter = winter;
    lastFallTime = fallTime;
    lastLeafAmount = leafAmount;
    return true;
  }
  update();
  return {
    group: root, canopy, leaves, update, endTime,
    stats: {
      trees: treeData.length, canopyInstances: canopyData.length, leafInstances: leafCount,
      drawCalls: treeData.length ? 2 : 0,
      triangles: (sphereGeometry.index.count / 3) * canopyData.length + (leafGeometry.index.count / 3) * leafCount,
    },
    get active() { return lastFallTime > 0 && lastFallTime < endTime && lastWinter < 1; },
    get settled() { return lastFallTime >= endTime; },
    get counts() { return { canopy: visibleCanopyCount, airborne: airborneCount, landed: settledCount }; },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeFromParent();
      sphereGeometry.dispose(); leafGeometry.dispose(); canopyMaterial.dispose(); leafMaterial.dispose();
      originals.forEach(({ source, parent }) => parent.add(source));
    },
  };
}
