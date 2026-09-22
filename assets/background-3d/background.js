import * as THREE from './vendor/three.module.js';
import * as C from './vendor/cannon-es.js';
import {makeShape} from './physics-shapes.js';
export function initBackground(){
const canvas=document.getElementById('portfolio-geometry-field');
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
renderer.setClearColor(0,0);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.1,80);
camera.position.z=8;
const world=new C.World({gravity:new C.Vec3(0,0,0)});
world.solver.iterations=18;
world.defaultContactMaterial.friction=.16;
world.defaultContactMaterial.restitution=.72;
world.defaultContactMaterial.contactEquationStiffness=1e7;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let w=innerWidth,h=innerHeight,mode='mix',intensity=.6,paused=motion.matches,time=0,last=0,frame=0;
let bodies=[],walls=[],pointer={active:false,pressed:false,x:0,y:0,vx:0,vy:0,last:0},theme={line:0x8ea7ff,node:0x84eeff,pointer:0x89f7d1};
const rand=(a,b)=>a+Math.random()*(b-a),cursor=document.querySelector('[data-cursor-light]');
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),tmp=new THREE.Vector3();
const layout=[['sphere',.88,.40,.16],['cube',.10,.26,.135],['torus',.12,.79,.145],['octa',.78,.12,.085],['tetra',.31,.56,.07],['prism',.89,.85,.09],['helix',.48,.15,.075],['torus',.64,.72,.065],['octa',.07,.52,.07]];
// Fade only pixels behind content, leaving the same body visible outside it.
const panelMask={
 studyPanels:{value:Array.from({length:12},()=>new THREE.Vector4())},
 studyPanelCount:{value:0},studyViewport:{value:new THREE.Vector3()}
};
const panelElements=[...document.querySelectorAll('.topbar,main > section,footer')];
let panelRects=[],panelStamp=-Infinity,panelOnly=false;
function maskMaterial(material){
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,panelMask);
  shader.fragmentShader=`uniform vec4 studyPanels[12];
uniform int studyPanelCount;
uniform vec3 studyViewport;
float studyVisibility(){
 vec2 pixel=vec2(gl_FragCoord.x/studyViewport.z,studyViewport.y-gl_FragCoord.y/studyViewport.z);
 float visibility=1.0;
 for(int i=0;i<12;i++){
  if(i>=studyPanelCount)break;
  vec4 panel=studyPanels[i];
  vec2 halfSize=panel.zw*0.5;
  float radius=min(24.0,min(halfSize.x,halfSize.y));
  vec2 q=abs(pixel-(panel.xy+halfSize))-halfSize+radius;
  float distanceToPanel=length(max(q,0.0))+min(max(q.x,q.y),0.0)-radius;
  visibility=min(visibility,mix(0.025,1.0,smoothstep(-3.0,18.0,distanceToPanel)));
 }
 return visibility;
}
`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','diffuseColor.a *= studyVisibility();\n#include <opaque_fragment>');
 };
 material.customProgramCacheKey=()=> 'content-panel-fade-v1';
}
function updatePanelMask(){
 const now=performance.now(),only=false;
 if(now-panelStamp>60||only!==panelOnly){
  panelOnly=only;panelStamp=now;
  panelRects=panelElements.filter(el=>!only||el.id==='background-picker').map(el=>el.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0&&r.bottom>0&&r.top<h&&r.right>0&&r.left<w).slice(0,12);
  panelMask.studyPanelCount.value=panelRects.length;
  panelRects.forEach((r,i)=>panelMask.studyPanels.value[i].set(r.left,r.top,r.width,r.height));
 }
 panelMask.studyViewport.value.set(w,h,renderer.getPixelRatio());
 if(cursor){const inside=panelRects.some(r=>pointer.x>=r.left&&pointer.x<=r.right&&pointer.y>=r.top&&pointer.y<=r.bottom);cursor.style.opacity=pointer.active&&inside?'0.02':'';}
}
const linkGeometry=new THREE.BufferGeometry();linkGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(60),3));linkGeometry.setDrawRange(0,0);
const links=new THREE.LineSegments(linkGeometry,new THREE.LineBasicMaterial({color:theme.pointer,transparent:true,opacity:.6,depthTest:true}));scene.add(links);
const anchorGeometry=new THREE.BufferGeometry();anchorGeometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3));
const anchorDot=new THREE.Points(anchorGeometry,new THREE.PointsMaterial({color:theme.pointer,size:.075,transparent:true,opacity:.92,depthTest:true,depthWrite:false}));anchorDot.visible=false;scene.add(anchorDot);
const endpointGeometry=new THREE.BufferGeometry();endpointGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(30),3));endpointGeometry.setDrawRange(0,0);
const endpointDots=new THREE.Points(endpointGeometry,new THREE.PointsMaterial({color:theme.pointer,size:.06,transparent:true,opacity:.9,depthTest:true,depthWrite:false}));endpointDots.visible=false;scene.add(endpointDots);
const dustGeometry=new THREE.BufferGeometry(),dustPositions=[];
for(let i=0;i<70;i++)dustPositions.push(rand(-8,8),rand(-6,6),rand(-3,1));
dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));
const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:theme.node,size:.023,transparent:true,opacity:.22}));scene.add(dust);
maskMaterial(links.material);maskMaterial(anchorDot.material);maskMaterial(endpointDots.material);maskMaterial(dust.material);
function clearBodies(){for(const o of bodies){world.removeBody(o.body);scene.remove(o.group);o.group.traverse(v=>{v.geometry?.dispose();v.material?.dispose();});}bodies=[];}
function build(){
 clearBodies();
 const specs=mode==='none'?[]:layout.slice(0,mode==='mix'?(w<650?5:9):3);
 specs.forEach(([kind,x,y,size],i)=>{
  const type=mode==='mix'?kind:mode,r=Math.min(w,h)/100*size;
  const {geometry,body}=makeShape(type,r);
  const group=new THREE.Group();
  const lines=new THREE.LineSegments(type==='cube'||type==='prism'?new THREE.EdgesGeometry(geometry):new THREE.WireframeGeometry(geometry),new THREE.LineBasicMaterial({color:theme.line,transparent:true,opacity:intensity*.6}));
  const dots=new THREE.Points(geometry.clone(),new THREE.PointsMaterial({color:theme.node,size:.026,transparent:true,opacity:intensity}));
  maskMaterial(lines.material);maskMaterial(dots.material);
  // This mesh is only a raycast target. Never render faces or write their
  // depth: both the front and rear wireframes must remain visible.
  const surface=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false}));
  surface.visible=false;
  lines.material.depthWrite=false;
  dots.material.depthWrite=false;
  group.add(surface,lines,dots);scene.add(group);
  body.position.set((x-.5)*w/100,(.5-y)*h/100,i<3?0:rand(-1.4,-.3));body.quaternion.setFromEuler(rand(0,1),rand(0,1),rand(0,1));body.angularVelocity.set(rand(-.13,.13),rand(-.16,.16),rand(-.07,.07));world.addBody(body);
  const linkVertices=[],seenVertices=new Set(),positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++){const v=new THREE.Vector3().fromBufferAttribute(positions,i);const key=v.toArray().map(n=>n.toFixed(3)).join(',');if(!seenVertices.has(key)){seenVertices.add(key);linkVertices.push(v);}}
  const item={body,group,surface,lines,dots,geometry,linkVertices,r,x,y,z:body.position.z,phase:rand(0,6.28),speed:rand(.21,.46),angle:rand(0,6.28),reach:rand(.12,.6),spin:body.angularVelocity.clone(),flash:0};surface.userData.item=item;
  body.addEventListener('collide',e=>{if(Math.abs(e.contact.getImpactVelocityAlongNormal())>.3)item.flash=1;});bodies.push(item);
 });
 sync();
}
function boundaries(){
 walls.forEach(b=>world.removeBody(b));walls=[];
 const wall=(x,y,z,axis,angle)=>{const b=new C.Body({mass:0,shape:new C.Plane()});b.position.set(x,y,z);if(axis)b.quaternion.setFromAxisAngle(axis,angle);world.addBody(b);walls.push(b);};
 wall(0,0,-3.8,null,0);wall(0,0,3.6,new C.Vec3(0,1,0),Math.PI);
 wall(-w/200-1,0,0,new C.Vec3(0,1,0),Math.PI/2);wall(w/200+1,0,0,new C.Vec3(0,1,0),-Math.PI/2);
 wall(0,-h/200-1,0,new C.Vec3(1,0,0),-Math.PI/2);wall(0,h/200+1,0,new C.Vec3(1,0,0),Math.PI/2);
}
function resize(){w=innerWidth;h=innerHeight;camera.aspect=w/h;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(h/200/8));camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.setSize(w,h);boundaries();build();render();}
function sync(){for(const o of bodies){o.group.position.copy(o.body.position);o.group.quaternion.copy(o.body.quaternion);}scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}
function pointerPush(dt){
 if(!pointer.active)return;
 ray.setFromCamera(ndc,camera);
 const hit=ray.intersectObjects(bodies.filter(o=>o.group.visible).map(o=>o.surface),false)[0];
 if(!hit)return;
 const o=hit.object.userData.item,speed=Math.min(14,Math.hypot(pointer.vx,pointer.vy));
 // Apply force at the actual ray/mesh surface hit, causing real torque.
 const force=new C.Vec3(pointer.vx*2.0,pointer.vy*2.0,pointer.pressed?-(3+speed*.6)*o.body.mass:0);
 const offset=new C.Vec3(hit.point.x-o.body.position.x,hit.point.y-o.body.position.y,hit.point.z-o.body.position.z);
 o.body.applyImpulse(force.scale(dt),offset);o.flash=Math.max(o.flash,.4);
}
function animatePhysics(dt){
 for(const o of bodies){
  const direction=o.angle,px=pointer.active?ndc.x:0,py=pointer.active?ndc.y:0;
  const anchor=new C.Vec3((o.x-.5)*w/100+Math.sin(time*o.speed+o.phase)*.60+(px*Math.cos(direction)-py*Math.sin(direction))*o.reach,(.5-o.y)*h/100+Math.cos(time*o.speed*.8+o.phase)*.68+(px*Math.sin(direction)+py*Math.cos(direction))*o.reach,o.z+Math.sin(time*o.speed*.65+o.phase)*.85);
  const diff=anchor.vsub(o.body.position);o.body.applyForce(diff.scale(o.body.mass*.32));
  o.body.torque.vadd(o.spin.scale(.035),o.body.torque);
 }
 const steps=Math.max(1,Math.ceil(dt*120));for(let i=0;i<steps;i++){pointerPush(dt/steps);world.step(dt/steps);sync();}
 pointer.vx*=Math.exp(-9*dt);pointer.vy*=Math.exp(-9*dt);
 for(const o of bodies){o.flash*=Math.exp(-4*dt);const depth=THREE.MathUtils.clamp((o.body.position.z+5)/6,.3,1.3);o.lines.material.opacity=intensity*(.8*depth+.2*o.flash);o.dots.material.opacity=Math.min(1,intensity*(1.15*depth+.22*o.flash));}
}
function drawLinks(){
 if(!pointer.active){linkGeometry.setDrawRange(0,0);endpointGeometry.setDrawRange(0,0);anchorDot.visible=false;endpointDots.visible=false;return;}
 const candidates=[];
 for(const o of bodies){for(const v of o.linkVertices){const worldPoint=v.clone().applyMatrix4(o.group.matrixWorld),screen=worldPoint.clone().project(camera),d=Math.hypot((screen.x-ndc.x)*w/2,(screen.y-ndc.y)*h/2);if(d<180)candidates.push({point:worldPoint,d});}}

 const dp=dust.geometry.attributes.position;for(let i=0;i<dp.count;i++){const point=new THREE.Vector3().fromBufferAttribute(dp,i),p=point.clone().project(camera),d=Math.hypot((p.x-ndc.x)*w/2,(p.y-ndc.y)*h/2);if(d<180)candidates.push({point,d});}
 candidates.sort((a,b)=>a.d-b.d);const chosen=candidates.slice(0,10),positions=linkGeometry.attributes.position;
 if(!chosen.length){linkGeometry.setDrawRange(0,0);endpointGeometry.setDrawRange(0,0);anchorDot.visible=false;endpointDots.visible=false;return;}
 ray.setFromCamera(ndc,camera);const z=chosen.length?chosen[0].point.z:0;const anchor=ray.ray.at((z-camera.position.z)/ray.ray.direction.z,new THREE.Vector3());
 anchorGeometry.attributes.position.setXYZ(0,anchor.x,anchor.y,anchor.z+.01);anchorGeometry.attributes.position.needsUpdate=true;anchorDot.visible=true;
 const endpoints=endpointGeometry.attributes.position;
 chosen.forEach((p,i)=>{positions.setXYZ(i*2,anchor.x,anchor.y,anchor.z+.01);positions.setXYZ(i*2+1,p.point.x,p.point.y,p.point.z);endpoints.setXYZ(i,p.point.x,p.point.y,p.point.z);});
 positions.needsUpdate=true;endpoints.needsUpdate=true;linkGeometry.setDrawRange(0,chosen.length*2);endpointGeometry.setDrawRange(0,chosen.length);endpointDots.visible=true;links.frustumCulled=false;endpointDots.frustumCulled=false;
}
function render(){updatePanelMask();sync();drawLinks();renderer.render(scene,camera);}
function tick(now){frame=0;if(paused||document.hidden)return;const dt=last?Math.min((now-last)/1000,.04):1/120;last=now;time+=dt;camera.position.x+=((pointer.active?ndc.x*.3:0)-camera.position.x)*.035;camera.position.y+=((pointer.active?ndc.y*.2:0)-camera.position.y)*.035;camera.lookAt(0,0,0);animatePhysics(dt);render();frame=requestAnimationFrame(tick);}
function start(){if(!frame&&!paused&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}}
function pause(value){paused=value;cancelAnimationFrame(frame);frame=0;render();start();}
function colors(){const css=getComputedStyle(document.body);for(const [key,prop] of [['line','--signal-link-rgb'],['node','--signal-node-rgb'],['pointer','--signal-pointer-rgb']])theme[key]=new THREE.Color(`rgb(${css.getPropertyValue(prop).trim()})`);for(const o of bodies){o.lines.material.color.copy(theme.line);o.dots.material.color.copy(theme.node);}links.material.color.copy(theme.pointer);anchorDot.material.color.copy(theme.pointer);endpointDots.material.color.copy(theme.pointer);dust.material.color.copy(theme.node);render();}
addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const dt=Math.max(.012,(e.timeStamp-pointer.last)/1000);if(pointer.active){pointer.vx=THREE.MathUtils.clamp((e.clientX-pointer.x)/100/dt,-14,14);pointer.vy=THREE.MathUtils.clamp(-(e.clientY-pointer.y)/100/dt,-14,14);}Object.assign(pointer,{active:true,x:e.clientX,y:e.clientY,last:e.timeStamp});ndc.set(e.clientX/w*2-1,1-e.clientY/h*2);document.body.classList.toggle('is-pointer-active',pointer.active);if(cursor)cursor.style.transform=`translate3d(${e.clientX-140}px,${e.clientY-140}px,0)`;if(paused)render();},{passive:true});
addEventListener('pointerdown',e=>{
 if(e.pointerType==='touch'||e.button!==0||e.target.closest('button,a,input,textarea,select'))return;
 pointer.pressed=true;pointer.active=true;pointer.x=e.clientX;pointer.y=e.clientY;pointer.last=e.timeStamp;
 ndc.set(e.clientX/w*2-1,1-e.clientY/h*2);
});
addEventListener('pointerup',e=>{if(e.button===0)pointer.pressed=false;});
addEventListener('pointercancel',()=>{pointer.pressed=false;});
// Recover even when the button was released outside this window.
addEventListener('pointermove',e=>{if(!(e.buttons&1))pointer.pressed=false;},{passive:true});
function clearPointer(){pointer.active=false;pointer.pressed=false;pointer.vx=pointer.vy=0;document.body.classList.remove('is-pointer-active');if(paused)render();}
document.documentElement.addEventListener('pointerleave',clearPointer);addEventListener('blur',clearPointer);
addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;start();});motion.addEventListener('change',e=>pause(e.matches));new MutationObserver(colors).observe(document.body,{attributes:true,attributeFilter:['data-theme']});
addEventListener('scroll',()=>{panelStamp=-Infinity;if(paused)render();},{passive:true});
new ResizeObserver(()=>{panelStamp=-Infinity;if(paused)render();}).observe(document.querySelector('main'));
resize();colors();pause(paused);
}
