import {containsLakeWater} from './lake.js';

// Ground accumulation only. The host owns weather, timing and rendering.
// Coordinates are world-space metres on the 16 × 16 courtyard plinth.
export function buildSnow({THREE, scene, mat}) {
  const group = new THREE.Group();
  group.name = 'Gradual courtyard snow accumulation';
  group.userData.dynamic = true;
  scene.add(group);

  // Each entry is [x, z, x-radius, z-radius, maximum thickness, optional rotation].
  // Overlapping, uneven perimeter banks leave the central walking routes clear.
  const layout = [
    // The front-row keys occupy x[-6.10,5.00], z[6.09,7.81].
    [-7.12, 7.20, .65, .60, .085],
    [6.40, 7.22, 1.10, .62, .077, .06],
    [7.00, 7.40, .77, .38, .099, -.04],
    [-6.50, -7.37, 1.20, .42, .100],
    [-4.60, -7.40, 1.35, .39, .117],
    [-2.60, -7.40, 1.21, .40, .082],
    [-.50, -7.42, 1.30, .38, .095],
    [1.50, -7.35, 1.19, .45, .108],
    [3.40, -7.39, 1.33, .39, .116],
    [5.40, -7.36, 1.27, .43, .094],
    [7.10, -7.36, .68, .41, .106],

    // Left shoulder: snow gathers against, rather than through, the planters.
    [-7.50, -5.50, .30, .85, .108],
    [-7.15, -6.52, .50, .38, .088],
    [-6.08, -5.55, .23, .61, .095],
    [-6.60, -4.50, .75, .37, .081],
    [-7.44, -3.51, .32, .56, .100],
    [-7.45, -1.84, .32, .43, .105],
    [-7.15, .00, .58, .25, .063],
    // A cleared shoulder also keeps snow out of the resting badger's footprint.
    [-7.35, 2.65, .42, 1.12, .106],
    [-7.35, 4.16, .42, 1.05, .120],
    [-7.00, 6.10, .72, 1.02, .109],

    // Front-right treebed, beyond the terrace and the navigation sockets.
    [7.36, 4.35, .42, .58, .105],
    [7.65, 5.50, .18, .57, .116],
    [6.35, 5.76, .19, .70, .099],
    [6.83, 6.53, .72, .25, .081],
    [6.50, 4.33, .80, .43, .092],

    // Sheltered left-side remnants; the road between the drain and keys is clear.
    [-5.72, 2.18, .40, .28, .063],
    [-5.93, -3.70, .42, .48, .071],
    [-5.88, -2.63, .35, .42, .079],
    [-6.06, -.40, .24, .23, .064]
  ].filter(([x,z,rx,rz,,rotation=0])=>{
    // One-time placement mask: the lake supplies its own winter ice, while the
    // rear bicycle court stays cleared. No per-frame shoreline work is needed.
    const cosine=Math.cos(rotation),sine=Math.sin(rotation);
    const extentX=Math.abs(rx*cosine)+Math.abs(rz*sine);
    const extentZ=Math.abs(rx*sine)+Math.abs(rz*cosine);
    if(x+extentX>5.40&&x-extentX<7.66&&z+extentZ>-7.94&&z-extentZ<-6.06)return false;
    for(let u=-4;u<=4;u++)for(let v=-4;v<=4;v++){
      if(u*u+v*v>16)continue;
      const px=rx*u/4,pz=rz*v/4;
      if(containsLakeWater(x+px*cosine+pz*sine,z-px*sine+pz*cosine,.16))return false;
    }
    return true;
  });
  const groundY = .028;
  const masks = Object.freeze(layout.map(([x,z,rx,rz,height,rotation=0], index) => Object.freeze({
    x, z, rx, rz, height, rotation,
    // Exposed for a host water shader to match the same expanding footprints.
    start: index < layout.length - 4 ? (index % 6) * .025 : .18 + (index % 5) * .028
  })));

  // A shallow, open-bottom hemisphere with a scalloped silhouette. All vertices
  // remain inside its unit ellipse, so footprints never cross the cleared areas.
  const geometry = new THREE.SphereGeometry(1, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index), y = positions.getY(index), z = positions.getZ(index);
    const angle = Math.atan2(z, x);
    const edge = .86 + .085 * Math.sin(angle * 3 + .47) + .045 * Math.cos(angle * 5 - .63);
    const radius = edge + (1 - edge) * y * y;
    positions.setXYZ(index, x * radius, Math.max(0, Math.pow(y, 1.34)), z * radius);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const material = mat ? mat(0xe8f0f2, 0x9aaec1, .07).clone() :
    new THREE.MeshToonMaterial({color:0xe8f0f2, emissive:0x9aaec1, emissiveIntensity:.07});
  material.name = 'Soft blue-white accumulating snow';
  material.transparent = true;
  material.opacity = 0;
  material.depthWrite = false;
  const patches = new THREE.InstancedMesh(geometry, material, masks.length);
  patches.name = 'Instanced low-poly snowbanks';
  patches.userData.dynamic = true;
  patches.castShadow = false;
  patches.receiveShadow = true;
  patches.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // A single conservative bound is cheaper than recomputing it during growth.
  patches.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, .09, 0), 11.32);
  patches.boundingBox = new THREE.Box3(new THREE.Vector3(-8, groundY, -8), new THREE.Vector3(8, .15, 8));
  group.add(patches);

  const transform = new THREE.Object3D();
  let currentAmount = -1;
  const smooth = value => value * value * (3 - 2 * value);
  function setAmount(value) {
    const amount = Math.max(0, Math.min(1, Number(value) || 0));
    if (amount === currentAmount) return;
    currentAmount = amount;
    group.visible = amount > .0001;
    material.opacity = .98 * smooth(Math.min(1, amount / .30));
    for (let index = 0; index < masks.length; index++) {
      const patch = masks[index];
      const local = smooth(Math.max(0, Math.min(1, (amount - patch.start) / (1 - patch.start))));
      const spread = Math.sqrt(local);
      transform.position.set(patch.x, groundY, patch.z);
      transform.rotation.y = patch.rotation;
      transform.scale.set(patch.rx * spread, patch.height * local, patch.rz * spread);
      transform.updateMatrix();
      patches.setMatrixAt(index, transform.matrix);
    }
    patches.instanceMatrix.needsUpdate = true;
  }
  setAmount(0);

  const stats = Object.freeze({
    drawCalls:1,
    meshes:1,
    instances:masks.length,
    verticesPerPatch:positions.count,
    trianglesPerPatch:geometry.index.count / 3,
    trianglesAtFullAmount:geometry.index.count / 3 * masks.length,
    maximumHeight:groundY + Math.max(...layout.map(patch => patch[4])),
    groundY,
    particles:0
  });
  return {setAmount, group, stats, masks};
}
