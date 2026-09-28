// A small wooden control lectern in the rear aisle. All coordinates are studio-local.
export function buildLectern(api) {
  const {THREE,scene,box,mat}=api;
  const group=new THREE.Group();
  group.name='Wooden studio navigation lectern';
  group.position.set(.25,.335,-2.42);
  group.userData.dynamic=true;
  scene.add(group);

  const walnut=mat(0x785640,0xb18c62,.12);
  const oak=mat(0xb1875b,0xd9b584,.15);
  const veneer=mat(0xc5a077,0xe4c398,.16);
  const endGrain=mat(0x956c48,0xc69965,.10);
  const brass=mat(0xb6aa7d,0xd9c994,.10);

  function roundedBlock(w,h,d,x,y,z,material,parent=group,radius=.045,bevel=.009) {
    const hw=w/2-bevel,hd=d/2-bevel,r=Math.min(radius,hw,hd);
    const shape=new THREE.Shape();
    shape.moveTo(-hw+r,-hd);shape.lineTo(hw-r,-hd);shape.quadraticCurveTo(hw,-hd,hw,-hd+r);
    shape.lineTo(hw,hd-r);shape.quadraticCurveTo(hw,hd,hw-r,hd);
    shape.lineTo(-hw+r,hd);shape.quadraticCurveTo(-hw,hd,-hw,hd-r);
    shape.lineTo(-hw,-hd+r);shape.quadraticCurveTo(-hw,-hd,-hw+r,-hd);shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:h-bevel*2,steps:1,curveSegments:4,bevelEnabled:true,bevelSegments:1,bevelSize:bevel,bevelThickness:bevel});
    geometry.rotateX(-Math.PI/2);
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.set(x,y-h/2+bevel,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
    return mesh;
  }

  // Broad, shallow feet anchor the single stem without blocking the rear aisle.
  roundedBlock(1.13,.072,.70,0,.036,.035,walnut);
  roundedBlock(.91,.085,.57,0,.102,.035,oak);
  roundedBlock(.58,.075,.45,0,.157,.020,endGrain);
  roundedBlock(.54,.87,.42,0,.605,.018,oak,group,.027,.008);
  box(.444,.765,.015,0,.617,.235,veneer,group,false);
  for(const x of [-.158,-.065,.101])box(.006,.712,.003,x,.625,.244,endGrain,group,false);
  roundedBlock(.77,.105,.60,0,1.078,.003,walnut);
  box(.65,.025,.49,0,1.132,.003,brass,group,false);

  // The thin console slopes toward the visitor; its surface stays clear for the keys.
  const console=new THREE.Group();console.name='Sloped wooden lectern console';
  console.position.y=1.158;console.rotation.x=.10;group.add(console);
  roundedBlock(1.90,.13,1.14,0,0,0,walnut,console,.062,.014);
  roundedBlock(1.84,.025,1.08,0,.059,0,oak,console,.045,.005);
  roundedBlock(1.80,.014,1.055,0,.067,0,veneer,console,.035,.003);
  roundedBlock(1.79,.025,.025,0,.081,.552,brass,console,.008,.003);
  for(const x of [-.822,.822])box(.028,.012,.028,x,.077,.478,brass,console,false);

  const keyMount=new THREE.Group();
  keyMount.name='Lectern key mounting surface';keyMount.position.set(0,1.235,0);keyMount.rotation.x=.10;
  keyMount.userData.dynamic=true;group.add(keyMount);
  const focus=new THREE.Vector3(.25,1.66,-2.42);
  return {group,keyMount,focus};
}
