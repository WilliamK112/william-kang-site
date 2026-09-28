import {buildStreetCarGeometry} from './street-car.js';

// Long-exposure impressions of campus life. Reused people and vehicle pools,
// no shadow casters, new lights, textures, timers, or separate animation loop.
export function buildStreetLife({THREE,scene,mergeGeometries}) {
 const root=new THREE.Group();root.name='Passing moments';root.userData.dynamic=true;scene.add(root);
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 const dummy=new THREE.Object3D(),parts=[];
 const colors={coat:0xb88a65,trousers:0x415a6b,skin:0xd9b99b,bag:0x506764};
 function part(geometry,color,position,scale=[1,1,1],rotation=[0,0,0],joint=0){
  dummy.position.set(...position);dummy.scale.set(...scale);dummy.rotation.set(...rotation);dummy.updateMatrix();
  let g=geometry.index?geometry.toNonIndexed():geometry.clone();geometry.dispose();g.applyMatrix4(dummy.matrix);
  // Bake a little cel-like directional shading into the vertex colors.
  const channel=color===colors.coat?1:color===colors.trousers?2:color===colors.bag?3:0;
  const base=new THREE.Color(channel?0xffffff:color),normal=g.getAttribute('normal'),rgb=new Float32Array(normal.count*3);
  for(let i=0;i<normal.count;i++){const shade=.72+.28*Math.max(0,normal.getY(i));rgb.set([base.r*shade,base.g*shade,base.b*shade],i*3);}
  g.setAttribute('color',new THREE.BufferAttribute(rgb,3));g.setAttribute('joint',new THREE.BufferAttribute(new Float32Array(normal.count).fill(joint),1));g.setAttribute('garment',new THREE.BufferAttribute(new Float32Array(normal.count).fill(channel),1));g.deleteAttribute('uv');parts.push(g);
 }
 function box(color,position,scale,rotation,joint=0){part(new THREE.BoxGeometry(1,1,1),color,position,scale,rotation,joint);}
 function collect(){const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());parts.length=0;return geometry;}
 // Anonymous, slightly elongated silhouettes; no facial detail at this scale.
 part(new THREE.SphereGeometry(.13,8,6),colors.skin,[0,1.41,.025],[.87,1.13,.94]);
 part(new THREE.SphereGeometry(.134,8,5,0,Math.PI*2,0,Math.PI*.52),0x354047,[0,1.433,.016],[.91,1.02,.95]);
 part(new THREE.CylinderGeometry(.06,.065,.09,7),colors.skin,[0,1.267,.015]);
 part(new THREE.CylinderGeometry(.16,.13,.46,7),colors.coat,[0,1.03,0],[1,1,.8],[.08,0,0]);
 box(colors.coat,[0,.80,0],[.27,.15,.24]);
 for(const side of [-1,1]){
  const left=side<0;
  box(colors.trousers,[side*.085,.565,0],[.105,.36,.13],undefined,left?1:3);
  box(colors.trousers,[side*.085,.205,0],[.098,.36,.115],undefined,left?2:4);
  // Shoes are authored relative to the straight-leg ankle, then positioned by
  // the gait shader. The stance sole stays at pavement height while it plants.
  box(0x526874,[side*.085,-.01,.055],[.12,.07,.22],undefined,left?7:8);
  box(colors.coat,[side*.205,1.01,0],[.095,.44,.105],undefined,left?5:6);
  part(new THREE.SphereGeometry(.053,7,5),colors.skin,[side*.205,.762,0],[.8,1.1,.8],[0,0,0],left?5:6);
 }
 box(colors.bag,[0,1.06,-.17],[.22,.27,.105]);
 for(const side of [-1,1])box(0x405655,[side*.097,1.10,.106],[.026,.30,.026]);
 const personGeometry=collect();
 function pool(geometry,count,walking=false){
  if(!geometry.hasAttribute('garment'))geometry.setAttribute('garment',new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').count),1));
  const alpha=new THREE.InstancedBufferAttribute(new Float32Array(count),1);alpha.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('momentAlpha',alpha);
  const phase=new THREE.InstancedBufferAttribute(new Float32Array(count),1);phase.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('momentPhase',phase);
  const outfit=new THREE.InstancedBufferAttribute(new Float32Array(count*3).fill(1),3);outfit.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('momentOutfit',outfit);
  const accent=new THREE.InstancedBufferAttribute(new Float32Array(count*3).fill(1),3);accent.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('momentAccent',accent);
  const detail=new THREE.InstancedBufferAttribute(new Float32Array(count*3).fill(1),3);detail.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('momentDetail',detail);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:true,uniforms:{day:{value:1},walking:{value:walking?1:0}},
   vertexShader:`attribute vec3 color;attribute float momentAlpha;attribute float momentPhase;attribute float joint;attribute float garment;attribute vec3 momentOutfit;attribute vec3 momentAccent;attribute vec3 momentDetail;
    uniform float walking;varying vec3 tint;varying float exposure;
    vec3 turnX(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
    void main(){
     vec3 p=position;float bob=.008*sin(momentPhase*2.);
     if(walking>.5){
      if((joint>.5&&joint<4.5)||joint>6.5){
       bool left=joint<2.5||joint==7.;float side=left?-1.:1.;
       float phase=momentPhase+(left?0.:3.14159265),u=fract(phase/6.28318531);
       float swing=clamp((u-.6)/.4,0.,1.);
       float z=u<.6?mix(.23,-.23,u/.6):mix(-.23,.23,smoothstep(0.,1.,swing));
       vec3 ankle=vec3(side*.085,.075+.115*sin(swing*3.14159265),z);
       vec3 hip=vec3(side*.085,.745+bob,0.);
       float distanceToFoot=clamp(length(ankle.yz-hip.yz),.04,.719);
       float axis=atan(-z,hip.y-ankle.y),bend=acos(distanceToFoot/.72);
       float upper=axis-bend,lower=axis+bend;
       vec3 knee=hip+turnX(vec3(0.,-.36,0.),upper);
       if(joint==1.||joint==3.)p=hip+turnX(position-vec3(side*.085,.745,0.),upper);
       else if(joint==2.||joint==4.)p=knee+turnX(position-vec3(side*.085,.385,0.),lower);
       else p=ankle+turnX(position-vec3(side*.085,.025,0.),-.12*sin(swing*3.14159265));
      }else if(joint>4.5){
       float side=joint==5.?-1.:1.;vec3 shoulder=vec3(side*.205,1.23,0.);
       float phase=momentPhase+(side<0.?0.:3.14159265);
       p=shoulder+turnX(position-shoulder,.34*cos(phase));p.y+=bob;
      }else p.y+=bob;
     }
     tint=color*(garment<.5?vec3(1.):garment<1.5?momentOutfit:garment<2.5?momentAccent:momentDetail);exposure=momentAlpha;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.);
    }`,
   fragmentShader:`uniform float day;varying vec3 tint;varying float exposure;
    void main(){if(exposure<.002)discard;vec3 night=mix(tint,vec3(.22,.32,.39),.50);
     gl_FragColor=vec4(mix(night,tint,day),exposure);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`});
  const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled=false;mesh.visible=false;mesh.raycast=()=>{};root.add(mesh);
  return {mesh,alpha,phase,outfit,accent,detail,material,geometry};
 }
 const people=pool(personGeometry,8,true);
 people.mesh.name='Pedestrian shutter impressions';
 const vehicleKinds=['sedan','school-bus','pickup','sports'];
 const fleet=vehicleKinds.map(variant=>{
  const item=pool(buildStreetCarGeometry({THREE,mergeGeometries},{kind:variant}),1);
  item.mesh.name=`Car shutter impressions / ${variant}`;item.variant=variant;return item;
 });
 const pools=[people,...fleet];
 const actors=[...Array.from({length:8},(_,slot)=>({kind:'person',slot,pool:people})),...fleet.map(item=>({kind:'car',variant:item.variant,slot:0,pool:item}))];
 let seed=0x73a921;
 function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 // All coordinates are on open paving, away from steps, the terrace and lake.
 const routes={
  promenade:{from:[-4.05,.045,3.33],to:[1.80,.045,3.33]},
  approach:{from:[2.72,.045,2.35],to:[2.72,.045,-.85]},
  // Endpoints bound the whole vehicle, rather than just its center.
  street:{from:[-7.45,.024,6.40],to:[6.00,.024,6.40]}
 };
 // Random headings within clear walking areas replace a repeated two-lane loop.
 const walkingZones=[
  {id:'forecourt',minX:-4.1,maxX:3.65,minZ:3.50,maxZ:4.60},
  {id:'leftWalk',minX:-6.25,maxX:-4.90,minZ:3.60,maxZ:4.60},
  {id:'campusWalk',minX:2.60,maxX:3.55,minZ:-.95,maxZ:2.55}
 ];
 const look=(name,primary,accent,detail=0x506764)=>({name,primary:new THREE.Color(primary).toArray(),accent:new THREE.Color(accent).toArray(),detail:new THREE.Color(detail).toArray()});
 const wardrobes=[
  look('scarlet / navy',0xb95351,0x364658,0xd0b183),look('blue / sand',0x4f7dac,0xa49780,0x495b53),
  look('gold / indigo',0xc6a049,0x415774,0x99594b),look('sage / charcoal',0x709577,0x484c55,0xc5a27b),
  look('violet / navy',0x927ba6,0x394c5c,0x6c8990),look('ivory / olive',0xd9cdb4,0x63715c,0xa75949),
  look('coral / denim',0xcb806e,0x587689,0x796b92),look('teal / stone',0x4d9695,0x999588,0xc89555),
  look('ochre / blue',0xb98c57,0x405d7b,0x718670),look('slate / cream',0x646c7e,0xc2b69e,0xb57567)
 ];
 const carPaints=[
  look('cherry',0xb95454,0xe1d7c4),look('ocean',0x557d9d,0xabbec4),look('jade',0x5c9387,0xd5d4be),
  look('pearl',0xdddacf,0x596c78),look('saffron',0xc59a53,0xeee0ba),look('plum',0x8b718b,0xc8b8b2),
  look('graphite',0x53616d,0x9eabb0),look('terracotta',0xb87655,0xddd0b8)
 ];
 const busPaints=[look('school yellow',0xe8ba4c,0xf1d681),look('school gold',0xdca33f,0xf0c969),look('school amber',0xd78e37,0xefbd68)];
 let vehicleBag=[],lastVehicle=null,lastCarPaint=null;
 function chooseVehicle(){
  if(!vehicleBag.length){
   vehicleBag=[...vehicleKinds];
   for(let i=vehicleBag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[vehicleBag[i],vehicleBag[j]]=[vehicleBag[j],vehicleBag[i]];}
   if(vehicleBag.at(-1)===lastVehicle)[vehicleBag[0],vehicleBag[vehicleBag.length-1]]=[vehicleBag.at(-1),vehicleBag[0]];
  }
  lastVehicle=vehicleBag.pop();return lastVehicle;
 }
 let clock=0,nextIn=.8,nextCarIn=2.8,enabledLast=false,mode=null,spawned={person:0,car:0};
 function spawn(kind,route,reverse,delay=0){
  // A single vehicle at a time avoids large buses meeting head-on on this tiny lane.
  if(kind==='car'&&actors.some(item=>item.kind==='car'&&item.active))return;
  const variant=kind==='car'?chooseVehicle():null;
  const actor=actors.find(item=>item.kind===kind&&!item.active&&(!variant||item.variant===variant));if(!actor)return;
  // Adult height is roughly 70% of the studio's 2.75-unit glass doorway.
  // Cars get another 11% increase, with larger buses/trucks authored to scale.
  const duration=1.5+random()*.5,scale=kind==='person'?1.25+random()*.08:2.00;
  const bounds=actor.pool.geometry.boundingBox;
  const groundY=.024-(kind==='person'?.005:bounds.min.y)*scale;
  const speed=kind==='person'?.64+random()*.14:2.7+random()*.5;
  let from,to;
  if(kind==='person'){
   // Headings already cover every direction; do not reverse after checking
   // separation, because that would materialize at the unchecked endpoint.
   reverse=false;
   const choice=random(),zone=walkingZones[choice<.68?0:choice<.83?1:2],travel=speed*duration;
   route=zone.id;
   const occupied=(x,z)=>actors.some(other=>{if(!other.active||other.kind!=='person')return false;const u=Math.max(0,other.age)/other.duration;return Math.hypot(x-(other.from[0]+(other.to[0]-other.from[0])*u),z-(other.from[2]+(other.to[2]-other.from[2])*u))<.85;});
   for(let attempt=0;attempt<40;attempt++){
    const startX=zone.minX+random()*(zone.maxX-zone.minX),startZ=zone.minZ+random()*(zone.maxZ-zone.minZ),heading=random()*Math.PI*2;
    const endX=startX+Math.cos(heading)*travel,endZ=startZ+Math.sin(heading)*travel;
    if(endX<zone.minX||endX>zone.maxX||endZ<zone.minZ||endZ>zone.maxZ)continue;
    if(occupied(startX,startZ))continue;
    from=[startX,groundY,startZ];to=[endX,groundY,endZ];break;
   }
   // Skip a crowded area instead of falling back to one repeated spawn point.
   if(!from)return;
  }else{
   const street=routes[route],halfLength=Math.max(Math.abs(bounds.min.z),Math.abs(bounds.max.z))*scale;
   const path={from:[street.from[0]+halfLength,groundY,street.from[2]],to:[street.to[0]-halfLength,groundY,street.to[2]]};
   const dx=path.to[0]-path.from[0],dz=path.to[2]-path.from[2],length=Math.hypot(dx,dz);
   const fraction=Math.min(1,speed*duration/length),start=random()*(1-fraction);
   const point=t=>[path.from[0]+dx*t,groundY,path.from[2]+dz*t];from=point(start);to=point(start+fraction);
  }
  const palette=kind==='person'?wardrobes:variant==='school-bus'?busPaints:carPaints;
  const available=palette.filter(candidate=>kind==='person'?!actors.some(other=>other.active&&other.kind==='person'&&other.outfit===candidate):candidate!==lastCarPaint);
  const choices=available.length?available:palette,outfit=choices[Math.floor(random()*choices.length)];
  if(kind==='car')lastCarPaint=outfit;
  const peak=kind==='person'?.10+random()*.20:.20+random()*.03;
  Object.assign(actor,{active:true,age:-delay,duration,route,from:reverse?to:from,to:reverse?from:to,
   scale,speed,phase:random()*Math.PI*2,gaitRate:speed*.6/(.46*scale)*Math.PI*2,outfit,peak});
  spawned[kind]++;
 }
 function clear(){actors.forEach(actor=>actor.active=false);for(const pool of pools){pool.mesh.visible=false;pool.alpha.array.fill(0);}}
 function paint(day){
  for(const pool of pools)pool.alpha.array.fill(0);
  for(const actor of actors){
   if(!actor.active||actor.age<0)continue;
   const pool=actor.pool;
   const dx=actor.to[0]-actor.from[0],dz=actor.to[2]-actor.from[2];
   const rotation=Math.atan2(dx,dz),u=actor.age/actor.duration;
   // A single readable silhouette fades smoothly. Duplicate bodies obscured
   // the alternating legs, so the walking motion now supplies the visual blur.
   const envelope=smooth(0,.15,u)*(1-smooth(.77,1,u));
   const strength=actor.peak*envelope*(actor.kind==='car'?smooth(.55,.96,day):.83+.17*day);
   {
    const age=Math.max(0,actor.age),t=age/actor.duration,index=actor.slot;
    dummy.position.set(actor.from[0]+dx*t,actor.from[1],actor.from[2]+dz*t);
    dummy.rotation.set(0,rotation,0);
    dummy.scale.setScalar(actor.scale);dummy.updateMatrix();
    pool.mesh.setMatrixAt(index,dummy.matrix);pool.alpha.array[index]=strength;pool.phase.array[index]=actor.phase+age*actor.gaitRate;
    pool.outfit.array.set(actor.outfit.primary,index*3);pool.accent.array.set(actor.outfit.accent,index*3);pool.detail.array.set(actor.outfit.detail,index*3);
   }
  }
  for(const pool of pools){
   pool.mesh.visible=pool.alpha.array.some(alpha=>alpha>.002);pool.material.uniforms.day.value=day;
   pool.alpha.needsUpdate=true;pool.phase.needsUpdate=true;pool.outfit.needsUpdate=true;pool.accent.needsUpdate=true;pool.detail.needsUpdate=true;pool.mesh.instanceMatrix.needsUpdate=true;
  }
 }
 function update(seconds,{day=1,enabled=true,reducedMotion=false}={}){
  if(!enabled||reducedMotion){if(enabledLast)clear();enabledLast=false;return;}
  const daylight=day>=.98,night=day<=.02;
  if(!enabledLast){nextIn=daylight?.6:1.5;nextCarIn=2.8;enabledLast=true;}
  if((daylight||night)&&mode!==daylight){mode=daylight;nextIn=Math.max(nextIn,daylight?.6:1.5);}
  const dt=Number.isFinite(seconds)?Math.max(0,Math.min(seconds,1)):0;clock+=dt;
  for(const actor of actors)if(actor.active){actor.age+=dt;if(actor.age>=actor.duration)actor.active=false;}
  if(daylight||night){
   nextIn-=dt;
   if(nextIn<=0){
    // No catch-up spawning after a hidden tab, slow frame, or paused tour.
    const count=daylight?(random()<.45?3:2):1;
    for(let i=0;i<count;i++)spawn('person','promenade',random()>.5,i*.045);
    nextIn=daylight?1.1+random()*.4:2.0+random();
   }
   if(daylight){nextCarIn-=dt;if(nextCarIn<=0){spawn('car','street',random()>.5);nextCarIn=2.6+random()*1.3;}}
  }
  paint(day);
 }
 return {group:root,update,routes,get diagnostics(){return {clock,nextIn,mode:mode===null?'waiting':mode?'day':'night',spawned:{...spawned},
  active:actors.filter(a=>a.active).map(a=>({kind:a.kind,variant:a.variant,palette:a.outfit.name,opacityPeak:a.peak,route:a.route,age:a.age,duration:a.duration,from:a.from,to:a.to,scale:a.scale,speed:a.speed,gaitPhase:a.phase+Math.max(0,a.age)*a.gaitRate})),
  visibleMeshes:pools.filter(pool=>pool.mesh.visible).length,maxDrawCallsPerPass:2,instances:12,
  peakOpacity:Math.max(...pools.flatMap(pool=>[...pool.alpha.array]))};},
  dispose(){root.removeFromParent();for(const pool of pools){pool.geometry.dispose();pool.material.dispose();}}
 };
}
