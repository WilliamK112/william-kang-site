/** A natural American badger resting belly-down on the courtyard pavement. */
export function buildMascot({THREE, scene, mat}) {
  const badger = new THREE.Group();
  badger.name = 'Resting American badger';
  badger.position.set(-5.45, .01, 3.95);
  badger.rotation.y = 1.10;
  badger.scale.set(.93, 1.06, .93);
  scene.add(badger);

  const fur = mat(0x817e70, 0x746c59, .025).clone();
  fur.vertexColors = true;
  const flank = mat(0x726f62), darkFur = mat(0x494943);
  const cream = mat(0xe3decd, 0xa29a83, .03);
  const mask = mat(0x303331), nose = mat(0x202829);
  const eyes = mat(0x151b19), eyeGlint = mat(0xbac9c5);
  const claw = mat(0xaaa18c), muzzleShade = mat(0x9b998a);
  const bodyGeometry = new THREE.SphereGeometry(1, 24, 14);
  const smallGeometry = new THREE.SphereGeometry(1, 16, 10);

  function mesh(geometry, material, parent=badger) {
    const object = new THREE.Mesh(geometry, material);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function oval(x,y,z,rx,ry,rz,material,geometry=smallGeometry) {
    const object = mesh(geometry,material);
    object.position.set(x,y,z);
    object.scale.set(rx,ry,rz);
    return object;
  }
  function curve(points,radius,material,segments=10) {
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,radius,5,false),material);
  }

  // Broad shoulders and a long, low barrel rest almost flat on the ground.
  // Muted vertex colours suggest grizzled guard hairs without texture lookups.
  const colours = [], point = new THREE.Vector3();
  const position = bodyGeometry.attributes.position;
  for(let i=0;i<position.count;i++) {
    point.fromBufferAttribute(position,i);
    const mottling = Math.sin(point.x*31+point.z*23)*Math.sin(point.y*27-point.z*17)*.032;
    const paleBack = Math.max(0,point.y)*.045;
    colours.push(.84+mottling+paleBack,.83+mottling+paleBack,.77+mottling+paleBack);
  }
  bodyGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));
  oval(0,.442,-.265,.675,.402,.93,fur,bodyGeometry);
  oval(0,.354,.37,.55,.309,.54,flank);

  // Four short legs fold beside the belly; the long foreclaws lie flat.
  for(const side of [-1,1]) {
    oval(side*.50,.141,-.70,.175,.125,.25,darkFur).rotation.y=side*.24;
    oval(side*.48,.119,-.51,.165,.090,.215,darkFur);
    oval(side*.455,.166,.47,.196,.139,.34,darkFur).rotation.y=side*.17;
    oval(side*.425,.098,.817,.180,.078,.248,darkFur);
    for(let toe=0;toe<4;toe++) {
      const x=side*.425+(toe-1.5)*.069;
      const extension=.090+(.03-Math.abs(toe-1.5)*.011);
      curve([[x,.100,1.005],[x,.078,1.063],[x,.043,1.063+extension]],.017,claw,6);
    }
  }
  // A short tapered tail emerges from the rump, not an upright mascot tail.
  const tail = oval(-.025,.135,-1.24,.135,.105,.255,flank);
  tail.rotation.y=-.17;
  oval(.014,.117,-1.426,.076,.066,.105,darkFur);

  // The head is one tapered three-dimensional wedge, with bands fitted to its
  // surface. These are fur markings, rather than floating facial shapes.
  const profile = [
    [.37,.480,.425,.292],
    [.52,.502,.442,.301],
    [.68,.493,.411,.280],
    [.84,.460,.343,.243],
    [1.00,.410,.255,.191],
    [1.15,.354,.173,.137],
    [1.28,.316,.115,.091],
    [1.37,.300,.076,.062]
  ];
  function facePoint(z,angle,offset=0) {
    let i=0;while(i<profile.length-2&&profile[i+1][0]<z)i++;
    const a=profile[i],b=profile[i+1];
    const t=Math.max(0,Math.min(1,(z-a[0])/(b[0]-a[0])));
    const cy=a[1]+(b[1]-a[1])*t,rx=a[2]+(b[2]-a[2])*t,ry=a[3]+(b[3]-a[3])*t;
    return [Math.sin(angle)*(rx+offset),cy+Math.cos(angle)*(ry+offset),z];
  }
  function faceSurface(zStart,zEnd,angleRange,material,rows=20,columns=32,offset=0) {
    const vertices=[],indices=[];
    for(let row=0;row<=rows;row++) {
      const t=row/rows,z=zStart+(zEnd-zStart)*t;
      const [a,b]=angleRange(t);
      for(let column=0;column<=columns;column++)vertices.push(...facePoint(z,a+(b-a)*column/columns,offset));
    }
    for(let row=0;row<rows;row++)for(let column=0;column<columns;column++) {
      const a=row*(columns+1)+column,b=a+columns+1;
      indices.push(a,b,a+1,b,b+1,a+1);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    return mesh(geometry,material);
  }
  faceSurface(.37,1.37,()=>[-Math.PI,Math.PI],cream);
  for(const side of [-1,1]) {
    faceSurface(.405,1.295,t=>{
      const a=.53+.13*t,b=1.76-.10*t;
      return side===1?[a,b]:[-b,-a];
    },mask,18,8,.006);
    // Rounded, small ears are held low against the broad skull.
    const ear=oval(side*.346,.748,.430,.115,.115,.076,darkFur);
    ear.rotation.z=-side*.23;
    oval(side*.350,.766,.480,.073,.072,.028,cream).rotation.z=-side*.23;
    oval(side*.354,.764,.501,.040,.043,.015,muzzleShade);

    // Quiet, side-set dark eyes: no human eye-whites, eyebrows or expression.
    const eyePosition=facePoint(.835,side*.93,.015);
    const eye=oval(eyePosition[0],eyePosition[1],eyePosition[2]+.006,.043,.030,.034,eyes);
    eye.rotation.y=side*.45;
    oval(eyePosition[0]-side*.006,eyePosition[1]+.009,eyePosition[2]+.031,.007,.006,.007,eyeGlint);
    curve([[side*.068,.260,1.347],[side*.131,.266,1.228],[side*.210,.292,1.055]],.009,darkFur,9);
  }
  oval(0,.291,1.397,.089,.062,.087,nose);
  oval(-.022,.313,1.470,.025,.012,.008,muzzleShade);
  for(const side of [-1,1])oval(side*.050,.286,1.463,.017,.010,.010,eyes);

  // A handful of short guard-hair locks break the flank silhouette softly.
  for(const side of [-1,1])for(let i=0;i<7;i++) {
    const z=-.96+i*.185,x=side*(.50+Math.sin(i/6*Math.PI)*.10);
    const lock=oval(x,.273,z,.085,.092,.175,i%3===0?flank:darkFur);
    lock.rotation.y=side*(.21+(i%3)*.06);
    lock.scale.multiplyScalar(.60);
  }

  badger.updateMatrixWorld(true);
  const boxBounds=new THREE.Box3().setFromObject(badger,true);
  const bounds={min:boxBounds.min.toArray(),max:boxBounds.max.toArray()};
  badger.userData.bounds=bounds;
  badger.userData.animal='American badger';
  return {group:badger,bounds,height:boxBounds.max.y-boxBounds.min.y};
}
