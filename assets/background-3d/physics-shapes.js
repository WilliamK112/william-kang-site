import * as THREE from './vendor/three.module.js';
import * as C from './vendor/cannon-es.js';
export function makeShape(type,r){
  let geometry;
  const body=new C.Body({mass:Math.max(.6,r*r*r),linearDamping:.33,angularDamping:.28});
  if(type==='sphere'){geometry=new THREE.SphereGeometry(r,24,14);body.addShape(new C.Sphere(r));}
  else if(type==='cube'){geometry=new THREE.BoxGeometry(r*1.5,r*1.5,r*1.5);body.addShape(new C.Box(new C.Vec3(r*.75,r*.75,r*.75)));}
  else if(type==='torus'){
    geometry=new THREE.TorusGeometry(r*.78,r*.22,8,40);
    // A compound ring, not a solid bounding sphere: the hole stays empty.
    for(let i=0;i<40;i++){const a=i/40*Math.PI*2;body.addShape(new C.Sphere(r*.22),new C.Vec3(Math.cos(a)*r*.78,Math.sin(a)*r*.78,0));}
  }else if(type==='helix'){
    const pieces=[];
    for(let strand=0;strand<2;strand++){
      const points=[];
      for(let i=0;i<=48;i++){const a=i/48*Math.PI*4+strand*Math.PI;const p=new THREE.Vector3(Math.cos(a)*r*.42,(i/48-.5)*r*2,Math.sin(a)*r*.42);points.push(p);body.addShape(new C.Sphere(r*.055),new C.Vec3(p.x,p.y,p.z));}
      const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,r*.045,4,false).toNonIndexed();pieces.push(g);
    }
    geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pieces.flatMap(g=>Array.from(g.attributes.position.array)),3));geometry.computeVertexNormals();pieces.forEach(g=>g.dispose());
  }else{
    geometry=type==='octa'?new THREE.OctahedronGeometry(r):type==='tetra'?new THREE.TetrahedronGeometry(r):new THREE.CylinderGeometry(r*.7,r*.7,r*1.7,6);
    const g=geometry.index?geometry.toNonIndexed():geometry;
    const vertices=[],faces=[],map=new Map();
    const pos=g.attributes.position;
    for(let i=0;i<pos.count;i+=3){const face=[];for(let j=0;j<3;j++){const p=new C.Vec3(pos.getX(i+j),pos.getY(i+j),pos.getZ(i+j)),key=[p.x,p.y,p.z].map(v=>v.toFixed(6)).join(',');if(!map.has(key)){map.set(key,vertices.length);vertices.push(p);}face.push(map.get(key));}faces.push(face);}
    body.addShape(new C.ConvexPolyhedron({vertices,faces}));
    if(g!==geometry)g.dispose();
  }
  return {geometry,body};
}
