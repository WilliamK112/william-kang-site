// A few long-exposure impressions of campus life. Two pooled instanced meshes,
// no shadow casters, new lights, textures, timers, or separate animation loop.
export function buildStreetLife({THREE,scene,mergeGeometries}) {
 const root=new THREE.Group();root.name='Passing moments';root.userData.dynamic=true;scene.add(root);
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 const dummy=new THREE.Object3D(),parts=[];
 const colors={coat:0x829c99,trousers:0x647d88,skin:0xd8c8aa,car:0xb5c3b5,glass:0x607f8c,tire:0x526b78};
 function part(geometry,color,position,scale=[1,1,1],rotation=[0,0,0]){
  dummy.position.set(...position);dummy.scale.set(...scale);dummy.rotation.set(...rotation);dummy.updateMatrix();
  let g=geometry.index?geometry.toNonIndexed():geometry.clone();geometry.dispose();g.applyMatrix4(dummy.matrix);
  // Bake a little cel-like directional shading into the vertex colors.
  const base=new THREE.Color(color),normal=g.getAttribute('normal'),rgb=new Float32Array(normal.count*3);
  for(let i=0;i<normal.count;i++){const shade=.72+.28*Math.max(0,normal.getY(i));rgb.set([base.r*shade,base.g*shade,base.b*shade],i*3);}
  g.setAttribute('color',new THREE.BufferAttribute(rgb,3));g.deleteAttribute('uv');parts.push(g);
 }
 function box(color,position,scale,rotation){part(new THREE.BoxGeometry(1,1,1),color,position,scale,rotation);}
 function collect(){const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());parts.length=0;return geometry;}
 // Anonymous, slightly elongated silhouettes; no facial detail at this scale.
 part(new THREE.SphereGeometry(.13,8,6),colors.skin,[0,1.41,.025],[.87,1.13,.94]);
 part(new THREE.CylinderGeometry(.16,.13,.46,7),colors.coat,[0,1.03,0],[1,1,.8],[.08,0,0]);
 box(colors.coat,[0,.80,0],[.27,.15,.24]);
 for(const side of [-1,1]){
  box(colors.trousers,[side*.083,.42,side*.13],[.105,.68,.13],[side*.36,0,0]);
  box(colors.coat,[side*.205,1.03,-side*.08],[.095,.44,.105],[-side*.44,0,side*.08]);
 }
 box(colors.coat,[0,1.06,-.17],[.22,.27,.105]);
 const personGeometry=collect();
 // Just enough shape to read as a passing compact car before it dissolves.
 box(colors.car,[0,.34,0],[.91,.30,1.90]);
 box(colors.glass,[0,.62,-.08],[.72,.31,1.03],[.06,0,0]);
 box(colors.car,[0,.80,-.08],[.76,.075,1.03]);
 for(const side of [-1,1])for(const end of [-1,1]){
  part(new THREE.CylinderGeometry(.18,.18,.075,8),colors.tire,[side*.46,.21,end*.60],[1,1,1],[0,0,Math.PI/2]);
 }
 box(0xe8d9b4,[0,.35,.96],[.71,.045,.025]);
 const carGeometry=collect();
 function pool(geometry,count){
  const alpha=new THREE.InstancedBufferAttribute(new Float32Array(count),1);alpha.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('momentAlpha',alpha);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{day:{value:1}},
   vertexShader:`attribute vec3 color;attribute float momentAlpha;varying vec3 tint;varying float exposure;
    void main(){tint=color;exposure=momentAlpha;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
   fragmentShader:`uniform float day;varying vec3 tint;varying float exposure;
    void main(){if(exposure<.002)discard;vec3 night=mix(tint,vec3(.22,.32,.39),.50);
     gl_FragColor=vec4(mix(night,tint,day),exposure);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`});
  const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled=false;mesh.visible=false;mesh.raycast=()=>{};root.add(mesh);
  return {mesh,alpha,material,geometry};
 }
 const people=pool(personGeometry,6),cars=pool(carGeometry,3);
 people.mesh.name='Pedestrian shutter impressions';cars.mesh.name='Car shutter impressions';
 const actors=[{kind:'person',slot:0},{kind:'person',slot:1},{kind:'car',slot:0}];
 let seed=0x73a921;
 function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 // All coordinates are on open paving, away from steps, the terrace and lake.
 const routes={
  promenade:{from:[-4.05,.045,3.33],to:[1.80,.045,3.33]},
  approach:{from:[2.72,.045,2.35],to:[2.72,.045,-.85]},
  street:{from:[-5.30,.050,5.70],to:[4.70,.050,5.70]}
 };
 let clock=0,nextIn=1.6,enabledLast=false,mode=null,eventNumber=0,spawned={person:0,car:0};
 function spawn(kind,route,reverse,delay=0){
  const actor=actors.find(item=>item.kind===kind&&!item.active);if(!actor)return;
  Object.assign(actor,{active:true,age:-delay,duration:kind==='car'?.52+random()*.12:.64+random()*.14,
   route,from:reverse?routes[route].to:routes[route].from,to:reverse?routes[route].from:routes[route].to,
   scale:kind==='person'?.78+random()*.07:.8,peak:kind==='person'?.34:.25});
  spawned[kind]++;
 }
 function clear(){actors.forEach(actor=>actor.active=false);for(const pool of [people,cars]){pool.mesh.visible=false;pool.alpha.array.fill(0);}}
 function paint(day){
  people.alpha.array.fill(0);cars.alpha.array.fill(0);
  for(const actor of actors){
   if(!actor.active||actor.age<0)continue;
   const pool=actor.kind==='person'?people:cars;
   const dx=actor.to[0]-actor.from[0],dz=actor.to[2]-actor.from[2];
   const rotation=Math.atan2(dx,dz),u=actor.age/actor.duration;
   // Three shutter samples form a faint trailing smear; the whole impression
   // fades together, so no residual silhouette is left behind at its endpoint.
   const envelope=smooth(0,.22,u)*(1-smooth(.52,1,u));
   const strength=actor.peak*envelope*(actor.kind==='car'?smooth(.55,.96,day):.83+.17*day);
   for(let echo=0;echo<3;echo++){
    const t=Math.max(0,u-echo*.055),index=actor.slot*3+echo;
    dummy.position.set(actor.from[0]+dx*t,actor.from[1],actor.from[2]+dz*t);
    dummy.rotation.set(0,rotation,0);
    dummy.scale.set(actor.scale,actor.scale,actor.scale*(1+echo*.18));dummy.updateMatrix();
    pool.mesh.setMatrixAt(index,dummy.matrix);pool.alpha.array[index]=strength*[1,.25,.09][echo];
   }
  }
  for(const pool of [people,cars]){
   pool.mesh.visible=pool.alpha.array.some(alpha=>alpha>.002);pool.material.uniforms.day.value=day;
   pool.alpha.needsUpdate=true;pool.mesh.instanceMatrix.needsUpdate=true;
  }
 }
 function update(seconds,{day=1,enabled=true,reducedMotion=false}={}){
  if(!enabled||reducedMotion){if(enabledLast)clear();enabledLast=false;return;}
  const daylight=day>=.98,night=day<=.02;
  if(!enabledLast){nextIn=daylight?1.6:3.2;enabledLast=true;}
  if((daylight||night)&&mode!==daylight){mode=daylight;nextIn=Math.max(nextIn,daylight?1.6:3.2);}
  const dt=Number.isFinite(seconds)?Math.max(0,Math.min(seconds,1)):0;clock+=dt;
  for(const actor of actors)if(actor.active){actor.age+=dt;if(actor.age>=actor.duration)actor.active=false;}
  if(daylight||night){
   nextIn-=dt;
   if(nextIn<=0){
    // No catch-up spawning after a hidden tab, slow frame, or paused tour.
    eventNumber++;const car=daylight&&eventNumber%3===1,reverse=random()>.5;
    const route=car?'street':(random()>.75?'approach':'promenade');
    spawn(car?'car':'person',route,reverse);
    // Occasionally two people pass one another; most moments are solitary.
    if(!car&&daylight&&random()>.78)spawn('person','promenade',!reverse,.10);
    nextIn=daylight?2.9+random()*2.9:6+random()*4.5;
   }
  }
  paint(day);
 }
 return {group:root,update,routes,get diagnostics(){return {clock,nextIn,mode:mode===null?'waiting':mode?'day':'night',spawned:{...spawned},
  active:actors.filter(a=>a.active).map(a=>({kind:a.kind,route:a.route,age:a.age,duration:a.duration,from:a.from,to:a.to})),
  visibleMeshes:Number(people.mesh.visible)+Number(cars.mesh.visible),maxDrawCallsPerPass:2,instances:9,
  peakOpacity:Math.max(...people.alpha.array,...cars.alpha.array)};},
  dispose(){root.removeFromParent();for(const pool of [people,cars]){pool.geometry.dispose();pool.material.dispose();}}
 };
}
