// A reversible, studio-local walk keeps the camera clear of the desk and server.
export function createStudioVisit({THREE,camera,controls,door,studioGroup,reducedMotion,onChange=()=>{},wake=()=>{}}){
 let state='exterior',saved=null,segments=[],history=[],segment=null;
 const constraintNames=['enabled','enableDamping','enableZoom','minDistance','maxDistance','minPolarAngle','maxPolarAngle','minAzimuthAngle','maxAzimuthAngle'];
 const world=values=>studioGroup.localToWorld(new THREE.Vector3(...values));
 const pose=(position,target,duration= .85)=>({position:world(position),target:world(target),duration});
 const destination=pose([.25,2.48,-1.05],[.25,1.75,-2.42]);
 function snapshot(){return {position:camera.position.clone(),target:controls.target.clone(),fov:camera.fov};}
 function indoorFov(){const distance=destination.position.distanceTo(destination.target);return THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2*Math.atan(2.8/(2*distance*camera.aspect))),58,88);}
 function setState(next){state=next;onChange(next);wake();}
 function apply(pose){camera.position.copy(pose.position);controls.target.copy(pose.target);camera.fov=pose.fov??indoorFov();camera.updateProjectionMatrix();camera.lookAt(controls.target);}
 function unlock(){controls.enableDamping=false;controls.update();controls.enabled=false;controls.enableZoom=false;controls.minDistance=0;controls.maxDistance=Infinity;controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI;controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;}
 function startNext(){segment=segments.shift();if(segment){segment.from=snapshot();segment.age=0;}}
 function complete(){
  if(state==='entering'){apply(destination);setState('interior');}
  else if(state==='exiting'){apply(saved);Object.assign(controls,saved.constraints);controls.update();door.setOpen(false);saved=null;history=[];setState('exterior');}
 }
 function enter(){
  if(state!=='exterior')return;
  saved={...snapshot(),constraints:Object.fromEntries(constraintNames.map(name=>[name,controls[name]]))};
  unlock();history=[snapshot()];door.setOpen(true);door.setHovered(false);setState('entering');
  const startLocal=studioGroup.worldToLocal(camera.position.clone());
  segments=[];
  if(startLocal.z<1.8)segments.push(pose([4.8,7,6],[1.8,1.6,.5],.8));
  segments.push(pose([3.1,2.16,3.6],[3.1,1.92,1.4],1.1),pose([3.1,2.12,.8],[2.55,1.9,-.6],.85),pose([2.7,2.2,-1.3],[.9,1.78,-2.42],.85),{...destination,duration:1.0});
  startNext();if(reducedMotion())update(0,true);
 }
 function exit({immediate=false}={}){
  if(state==='exterior'||state==='exiting'&&!immediate)return;
  const returnPath=state==='interior'?history.slice(0,-1):history.slice();
  segments=returnPath.reverse().map(p=>({...p,duration:.7}));
  if(!segments.length||!segments.at(-1).position.equals(saved.position))segments.push({...saved,duration:.9});
  segment=null;setState('exiting');startNext();
  if(immediate||reducedMotion())update(0,true);
 }
 function update(dt,reduced=false){
  if(state!=='entering'&&state!=='exiting')return false;
  if(reduced){
   // Keep the safe reverse route even if the visitor later re-enables motion.
   if(state==='entering')history.push(...[segment,...segments].filter(Boolean).map(p=>({position:p.position.clone(),target:p.target.clone(),fov:indoorFov()})));
   segments=[];segment=null;complete();door.update(0,true);return true;
  }
  if(!segment){complete();return true;}
  segment.age=Math.min(segment.duration,segment.age+dt);const t=segment.age/segment.duration,e=t*t*(3-2*t);
  camera.position.lerpVectors(segment.from.position,segment.position,e);controls.target.lerpVectors(segment.from.target,segment.target,e);
  const fov=state==='exiting'?(segment.fov??indoorFov()):indoorFov();camera.fov=THREE.MathUtils.lerp(segment.from.fov,fov,e);camera.updateProjectionMatrix();camera.lookAt(controls.target);
  if(t===1){if(state==='entering')history.push(snapshot());startNext();if(!segment)complete();}
  return true;
 }
 function resize(){if(state==='interior'){camera.fov=indoorFov();camera.updateProjectionMatrix();}}
 return {enter,exit,update,resize,get state(){return state;},get active(){return state!=='exterior';},get moving(){return state==='entering'||state==='exiting';},dispose(){segments=[];segment=null;}};
}
