// A slice of lakeshore continues beyond the model's rear and left cut edges.
// The only constructed edge is its irregular, planted limestone shoreline.
const SHORE_CONTROLS = [
  [-7.94, -6.65], [-7.65, -6.62], [-7.24, -6.72], [-6.76, -6.70],
  [-6.18, -6.38], [-5.74, -5.74], [-5.43, -4.92], [-4.94, -4.48],
  [-4.28, -4.38], [-3.50, -4.50], [-2.72, -4.25], [-1.72, -4.22],
  [-.62, -4.50], [.32, -4.92], [1.12, -5.16], [1.62, -5.70],
  [1.88, -6.38], [1.94, -7.94],
];
function interpolateShore() {
  const result = [];
  for (let index = 0; index < SHORE_CONTROLS.length - 1; index++) {
    const a = SHORE_CONTROLS[Math.max(0, index - 1)], b = SHORE_CONTROLS[index];
    const c = SHORE_CONTROLS[index + 1], d = SHORE_CONTROLS[Math.min(SHORE_CONTROLS.length - 1, index + 2)];
    for (let step = 0; step < 5; step++) {
      const t = step / 5, t2 = t * t, t3 = t2 * t;
      const point = [0, 1].map(axis => .5 * (2 * b[axis] + (-a[axis] + c[axis]) * t +
        (2 * a[axis] - 5 * b[axis] + 4 * c[axis] - d[axis]) * t2 +
        (-a[axis] + 3 * b[axis] - 3 * c[axis] + d[axis]) * t3));
      result.push([Math.max(-7.94, Math.min(1.94, point[0])), Math.max(-7.94, point[1])]);
    }
  }
  result.push([...SHORE_CONTROLS.at(-1)]);
  return result;
}
export const LAKE_SHORE = interpolateShore();
export const LAKE_POLYGON = [[-7.94, -7.94], ...LAKE_SHORE];

function segmentDistance(x, z, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
}
// A margin also excludes the stony bank from snow patches, trees or bicycle bases.
export function containsLakeWater(x, z, margin = 0) {
  let inside = false;
  for (let index = 0, previous = LAKE_POLYGON.length - 1; index < LAKE_POLYGON.length; previous = index++) {
    const a = LAKE_POLYGON[index], b = LAKE_POLYGON[previous];
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
    if (margin > 0 && segmentDistance(x, z, a, b) <= margin) return true;
  }
  return inside;
}

