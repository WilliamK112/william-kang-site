// A reversible, studio-local walk keeps the camera clear of the desk and server.
export function createStudioVisit({THREE,camera,controls,door,studioGroup,reducedMotion,onChange=()=>{},wake=()=>{}}){
 let state='exterior',saved=null,segments=[],history=[],segment=null,currentNode=null,pendingNode=null,exteriorReturn=[];
 // Only these clear aisles are walkable. No continuous collision simulation.
 const nodes=[
  {id:'lectern',label:'Lectern',position:[.25,2.48,-1.40],floorY:.35,neighbors:['aisle']},
  {id:'aisle',label:'Side aisle',position:[2.7,2.2,-1.3],floorY:.35,neighbors:['lectern','entry']},
  {id:'entry',label:'Doorway',position:[3.1,2.12,.8],floorY:.35,neighbors:['aisle','window']},
  {id:'window',label:'Window',position:[-.25,2.12,1.02],floorY:.378,neighbors:['entry']}
 ];
 const nodeById=new Map(nodes.map(node=>[node.id,node]));
 const constraintNames=['enabled','enableDamping','enableZoom','minDistance','maxDistance','minPolarAngle','maxPolarAngle','minAzimuthAngle','maxAzimuthAngle'];
 const world=values=>studioGroup.localToWorld(new THREE.Vector3(...values));
 const pose=(position,target,duration= .85)=>({position:world(position),target:world(target),duration});
 const destination=pose(nodes[0].position,[.25,1.75,-2.42]);
 function snapshot(){return {position:camera.position.clone(),target:controls.target.clone(),fov:camera.fov};}
 function indoorFov(){const distance=destination.position.distanceTo(destination.target);return THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2*Math.atan(2.8/(2*distance*camera.aspect))),58,88);}
 function setState(next){state=next;onChange(next);wake();}
 function apply(pose){camera.position.copy(pose.position);controls.target.copy(pose.target);camera.fov=pose.fov??indoorFov();camera.updateProjectionMatrix();camera.lookAt(controls.target);}
 function unlock(){controls.enableDamping=false;controls.update();controls.enabled=false;controls.enableZoom=false;controls.minDistance=0;controls.maxDistance=Infinity;controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI;controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;}
 function startNext(){segment=segments.shift();if(segment){segment.from=snapshot();segment.age=0;}}
 function complete(){
  if(state==='entering'){apply(destination);currentNode='lectern';setState('interior');}
  else if(state==='relocating'){currentNode=pendingNode;pendingNode=null;setState('interior');}
  else if(state==='exiting'){apply(saved);Object.assign(controls,saved.constraints);controls.update();door.setOpen(false);saved=null;history=[];exteriorReturn=[];currentNode=pendingNode=null;setState('exterior');}
 }
 function enter(){
  if(state!=='exterior')return;
  saved={...snapshot(),constraints:Object.fromEntries(constraintNames.map(name=>[name,controls[name]]))};
  unlock();history=[snapshot()];door.setOpen(true);door.setHovered(false);setState('entering');
  const startLocal=studioGroup.worldToLocal(camera.position.clone());
  segments=[];currentNode=pendingNode=null;
  if(startLocal.z<1.8)segments.push(pose([4.8,7,6],[1.8,1.6,.5],.8));
  segments.push(pose([3.1,2.16,3.6],[3.1,1.92,1.4],1.1));
  exteriorReturn=[saved,...segments.map(p=>({...p,fov:indoorFov()}))];
  segments.push(pose(nodeById.get('entry').position,[2.55,1.9,-.6],.85),pose(nodeById.get('aisle').position,[.9,1.78,-2.42],.85),{...destination,duration:1.0});
  startNext();if(reducedMotion())update(0,true);
 }
 function moveTo(id){
  if(state!=='interior'||!nodeById.get(currentNode)?.neighbors.includes(id))return false;
  const direction=controls.target.clone().sub(camera.position);
  const position=world(nodeById.get(id).position);
  pendingNode=id;segments=[{position,target:position.clone().add(direction),fov:camera.fov,duration:.65}];
  segment=null;setState('relocating');startNext();if(reducedMotion())update(0,true);return true;
 }
 function routeToEntry(from){
  const queue=[[from]],seen=new Set([from]);
  while(queue.length){const path=queue.shift(),id=path.at(-1);if(id==='entry')return path;
   for(const next of nodeById.get(id)?.neighbors||[])if(!seen.has(next)){seen.add(next);queue.push([...path,next]);}
  }
  return [];
 }
 function exit({immediate=false}={}){
  if(state==='exterior'||state==='exiting'&&!immediate)return;
  if(state==='interior'||state==='relocating'){
   const wasMoving=state==='relocating',from=wasMoving?pendingNode:currentNode;
   const direction=controls.target.clone().sub(camera.position),path=routeToEntry(from);
   segments=path.slice(wasMoving?0:1).map(id=>{const position=world(nodeById.get(id).position);return {position,target:position.clone().add(direction),fov:camera.fov,duration:.55};});
   segments.push(...exteriorReturn.slice().reverse().map(p=>({...p,duration:.65})));
  }else segments=history.slice().reverse().map(p=>({...p,duration:.7}));
  if(!segments.length||!segments.at(-1).position.equals(saved.position))segments.push({...saved,duration:.9});
  segment=null;setState('exiting');startNext();
  if(immediate||reducedMotion())update(0,true);
 }
 function update(dt,reduced=false){
  if(state!=='entering'&&state!=='relocating'&&state!=='exiting')return false;
  if(reduced){
   // Keep the safe reverse route even if the visitor later re-enables motion.
   if(state==='entering')history.push(...[segment,...segments].filter(Boolean).map(p=>({position:p.position.clone(),target:p.target.clone(),fov:indoorFov()})));
   if(state==='relocating')apply(segments.at(-1)||segment);
   segments=[];segment=null;complete();door.update(0,true);return true;
  }
  if(!segment){complete();return true;}
  segment.age=Math.min(segment.duration,segment.age+dt);const t=segment.age/segment.duration,e=t*t*(3-2*t);
  camera.position.lerpVectors(segment.from.position,segment.position,e);controls.target.lerpVectors(segment.from.target,segment.target,e);
  const fov=segment.fov??indoorFov();camera.fov=THREE.MathUtils.lerp(segment.from.fov,fov,e);camera.updateProjectionMatrix();camera.lookAt(controls.target);
  if(t===1){if(state==='entering')history.push(snapshot());startNext();if(!segment)complete();}
  return true;
 }
 function resize(){if(state==='interior'){camera.fov=indoorFov();camera.updateProjectionMatrix();}}
 return {enter,exit,moveTo,update,resize,nodes,get currentNode(){return currentNode;},get state(){return state;},get active(){return state!=='exterior';},get moving(){return state==='entering'||state==='relocating'||state==='exiting';},dispose(){segments=[];segment=null;}};
}
