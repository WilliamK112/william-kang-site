/** A natural American badger resting belly-down on the courtyard pavement. */
export function buildMascot({THREE, scene, mat}) {
  const badger = new THREE.Group();
  badger.name = 'Resting American badger';
  badger.position.set(1.18, .01, -3.92);
  badger.rotation.y = -2.40;
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

  // A small campus sweater follows the animal's actual low body silhouette.
  // Its radial envelope includes both torso ellipsoids, keeping fur inside the
  // fabric while leaving the natural head, feet, belly and tail uncovered.
  const jerseyRed=mat(0xb12b40,0x942235,.065);
  const jerseyRib=mat(0x94283b,0x842535,.045);
  const jerseyWhite=mat(0xf3ead8,0xd8cfb7,.045);
  const garment=new THREE.Group();garment.name='Fitted Wisconsin campus sweater';badger.add(garment);
  function fabricPoint(z,angle,padding=.020) {
    const sx=Math.sin(angle),cy=Math.cos(angle);
    const bodySection=Math.max(0,1-((z+.265)/.93)**2);
    let radius=Math.sqrt(bodySection/(sx*sx/(.675*.675)+cy*cy/(.402*.402)));
    const shoulderSection=1-((z-.37)/.54)**2;
    if(shoulderSection>0) {
      const rx=.55*Math.sqrt(shoulderSection),ry=.309*Math.sqrt(shoulderSection),offsetY=.088;
      const a=sx*sx/(rx*rx)+cy*cy/(ry*ry),b=2*offsetY*cy/(ry*ry),c=offsetY*offsetY/(ry*ry)-1;
      const discriminant=b*b-4*a*c;
      if(discriminant>=0)radius=Math.max(radius,(-b+Math.sqrt(discriminant))/(2*a));
    }
    return [sx*(radius+padding),.442+cy*(radius+padding),z];
  }
  function fabricPatch(z0,z1,a0,a1,material,{rows=24,columns=28,padding=.020,name='Sweater fabric'}={}) {
    const positions=[],indices=[];
    for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++) {
      positions.push(...fabricPoint(z0+(z1-z0)*row/rows,a0+(a1-a0)*column/columns,padding));
    }
    for(let row=0;row<rows;row++)for(let column=0;column<columns;column++) {
      const a=row*(columns+1)+column,b=a+columns+1;
      indices.push(a,b,a+1,b,b+1,a+1);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    const object=mesh(geometry,material,garment);object.name=name;return object;
  }
  fabricPatch(-1.045,.385,-1.70,1.70,jerseyRed,{name:'Cardinal red fitted torso'});
  fabricPatch(-1.045,-.982,-1.70,1.70,jerseyRib,{rows:2,name:'Ribbed rear hem'});
  fabricPatch(-1.005,-.980,-1.70,1.70,jerseyWhite,{rows:1,padding:.024,name:'White hem trim'});
  fabricPatch(.323,.385,-1.70,1.70,jerseyWhite,{rows:2,padding:.024,name:'White neck collar'});
  fabricPatch(.348,.362,-1.70,1.70,jerseyRed,{rows:1,padding:.029,name:'Cardinal collar stripe'});
  for(const side of [-1,1]) {
    const edge=side*1.68;
    fabricPatch(-.98,.10,edge-.022,edge+.022,jerseyRib,{rows:20,columns:2,padding:.023,name:'Fine side seam'});
    fabricPatch(.10,.325,edge-.032,edge+.032,jerseyWhite,{rows:7,columns:2,padding:.027,name:'Short white sleeve edging'});
  }

  // The block W is stitched onto the curved upper back, not a flat floating
  // sign. Subdivision keeps each applique triangle above the convex fabric.
  const wOutline=[[-.5,.5],[-.29,.5],[-.17,-.20],[-.065,.28],[.065,.28],[.17,-.20],[.29,.5],[.5,.5],[.30,-.5],[.11,-.5],[0,-.015],[-.11,-.5],[-.30,-.5]];
  const contour=wOutline.map(([x,y])=>new THREE.Vector2(x*.82,-.31+y*.67));
  const faces=THREE.ShapeUtils.triangulateShape(contour,[]),wPositions=[];
  function stitchPoint(x,z) {
    let low=-1.30,high=1.30;
    for(let i=0;i<19;i++) {
      const angle=(low+high)/2;
      if(fabricPoint(z,angle)[0]<x)low=angle;else high=angle;
    }
    const p=fabricPoint(z,(low+high)/2,.029);
    return [x,p[1]+.003,z];
  }
  function stitchTriangle(a,b,c) {
    for(const p of [a,b,c])wPositions.push(...stitchPoint(p.x,p.y));
  }
  const subdivisions=7;
  for(const face of faces) {
    const [a,b,c]=face.map(index=>contour[index]);
    const at=(i,j)=>new THREE.Vector2(a.x+(b.x-a.x)*i/subdivisions+(c.x-a.x)*j/subdivisions,a.y+(b.y-a.y)*i/subdivisions+(c.y-a.y)*j/subdivisions);
    for(let i=0;i<subdivisions;i++)for(let j=0;j<subdivisions-i;j++) {
      stitchTriangle(at(i,j),at(i,j+1),at(i+1,j));
      if(i+j<subdivisions-1)stitchTriangle(at(i+1,j),at(i,j+1),at(i+1,j+1));
    }
  }
  const wGeometry=new THREE.BufferGeometry();wGeometry.setAttribute('position',new THREE.Float32BufferAttribute(wPositions,3));wGeometry.computeVertexNormals();
  const letter=mesh(wGeometry,jerseyWhite,garment);letter.name='Curved white Wisconsin W applique';

  badger.updateMatrixWorld(true);
  const boxBounds=new THREE.Box3().setFromObject(badger,true);
  const bounds={min:boxBounds.min.toArray(),max:boxBounds.max.toArray()};
  badger.userData.bounds=bounds;
  badger.userData.animal='American badger';
  return {group:badger,bounds,height:boxBounds.max.y-boxBounds.min.y};
}