export function buildLake({ THREE, scene, mat }) {
  const group = new THREE.Group();
  group.name = 'Madison-inspired open lakeshore';
  scene.add(group);
  const unit = value => Math.max(0, Math.min(1, Number(value) || 0));
  const random = index => {
    const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  const shape = new THREE.Shape();
  LAKE_POLYGON.forEach(([x, z], index) => index ? shape.lineTo(x, -z) : shape.moveTo(x, -z));
  shape.closePath();
  const waterGeometry = new THREE.ShapeGeometry(shape);
  waterGeometry.rotateX(-Math.PI / 2);
  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: {
      day: { value: 0 }, winter: { value: 0 }, time: { value: 0 },
      shore: { value: SHORE_CONTROLS.map(([x, z]) => new THREE.Vector2(x, z)) },
      nightDeep: { value: new THREE.Color(0x254e60) }, nightShallow: { value: new THREE.Color(0x487d80) },
      dayDeep: { value: new THREE.Color(0x3e819c) }, dayShallow: { value: new THREE.Color(0x81b7ad) },
      nightIce: { value: new THREE.Color(0x779aa9) }, dayIce: { value: new THREE.Color(0xc4d9d4) },
    },
    vertexShader: `varying vec2 lakeXZ;
      void main(){lakeXZ=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `
      uniform float day;uniform float winter;uniform float time;
      uniform vec2 shore[${SHORE_CONTROLS.length}];
      uniform vec3 nightDeep;uniform vec3 nightShallow;uniform vec3 dayDeep;uniform vec3 dayShallow;uniform vec3 nightIce;uniform vec3 dayIce;
      varying vec2 lakeXZ;
      float distanceToSegment(vec2 p,vec2 a,vec2 b){vec2 ab=b-a;return length(p-a-ab*clamp(dot(p-a,ab)/max(dot(ab,ab),.0001),0.,1.));}
      void main(){
        vec2 p=lakeXZ;float coast=99.;
        for(int i=0;i<${SHORE_CONTROLS.length - 1};i++){coast=min(coast,distanceToSegment(p,shore[i],shore[i+1]));}
        float depth=smoothstep(.04,2.05,coast);
        vec3 shallow=mix(nightShallow,dayShallow,day),deep=mix(nightDeep,dayDeep,day);
        vec3 color=mix(shallow,deep,depth);
        float clock=time*(1.-winter),wave=sin(p.x*3.8+p.y*8.5+clock*.43)+sin(p.x*1.9-p.y*5.7-clock*.31)*.5;
        color*=.985+smoothstep(.72,1.24,wave)*.055;
        float line=1.-smoothstep(.013,.027,abs(coast-(.18+sin(p.x*3.+clock*.45)*.026)));
        float second=(1.-smoothstep(.009,.023,abs(coast-(.39+sin(p.x*2.7-clock*.28)*.025))))*.32;
        color=mix(color,mix(vec3(.46,.62,.64),vec3(.78,.90,.84),day),max(line,second)*.40*(1.-winter));
        vec3 ice=mix(nightIce,dayIce,day);
        float veins=smoothstep(.94,.992,abs(sin(p.x*2.7+p.y*4.8)*sin(p.x*4.1-p.y*2.9)))*.08;
        color=mix(color,ice*(.95+depth*.035)+veins,winter*.93);
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.name = 'Open lake water with shallow coastal bands';
  water.position.y = .046;
  water.userData.dynamic = true;
  group.add(water);

  // The diorama reveals a thin water cross-section on its two cut edges.
  const edgeVertices = [], edgeIndices = [];
  for (const [a, b] of [[[-7.94, -8.001], [1.94, -8.001]], [[-8.001, -7.94], [-8.001, -6.65]]]) {
    const offset = edgeVertices.length / 3;
    edgeVertices.push(a[0], -.37, a[1], b[0], -.37, b[1], b[0], .046, b[1], a[0], .046, a[1]);
    edgeIndices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }
  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgeVertices, 3));
  edgeGeometry.setIndex(edgeIndices);edgeGeometry.computeVertexNormals();
  const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0x315e6c, side: THREE.DoubleSide });
  const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
  edge.name = 'Lake continues through the model edge';
  group.add(edge);

  // Narrow uneven mineral shore; no enclosing wall or artificial pool coping.
  const bankVertices = [], bankIndices = [], shoreNormals = [];
  for (let index = 0; index < LAKE_SHORE.length; index++) {
    const p = LAKE_SHORE[index], before = LAKE_SHORE[Math.max(0, index - 1)], after = LAKE_SHORE[Math.min(LAKE_SHORE.length - 1, index + 1)];
    const tangent = new THREE.Vector2(after[0] - before[0], after[1] - before[1]).normalize();
    const normal = new THREE.Vector2(-tangent.y, tangent.x);shoreNormals.push(normal);
    const width = .19 + random(index + 40) * .085;
    bankVertices.push(
      p[0] - normal.x * .025, .044, p[1] - normal.y * .025,
      THREE.MathUtils.clamp(p[0] + normal.x * width, -7.96, 7.96), .052 + random(index + 61) * .015,
      THREE.MathUtils.clamp(p[1] + normal.y * width, -7.96, 7.96),
    );
    if (index) {const a = (index - 1) * 2, b = index * 2;bankIndices.push(a, b + 1, b, a, a + 1, b + 1);}
  }
  const bankGeometry = new THREE.BufferGeometry();
  bankGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bankVertices, 3));
  bankGeometry.setIndex(bankIndices);bankGeometry.computeVertexNormals();
  const bankMaterial = mat ? mat(0xb8b09a) : new THREE.MeshToonMaterial({ color: 0xb8b09a });
  const bank = new THREE.Mesh(bankGeometry, bankMaterial);
  bank.name = 'Organic limestone and sand margin';bank.receiveShadow = true;
  group.add(bank);

  const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
  const rockMaterial = (mat ? mat(0xffffff) : new THREE.MeshToonMaterial({ color: 0xffffff })).clone();
  const rockCount = 31, rocks = new THREE.InstancedMesh(rockGeometry, rockMaterial, rockCount);
  rocks.name = 'Irregular shoreline stones';rocks.castShadow = rocks.receiveShadow = true;
  rocks.userData.dynamic = true;
  const dummy = new THREE.Object3D(), stoneColors = [0x9fa59b, 0xb5b09d, 0x8b9c96, 0xc4bda7];
  for (let index = 0; index < rockCount; index++) {
    const shoreIndex = 2 + Math.floor(index / (rockCount - 1) * (LAKE_SHORE.length - 5));
    const point = LAKE_SHORE[shoreIndex], normal = shoreNormals[shoreIndex];
    const large = index % 8 === 2, size = (large ? .22 : .105) + random(index + 10) * .055;
    const edgeClearance = size * 1.5;
    dummy.position.set(
      THREE.MathUtils.clamp(point[0] + normal.x * .077, -7.94 + edgeClearance, 7.94 - edgeClearance),
      .075 + size * .23,
      THREE.MathUtils.clamp(point[1] + normal.y * .077, -7.94 + edgeClearance, 7.94 - edgeClearance),
    );
    dummy.scale.set(size * 1.10, size * .53, size * (1.18 + random(index + 15) * .25));
    dummy.rotation.set(random(index + 17) * .3, random(index + 18) * Math.PI, random(index + 19) * .25);
    dummy.updateMatrix();rocks.setMatrixAt(index, dummy.matrix);rocks.setColorAt(index, new THREE.Color(stoneColors[index % stoneColors.length]));
  }
  group.add(rocks);

  const reedVertices = [];
  for (const shoreIndex of [19, 39, 66]) {
    const point = LAKE_SHORE[shoreIndex], normal = shoreNormals[shoreIndex];
    for (let blade = 0; blade < 6; blade++) {
      const seed = shoreIndex + blade * 9, x = point[0] + normal.x * .22 + (random(seed) - .5) * .14;
      const z = point[1] + normal.y * .22 + (random(seed + 1) - .5) * .14;
      const height = .22 + random(seed + 2) * .22, bend = (random(seed + 3) - .5) * .12;
      reedVertices.push(x, .055, z, x + bend * .5, height * .68, z + .017,
        x + bend * .5, height * .68, z + .017, x + bend, height, z + .054);
    }
  }
  const reedGeometry = new THREE.BufferGeometry();reedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(reedVertices, 3));
  const reedMaterial = new THREE.LineBasicMaterial({ color: 0x88916a });
  const reeds = new THREE.LineSegments(reedGeometry, reedMaterial);reeds.name = 'Three quiet clumps of lakeshore reeds';group.add(reeds);

  let day = 0, winter = 0;
  const deepNight = new THREE.Color(0x315e6c), deepDay = new THREE.Color(0x548e99), edgeIce = new THREE.Color(0xa2bdbe);
  const greenReed = new THREE.Color(0x88916a), winterReed = new THREE.Color(0xb3aa8e);
  function refreshColors() {
    edgeMaterial.color.copy(deepNight).lerp(deepDay, day).lerp(edgeIce, winter * .76);
    reedMaterial.color.copy(greenReed).lerp(winterReed, winter * .8);
  }
  function setDay(value) {day = unit(value);waterMaterial.uniforms.day.value = day;refreshColors();}
  function setWinter(value) {winter = unit(value);waterMaterial.uniforms.winter.value = winter;refreshColors();}
  function update(time = 0) {waterMaterial.uniforms.time.value = Number.isFinite(time) ? time : 0;}
  setDay(0);
  return {
    group, water, waterMaterial, setDay, setWinter, update,
    bounds: { minX: -7.94, maxX: 1.94, minZ: -7.94, maxZ: -4.18 },
    polygon: LAKE_POLYGON, shoreline: LAKE_SHORE, containsWater: containsLakeWater,
  };
}
